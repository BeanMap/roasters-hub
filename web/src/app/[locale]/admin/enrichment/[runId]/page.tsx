import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { db } from "@/lib/db"
import { SplitLayout } from "./_components/SplitLayout"
import { stringSimilarity } from "@/lib/enrichment/similarity"
import type { EntitySummary, ProposalWithMeta } from "./_components/types"

export const revalidate = 0

function buildEntitySummaries(proposals: ProposalWithMeta[]): EntitySummary[] {
  const map = new Map<string, ProposalWithMeta[]>();
  for (const p of proposals) {
    const key = p.entityId ?? p.entityName;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  return Array.from(map.entries()).map(([key, props]) => ({
    key,
    entityId: props[0].entityId,
    entityName: props[0].entityName,
    entityType: props[0].entityType,
    isNew: props.some((p) => p.changeType === "NEW_PLACE"),
    hasNameChange: props.some((p) => p.fieldKey === "name" && p.changeType === "UPDATE"),
    proposalCount: props.length,
    pendingCount: props.filter((p) => p.status === "PENDING").length,
    appliedCount: props.filter((p) => p.status === "APPLIED").length,
    minConf: props.length > 0 ? Math.min(...props.map((p) => p.confidence)) : 0,
    sources: [...new Set(props.map((p) => p.sourceId))],
    city: props.find((p) => p.fieldKey === "city")?.proposedValue as string | null ?? null,
  }));
}

export default async function RunReviewPage({ params }: { params: Promise<{ runId: string }> }) {

  const { runId } = await params

  const t = await getTranslations("admin")

  const run = await db.enrichmentRun.findUnique({
    where: { id: runId },
    include: {
      proposals: {
        orderBy: [{ entityName: "asc" }, { fieldPriority: "asc" }],
      },
    },
  })

  if (!run) notFound()

  // Build ProposalWithMeta array (add nameSimilarity)
  const proposalsWithMeta: ProposalWithMeta[] = run.proposals.map((p) => {
    let nameSimilarity: number | null = null
    if (p.fieldKey === "name" && p.changeType === "UPDATE") {
      const curr = typeof p.currentValue === "string" ? p.currentValue : String(p.currentValue ?? "")
      const prop = typeof p.proposedValue === "string" ? p.proposedValue : String(p.proposedValue ?? "")
      nameSimilarity = stringSimilarity(curr, prop)
    }
    return {
      id: p.id,
      entityType: p.entityType,
      entityId: p.entityId ?? null,
      entityName: p.entityName,
      changeType: p.changeType,
      fieldKey: p.fieldKey,
      fieldGroup: p.fieldGroup ?? "",
      fieldPriority: p.fieldPriority ?? "",
      currentValue: p.currentValue,
      proposedValue: p.proposedValue,
      confidence: p.confidence,
      sourceId: p.sourceId,
      sourceUrl: p.sourceUrl ?? null,
      status: p.status,
      nameSimilarity,
    }
  })

  const entities = buildEntitySummaries(proposalsWithMeta)

  const proposalsByEntity = Object.fromEntries(
    entities.map((e) => [e.key, proposalsWithMeta.filter((p) => (p.entityId ?? p.entityName) === e.key)])
  )

  // Fetch existing entity records for non-new entities
  const existingEntityIds = entities
    .filter((e) => !e.isNew && e.entityId)
    .map((e) => e.entityId!)

  const entityType = (run.query as Record<string, unknown>)?.entityType as string ?? "CAFE"
  const existingCafes = entityType === "CAFE"
    ? await db.cafe.findMany({ where: { id: { in: existingEntityIds } } })
    : []
  const existingRoasters = entityType === "ROASTER"
    ? await db.roaster.findMany({ where: { id: { in: existingEntityIds } } })
    : []

  const existingFieldsByEntity: Record<string, Record<string, unknown>> = {}
  for (const entity of entities) {
    if (entity.isNew || !entity.entityId) {
      existingFieldsByEntity[entity.key] = {}
      continue
    }
    const record = [...existingCafes, ...existingRoasters].find((r) => r.id === entity.entityId)
    existingFieldsByEntity[entity.key] = record ? (record as Record<string, unknown>) : {}
  }

  const keywords = Array.isArray((run.query as Record<string, unknown>)?.keywords)
    ? (run.query as Record<string, unknown>).keywords as string[]
    : []

  return (
    <div>
      {/* Run bar */}
      <div className="sticky top-11 z-10 flex items-center gap-4 border-b border-stone-200 bg-white px-4 py-3 flex-wrap">
        <Link href="/admin/enrichment" className="text-xs text-amber-700">{t("backToRuns")}</Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{entityType} — {String((run.query as Record<string, unknown>)?.mode ?? "")}</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">✓ {run.status}</span>
          </div>
          <p className="text-xs text-stone-400">
            {run.sources.join(" · ")}
            {keywords.length > 0 && ` · "${keywords.slice(0, 2).join(", ")}"`}
          </p>
        </div>
        <div className="flex gap-4 text-center">
          <div><div className="text-lg font-bold">{entities.length}</div><div className="text-[10px] text-stone-400">{t("entitiesLabel")}</div></div>
          <div><div className="text-lg font-bold text-amber-600">{entities.reduce((s, e) => s + e.pendingCount, 0)}</div><div className="text-[10px] text-stone-400">{t("pendingLabel")}</div></div>
          <div><div className="text-lg font-bold text-green-600">{entities.reduce((s, e) => s + e.appliedCount, 0)}</div><div className="text-[10px] text-stone-400">{t("appliedLabel")}</div></div>
        </div>
      </div>

      <SplitLayout
        runId={run.id}
        entities={entities}
        proposalsByEntity={proposalsByEntity}
        existingFieldsByEntity={existingFieldsByEntity}
        runKeywords={keywords}
      />
    </div>
  )
}
