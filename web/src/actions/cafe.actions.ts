"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, requireCafeOwner } from "@/lib/auth";
import { generateUniqueCafeSlug } from "@/lib/slug";
import { resolveCountryCode } from "@/lib/country-codes";
import { CreateCafeSchema, UpdateCafeSchema, type ActionResult } from "@/types/actions";

export async function createCafe(
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const isOwner = formData.get("isOwner") === "true";

    const raw = {
      name: formData.get("name"),
      description: formData.get("description"),
      country: formData.get("country"),
      city: formData.get("city"),
      address: formData.get("address"),
      lat: formData.get("lat") || undefined,
      lng: formData.get("lng") || undefined,
      website: formData.get("website"),
      instagram: formData.get("instagram"),
      phone: formData.get("phone"),
      email: formData.get("email") || undefined,
      openingHours: formData.get("openingHours") || undefined,
      services: formData.get("services") || undefined,
    };

    const parsed = CreateCafeSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, description, country, city, address, lat, lng, website, instagram, phone, email, openingHours: hoursRaw, services: servicesRaw } =
      parsed.data;

    let userId: string | undefined;
    if (isOwner) {
      const session = await auth();
      userId = session.userId ?? undefined;
      if (!userId) {
        return {
          success: false,
          error: "You must be signed in to register as the owner. Please sign in and try again.",
        };
      }
    }

    const slug = await generateUniqueCafeSlug(name, city);
    const countryCode = resolveCountryCode(country);

    let openingHours: Prisma.InputJsonValue | undefined = undefined;
    if (hoursRaw) {
      try { openingHours = JSON.parse(hoursRaw); } catch { /* invalid JSON, skip */ }
    }

    const services = servicesRaw
      ? servicesRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const cafe = await db.cafe.create({
      data: {
        name,
        slug,
        description: description || null,
        country,
        countryCode,
        city,
        address: address || null,
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
        website: website || null,
        instagram: instagram || null,
        phone: phone || null,
        email: email || null,
        status: "PENDING",
        openingHours,
        services,
      },
    });

    if (userId) {
      await db.userProfile.update({
        where: { id: userId },
        data: { role: "CAFE" },
      });

      await db.cafe.update({
        where: { id: cafe.id },
        data: { ownerId: userId },
      });
    }

    if (userId) {
      revalidatePath("/cafes");
    } else {
      revalidatePath("/admin/cafes");
    }
    return { success: true, data: { slug: cafe.slug } };
  } catch (error) {
    console.error("[createCafe]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateCafe(cafeId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireCafeOwner(cafeId);

    const raw = {
      description: formData.get("description"),
      address: formData.get("address"),
      lat: formData.get("lat") || undefined,
      lng: formData.get("lng") || undefined,
      website: formData.get("website"),
      instagram: formData.get("instagram"),
      phone: formData.get("phone"),
    };

    const parsed = UpdateCafeSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const cafe = await db.cafe.update({
      where: { id: cafeId },
      data: {
        description: parsed.data.description || null,
        address: parsed.data.address || null,
        lat: typeof parsed.data.lat === "number" ? parsed.data.lat : null,
        lng: typeof parsed.data.lng === "number" ? parsed.data.lng : null,
        website: parsed.data.website || null,
        instagram: parsed.data.instagram || null,
        phone: parsed.data.phone || null,
      },
      select: { slug: true },
    });

    revalidatePath("/cafes");
    revalidatePath(`/cafes/${cafe.slug}`);
    revalidatePath("/map");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateCafe]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function verifyCafe(cafeId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const cafe = await db.cafe.update({
      where: { id: cafeId },
      data: { status: "VERIFIED", verifiedAt: new Date() },
      select: { slug: true },
    });
    revalidatePath("/cafes");
    revalidatePath(`/cafes/${cafe.slug}`);
    revalidatePath("/map");
    revalidatePath("/admin/cafes");
    revalidatePath(`/admin/cafes/${cafeId}`);
    revalidatePath("/admin");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[verifyCafe]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function rejectCafe(cafeId: string, reason: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const cafe = await db.cafe.update({
      where: { id: cafeId },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectedReason: reason },
      select: { slug: true },
    });
    revalidatePath("/cafes");
    revalidatePath(`/cafes/${cafe.slug}`);
    revalidatePath("/admin/cafes");
    revalidatePath(`/admin/cafes/${cafeId}`);
    revalidatePath("/admin");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[rejectCafe]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function adminUpdateCafe(
  cafeId: string,
  data: {
    name?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    description?: string | null;
    address?: string | null;
    postalCode?: string | null;
    website?: string | null;
    email?: string | null;
    instagram?: string | null;
    phone?: string | null;
    priceRange?: string | null;
    seatingCapacity?: number | null;
    openingHours?: import("@prisma/client").Prisma.InputJsonValue | null;
    services?: string[];
    serving?: string[];
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    sourceUrl?: string | null;
    featured?: boolean;
    ownerId?: string | null;
    lat?: number | null;
    lng?: number | null;
  },
): Promise<ActionResult<{ slug: string }>> {
  try {
    await requireAdmin();
    const { ownerId, openingHours, ...rest } = data;
    // ownerId is a nullable FK — use relation syntax to satisfy Prisma's union type
    const ownerUpdate =
      ownerId !== undefined
        ? { owner: ownerId ? { connect: { id: ownerId } } : { disconnect: true } }
        : {}
    // openingHours is Json? — null must be passed as Prisma.JsonNull
    const hoursUpdate =
      openingHours !== undefined
        ? { openingHours: openingHours === null ? Prisma.JsonNull : openingHours }
        : {}
    const cafe = await db.cafe.update({
      where: { id: cafeId },
      data: {
        ...rest,
        ...ownerUpdate,
        ...hoursUpdate,
      },
      select: { slug: true },
    });
    revalidatePath("/admin/cafes");
    revalidatePath(`/admin/cafes/${cafeId}`);
    revalidatePath(`/cafes/${cafe.slug}`);
    revalidatePath("/cafes");
    revalidatePath("/map");
    return { success: true, data: { slug: cafe.slug } };
  } catch (error) {
    console.error("[adminUpdateCafe]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function updateCafeProfile(
  cafeId: string,
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  try {
    await requireCafeOwner(cafeId);

    const raw = {
      description: formData.get("description"),
      address: formData.get("address") || undefined,
      lat: formData.get("lat") || undefined,
      lng: formData.get("lng") || undefined,
      website: formData.get("website"),
      email: formData.get("email"),
      instagram: formData.get("instagram"),
      phone: formData.get("phone"),
      openingHours: formData.get("openingHours") || undefined,
    };

    const parsed = UpdateCafeSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = parsed.data;

    let openingHours: import("@prisma/client").Prisma.InputJsonValue | null =
      null;
    if (data.openingHours) {
      try {
        openingHours = JSON.parse(data.openingHours);
      } catch {
        /* skip */
      }
    }

    const cafe = await db.cafe.update({
      where: { id: cafeId },
      data: {
        description: data.description || null,
        address: data.address || null,
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
        website: data.website || null,
        email: data.email || null,
        instagram: data.instagram || null,
        phone: data.phone || null,
        openingHours: openingHours ?? Prisma.JsonNull,
      },
      select: { slug: true },
    });

    revalidatePath(`/cafes/${cafe.slug}`);
    revalidatePath("/cafes");
    revalidatePath("/map");
    revalidatePath("/dashboard/cafe");

    return { success: true, data: { slug: cafe.slug } };
  } catch (error) {
    console.error("[updateCafeProfile]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function updateCafeCoverImage(cafeId: string, coverImageUrl: string): Promise<ActionResult> {
  try {
    await requireCafeOwner(cafeId);

    await db.cafe.update({
      where: { id: cafeId },
      data: { coverImageUrl },
    });

    revalidatePath(`/cafes/${cafeId}`);
    revalidatePath("/cafes");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateCafeCoverImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
