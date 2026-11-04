"use server";

import { normalizeLocationPatch } from "@/lib/country-codes";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/types/actions";
import {
  sendRoasterVerifiedEmail,
  sendRoasterRejectedEmail,
} from "@/lib/email";

export async function verifyRoaster(
  roasterId: string,
): Promise<ActionResult<{ slug: string }>> {
  try {
    await requireAdmin();

    const roaster = await db.roaster.update({
      where: { id: roasterId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        rejectedAt: null,
        rejectedReason: null,
      },
      select: { slug: true, name: true, email: true },
    });

    revalidatePath("/");
    revalidatePath("/roasters");
    revalidatePath(`/roasters/${roaster.slug}`);
    revalidatePath("/admin/pending");
    revalidatePath("/admin");
    revalidatePath("/admin/roasters");
    revalidatePath("/admin/activity");
    revalidatePath("/map");

    if (roaster.email) {
      sendRoasterVerifiedEmail({
        email: roaster.email,
        name: roaster.name,
        slug: roaster.slug,
      });
    }

    return { success: true, data: { slug: roaster.slug } };
  } catch (error) {
    console.error("[verifyRoaster]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function rejectRoaster(
  roasterId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const roaster = await db.roaster.update({
      where: { id: roasterId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedReason: reason,
      },
      select: { slug: true, name: true, email: true },
    });

    revalidatePath("/");
    revalidatePath("/roasters");
    revalidatePath(`/roasters/${roaster.slug}`);
    revalidatePath("/admin/pending");
    revalidatePath("/admin");
    revalidatePath("/admin/roasters");
    revalidatePath("/admin/activity");
    revalidatePath("/map");

    if (roaster.email) {
      sendRoasterRejectedEmail({
        email: roaster.email,
        name: roaster.name,
        reason,
      });
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[rejectRoaster]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function adminUpdateRoaster(
  roasterId: string,
  data: {
    name?: string;
    description?: string | null;
    city?: string;
    country?: string;
    countryCode?: string;
    website?: string | null;
    email?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    phone?: string | null;
    shopUrl?: string | null;
    address?: string | null;
    postalCode?: string | null;
    lat?: number | null;
    lng?: number | null;
    certifications?: string[];
    origins?: string[];
    roastStyles?: string[];
    brewingMethods?: string[];
    foundedYear?: number | null;
    wholesaleAvailable?: boolean | null;
    subscriptionAvailable?: boolean | null;
    hasCafe?: boolean | null;
    hasTastingRoom?: boolean | null;
    openingHours?: import("@prisma/client").Prisma.NullableJsonNullValueInput | import("@prisma/client").Prisma.InputJsonValue;
    coverImageUrl?: string | null;
    sourceUrl?: string | null;
    featured?: boolean;
    featuredUntil?: Date | null;
    ownerId?: string | null;
  },
): Promise<ActionResult<{ slug: string }>> {
  try {
    await requireAdmin();
    const { ownerId, openingHours, ...rest } = data;
    const ownerUpdate: Record<string, unknown> =
      ownerId !== undefined
        ? ownerId === null
          ? { owner: { disconnect: true } }
          : { owner: { connect: { id: ownerId } } }
        : {};
    const openingHoursUpdate =
      openingHours !== undefined ? { openingHours } : {};
    const roaster = await db.roaster.update({
      where: { id: roasterId },
      data: { ...normalizeLocationPatch(rest), ...openingHoursUpdate, ...ownerUpdate, updatedAt: new Date() } as Parameters<typeof db.roaster.update>[0]["data"],
      select: { slug: true },
    });
    revalidatePath("/admin/roasters");
    revalidatePath(`/admin/roasters/${roasterId}`);
    revalidatePath(`/roasters/${roaster.slug}`);
    revalidatePath("/roasters");
    return { success: true, data: { slug: roaster.slug } };
  } catch (error) {
    console.error("[adminUpdateRoaster]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
