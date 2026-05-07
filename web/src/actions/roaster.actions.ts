"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slug";
import { resolveCountryCode } from "@/lib/country-codes";
import { requireRoasterOwner } from "@/lib/auth";
import {
  CreateRoasterSchema,
  UpdateRoasterSchema,
  type ActionResult,
} from "@/types/actions";
import { sendNewRegistrationNotification } from "@/lib/email";

export async function createRoasterRegistration(
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const isOwner = formData.get("isOwner") === "true";

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

    const raw: Record<string, unknown> = {
      name: formData.get("name"),
      description: formData.get("description"),
      country: formData.get("country"),
      city: formData.get("city"),
      address: formData.get("address") || undefined,
      lat: formData.get("lat") || undefined,
      lng: formData.get("lng") || undefined,
      website: formData.get("website"),
      email: formData.get("email"),
      instagram: formData.get("instagram"),
      shopUrl: formData.get("shopUrl"),
      certifications: formData.getAll("certifications"),
      origins: formData.getAll("origins"),
      roastStyles: formData.getAll("roastStyles"),
      openingHours: formData.get("openingHours") || undefined,
    };

    const parsed = CreateRoasterSchema.safeParse(raw);

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

    const { name, city, description, openingHours: hoursRaw, ...rest } = parsed.data;

    const slug = await generateUniqueSlug(name, city);

    let openingHours: import("@prisma/client").Prisma.InputJsonValue | undefined = undefined;
    if (hoursRaw) {
      try { openingHours = JSON.parse(hoursRaw); } catch { /* skip */ }
    }

    const roaster = await db.roaster.create({
      data: {
        name,
        slug,
        city,
        country: rest.country,
        countryCode: resolveCountryCode(rest.country),
        description: description || null,
        address: rest.address || null,
        lat: typeof rest.lat === "number" ? rest.lat : null,
        lng: typeof rest.lng === "number" ? rest.lng : null,
        website: rest.website || null,
        email: rest.email || null,
        instagram: rest.instagram || null,
        shopUrl: rest.shopUrl || null,
        certifications: rest.certifications,
        origins: rest.origins,
        roastStyles: rest.roastStyles,
        openingHours,
        ownerId: userId ?? null,
      },
    });

    revalidatePath("/admin/pending");

    sendNewRegistrationNotification({
      name,
      city,
      country: rest.country,
    });

    return { success: true, data: { slug: roaster.slug } };
  } catch (error) {
    console.error("[createRoasterRegistration]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateRoasterProfile(
  roasterId: string,
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  try {
    await requireRoasterOwner(roasterId);

    const raw = {
      description: formData.get("description"),
      address: formData.get("address") || undefined,
      lat: formData.get("lat") || undefined,
      lng: formData.get("lng") || undefined,
      website: formData.get("website"),
      email: formData.get("email"),
      instagram: formData.get("instagram"),
      shopUrl: formData.get("shopUrl"),
      certifications: formData.getAll("certifications"),
      origins: formData.getAll("origins"),
      roastStyles: formData.getAll("roastStyles"),
    };

    const parsed = UpdateRoasterSchema.safeParse(raw);

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

    const roaster = await db.roaster.update({
      where: { id: roasterId },
      data: {
        description: data.description || null,
        address: data.address || null,
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
        website: data.website || null,
        email: data.email || null,
        instagram: data.instagram || null,
        shopUrl: data.shopUrl || null,
        certifications: data.certifications,
        origins: data.origins,
        roastStyles: data.roastStyles,
      },
      select: { slug: true },
    });

    revalidatePath("/");
    revalidatePath("/roasters");
    revalidatePath(`/roasters/${roaster.slug}`);
    revalidatePath("/map");
    revalidatePath("/dashboard/roaster");

    return { success: true, data: { slug: roaster.slug } };
  } catch (error) {
    console.error("[updateRoasterProfile]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function deleteRoasterImage(
  roasterId: string,
  imageId: string,
): Promise<ActionResult> {
  try {
    await requireRoasterOwner(roasterId);

    const image = await db.roasterImage.findFirst({
      where: { id: imageId, roasterId },
    });
    if (!image) {
      return { success: false, error: "Image not found" };
    }

    await db.roasterImage.delete({ where: { id: imageId } });

    const roaster = await db.roaster.findUnique({
      where: { id: roasterId },
      select: { slug: true },
    });

    revalidatePath("/");
    revalidatePath("/roasters");
    revalidatePath(`/roasters/${roaster?.slug}`);
    revalidatePath("/map");
    revalidatePath("/dashboard/roaster");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteRoasterImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function revalidateAfterUpload(
  roasterId: string,
): Promise<ActionResult> {
  try {
    await requireRoasterOwner(roasterId);

    const roaster = await db.roaster.findUnique({
      where: { id: roasterId },
      select: { slug: true },
    });

    revalidatePath("/");
    revalidatePath("/roasters");
    revalidatePath(`/roasters/${roaster?.slug}`);
    revalidatePath("/map");
    revalidatePath("/dashboard/roaster");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[revalidateAfterUpload]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
