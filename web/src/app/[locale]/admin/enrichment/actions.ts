'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { generateUniqueSlug, generateUniqueCafeSlug } from '@/lib/slug'
import { randomPlaceholder } from '@/lib/enrichment/placeholders'
import type { ActionResult } from '@/types/actions'

// Known fields per entity type — used for schema validation before apply
const ROASTER_FIELDS = new Set([
  'name', 'description', 'foundedYear',
  'country', 'city', 'address', 'lat', 'lng', 'postalCode',
  'website', 'email', 'phone', 'shopUrl',
  'instagram', 'facebook',
  'origins', 'roastStyles', 'certifications', 'brewingMethods',
  'wholesaleAvailable', 'subscriptionAvailable',
  'openingHours', 'hasCafe', 'hasTastingRoom',
])

const CAFE_FIELDS = new Set([
  'name', 'description',
  'country', 'city', 'address', 'lat', 'lng', 'postalCode',
  'website', 'phone', 'email',
  'instagram',
  'openingHours', 'serving', 'services', 'priceRange', 'seatingCapacity',
])

function castValue(value: unknown, fieldKey: string): unknown {
  // lat/lng come as strings from JSON — cast to float
  if ((fieldKey === 'lat' || fieldKey === 'lng') && typeof value === 'string') {
    return parseFloat(value)
  }
  // foundedYear / seatingCapacity as int
  if ((fieldKey === 'foundedYear' || fieldKey === 'seatingCapacity') && typeof value === 'string') {
    return parseInt(value, 10)
  }
  return value
}

export async function updateProposalStatus(
  proposalId: string,
  status: 'APPLIED' | 'REJECTED' | 'SKIPPED',
): Promise<ActionResult> {
  try {
    await requireAdmin()
    await db.enrichmentProposal.update({
      where: { id: proposalId },
      data: { status, reviewedAt: new Date() },
    })
    return { success: true, data: undefined }
  } catch (error) {
    console.error('[updateProposalStatus]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Something went wrong' }
  }
}

export async function bulkApplyByConfidence(
  runId: string,
  threshold: number,
): Promise<ActionResult<{ applied: number }>> {
  try {
    await requireAdmin();

    // Fetch all PENDING proposals above threshold (exclude name changes)
    const proposals = await db.enrichmentProposal.findMany({
      where: {
        runId,
        status: "PENDING",
        confidence: { gte: threshold / 100 },
        fieldKey: { not: "name" }, // name changes require manual review
      },
    });

    if (proposals.length === 0) return { success: true, data: { applied: 0 } };

    // Group by entity and apply each entity's proposals
    const byEntity = new Map<string, typeof proposals>();
    for (const p of proposals) {
      const key = p.entityId ?? p.entityName;
      if (!byEntity.has(key)) byEntity.set(key, []);
      byEntity.get(key)!.push(p);
    }

    let total = 0;
    for (const [, entityProposals] of byEntity) {
      const { entityId, entityType } = entityProposals[0];
      const fieldUpdates: Record<string, unknown> = {};
      for (const p of entityProposals) fieldUpdates[p.fieldKey] = p.proposedValue;

      if (entityType === "CAFE" && entityId) {
        await db.cafe.update({ where: { id: entityId }, data: fieldUpdates });
      } else if (entityType === "ROASTER" && entityId) {
        await db.roaster.update({ where: { id: entityId }, data: fieldUpdates });
      }

      await db.enrichmentProposal.updateMany({
        where: { id: { in: entityProposals.map((p) => p.id) } },
        data: { status: "APPLIED" },
      });

      total += entityProposals.length;
    }

    revalidatePath("/cafes");
    revalidatePath("/roasters");
    revalidatePath("/map");
    revalidatePath(`/admin/enrichment/${runId}`);
    revalidatePath("/admin/enrichment");

    return { success: true, data: { applied: total } };
  } catch (err) {
    console.error("bulkApplyByConfidence error:", err);
    return { success: false, error: "Failed to bulk apply" };
  }
}

export async function applyEnrichmentRun(runId: string): Promise<ActionResult<{ applied: number }>> {
  try {
    const adminId = await requireAdmin()

    const proposals = await db.enrichmentProposal.findMany({
      where: { runId, status: 'APPLIED' },
    })

    if (proposals.length === 0) {
      return { success: true, data: { applied: 0 } }
    }

    // Schema validation — block if unknown field
    for (const p of proposals) {
      const known = p.entityType === 'ROASTER' ? ROASTER_FIELDS : CAFE_FIELDS
      if (!known.has(p.fieldKey)) {
        return {
          success: false,
          error: `Field "${p.fieldKey}" not in schema for ${p.entityType} — run migration first`,
        }
      }
    }

    // Separate NEW_PLACE proposals (discover mode) from FILL/UPDATE
    const fillUpdate = proposals.filter(p => p.changeType !== 'NEW_PLACE')
    const newPlace = proposals.filter(p => p.changeType === 'NEW_PLACE')

    let applied = 0

    // Apply FILL / UPDATE per entity
    const byEntity = new Map<string, typeof fillUpdate>()
    for (const p of fillUpdate) {
      if (!p.entityId) continue
      const key = `${p.entityType}:${p.entityId}`
      if (!byEntity.has(key)) byEntity.set(key, [])
      byEntity.get(key)!.push(p)
    }

    for (const [key, entityProposals] of byEntity.entries()) {
      const [entityType, entityId] = key.split(':')
      const data: Record<string, unknown> = {}
      let oldSlug: string | null = null
      let newSlugCandidate: string | null = null

      for (const p of entityProposals) {
        const rawValue = p.proposedValue as unknown
        const value = castValue(rawValue, p.fieldKey)
        data[p.fieldKey] = value

        if (p.fieldKey === 'name' && p.changeType === 'UPDATE') {
          // We'll handle slug update separately
          newSlugCandidate = typeof rawValue === 'string' ? rawValue : null
        }
      }

      await db.$transaction(async (tx) => {
        if (entityType === 'ROASTER') {
          const current = await tx.roaster.findUnique({
            where: { id: entityId },
            select: { slug: true, city: true, name: true },
          })
          if (!current) return

          if (newSlugCandidate && current) {
            oldSlug = current.slug
            const newSlug = await generateUniqueSlug(newSlugCandidate, current.city)
            data.slug = newSlug
            await tx.slugRedirect.create({
              data: { fromSlug: oldSlug, toSlug: newSlug, entityType: 'roaster' },
            })
          }

          await tx.roaster.update({ where: { id: entityId }, data })
        } else {
          const current = await tx.cafe.findUnique({
            where: { id: entityId },
            select: { slug: true, city: true, name: true },
          })
          if (!current) return

          if (newSlugCandidate && current) {
            oldSlug = current.slug
            const newSlug = await generateUniqueCafeSlug(newSlugCandidate, current.city)
            data.slug = newSlug
            await tx.slugRedirect.create({
              data: { fromSlug: oldSlug, toSlug: newSlug, entityType: 'cafe' },
            })
          }

          await tx.cafe.update({ where: { id: entityId }, data })
        }

        await tx.enrichmentProposal.updateMany({
          where: { id: { in: entityProposals.map(p => p.id) } },
          data: { status: 'APPLIED' },
        })
      })

      applied += entityProposals.length
    }

    // Handle NEW_PLACE — group by entityName+entityType and create entities
    if (newPlace.length > 0) {
      const byNewEntity = new Map<string, typeof newPlace>()
      for (const p of newPlace) {
        const key = `${p.entityType}:${p.entityName}`
        if (!byNewEntity.has(key)) byNewEntity.set(key, [])
        byNewEntity.get(key)!.push(p)
      }

      for (const [, entityProposals] of byNewEntity.entries()) {
        const entityType = entityProposals[0].entityType
        const fieldMap: Record<string, unknown> = {}
        for (const p of entityProposals) {
          fieldMap[p.fieldKey] = castValue(p.proposedValue as unknown, p.fieldKey)
        }

        const name = typeof fieldMap.name === 'string' ? fieldMap.name : entityProposals[0].entityName
        const country = typeof fieldMap.country === 'string' ? fieldMap.country : 'PL'
        const city = typeof fieldMap.city === 'string' ? fieldMap.city : ''
        // countryCode: use first 2 chars of country or derive from known mapping
        const countryCode = country.length === 2 ? country.toUpperCase() : country.slice(0, 2).toUpperCase()

        await db.$transaction(async (tx) => {
          if (entityType === 'ROASTER') {
            const slug = await generateUniqueSlug(name, city)
            const coverImageUrl = randomPlaceholder('ROASTER')
            await tx.roaster.create({
              data: {
                name,
                slug,
                country,
                countryCode,
                city,
                description: typeof fieldMap.description === 'string' ? fieldMap.description : null,
                website: typeof fieldMap.website === 'string' ? fieldMap.website : null,
                email: typeof fieldMap.email === 'string' ? fieldMap.email : null,
                phone: typeof fieldMap.phone === 'string' ? fieldMap.phone : null,
                instagram: typeof fieldMap.instagram === 'string' ? fieldMap.instagram : null,
                status: 'PENDING',
                images: {
                  create: { url: coverImageUrl, alt: name, entityType: "ROASTER" as const, uploadedById: adminId, isPrimary: true, sortOrder: 0 },
                },
              },
            })
          } else {
            const slug = await generateUniqueCafeSlug(name, city)
            await tx.cafe.create({
              data: {
                name,
                slug,
                country,
                countryCode,
                city,
                description: typeof fieldMap.description === 'string' ? fieldMap.description : null,
                website: typeof fieldMap.website === 'string' ? fieldMap.website : null,
                phone: typeof fieldMap.phone === 'string' ? fieldMap.phone : null,
                coverImageUrl: randomPlaceholder('CAFE'),
                status: 'PENDING',
              },
            })
          }

          await tx.enrichmentProposal.updateMany({
            where: { id: { in: entityProposals.map(p => p.id) } },
            data: { status: 'APPLIED' },
          })
        })

        applied += entityProposals.length
      }
    }

    // Revalidate affected paths
    revalidatePath('/roasters')
    revalidatePath('/cafes')
    revalidatePath('/admin/enrichment')
    revalidatePath('/admin')
    revalidatePath('/map')

    return { success: true, data: { applied } }
  } catch (error) {
    console.error('[applyEnrichmentRun]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Something went wrong' }
  }
}

export async function markEntityInactive(
  entityId: string,
  entityType: 'ROASTER' | 'CAFE',
): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (entityType === 'ROASTER') {
      await db.roaster.update({ where: { id: entityId }, data: { status: 'INACTIVE' } })
      revalidatePath('/roasters')
    } else {
      await db.cafe.update({ where: { id: entityId }, data: { status: 'REJECTED' } })
      revalidatePath('/cafes')
    }
    return { success: true, data: undefined }
  } catch (error) {
    console.error('[markEntityInactive]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Something went wrong' }
  }
}
