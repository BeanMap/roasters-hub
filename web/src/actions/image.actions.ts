"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { revalidateEntity } from "@/lib/revalidation";
import type { EntityType } from "@prisma/client";
import { type ActionResult } from "@/types/actions";

async function getAppSettings() {
  const settings = await db.appSettings.findUnique({
    where: { id: "singleton" },
  });
  return (
    settings ?? {
      imageMaxTotal: 10,
      imageMaxPerUser: 1,
      imageMaxPerOwner: 3,
      defaultPoolMax: 20,
    }
  );
}

function entityImageWhere(entityType: EntityType, entityId?: string) {
  if (!entityId) return {};
  return entityType === "ROASTER"
    ? { roasterId: entityId }
    : { cafeId: entityId };
}

export async function uploadImage(
  url: string,
  entityType: EntityType,
  entityId: string | undefined,
  isDefault: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireAuth();

    const settings = await getAppSettings();

    if (isDefault) {
      await requireAdmin();
      const count = await db.image.count({
        where: { entityType, isDefault: true },
      });
      if (count >= settings.defaultPoolMax) {
        return {
          success: false,
          error: `Default pool limit reached (${settings.defaultPoolMax})`,
        };
      }
    } else if (entityId) {
      const total = await db.image.count({
        where: { entityType, ...entityImageWhere(entityType, entityId), status: { not: "REJECTED" } },
      });
      if (total >= settings.imageMaxTotal) {
        return {
          success: false,
          error: `Image limit reached for this entity (${settings.imageMaxTotal})`,
        };
      }

      const userCount = await db.image.count({
        where: { entityType, ...entityImageWhere(entityType, entityId), uploadedById: userId },
      });
      if (userCount >= settings.imageMaxPerUser) {
        return {
          success: false,
          error: `You've reached the upload limit per entity (${settings.imageMaxPerUser})`,
        };
      }
    }

    const image = await db.image.create({
      data: {
        url,
        entityType,
        roasterId: entityType === "ROASTER" ? entityId : null,
        cafeId: entityType === "CAFE" ? entityId : null,
        uploadedById: userId,
        status: isDefault ? "APPROVED" : "PENDING",
        isDefault,
      },
    });

    if (entityId) {
      await revalidateEntity(entityType, entityId);
    } else {
      revalidatePath("/admin/images");
      revalidatePath("/dashboard/roaster");
      revalidatePath("/dashboard/cafe");
    }

    return { success: true, data: { id: image.id } };
  } catch (error) {
    console.error("[uploadImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function approveImage(imageId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const image = await db.image.findUnique({ where: { id: imageId } });
    if (!image) return { success: false, error: "Image not found" };

    const hasPrimary = await db.image.findFirst({
      where: {
        entityType: image.entityType,
        roasterId: image.roasterId,
        cafeId: image.cafeId,
        isPrimary: true,
      },
    });

    await db.image.update({
      where: { id: imageId },
      data: {
        status: "APPROVED",
        isPrimary: !hasPrimary,
      },
    });

    const entityId = image.roasterId ?? image.cafeId;
    if (entityId) {
      await revalidateEntity(image.entityType, entityId);
    }
    revalidatePath("/admin/images/pending");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[approveImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function rejectImage(imageId: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const image = await db.image.findUnique({
      where: { id: imageId },
      select: { entityType: true, roasterId: true, cafeId: true },
    });

    await db.image.update({
      where: { id: imageId },
      data: { status: "REJECTED" },
    });

    if (image) {
      const entityId = image.roasterId ?? image.cafeId;
      if (entityId) {
        await revalidateEntity(image.entityType, entityId);
      }
    }
    revalidatePath("/admin/images/pending");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[rejectImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const image = await db.image.findUnique({ where: { id: imageId } });
    if (!image) return { success: false, error: "Image not found" };

    const profile = await db.userProfile.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = profile?.role === "ADMIN";
    const isOwner = image.uploadedById === userId;

    if (!isAdmin && !isOwner) {
      return { success: false, error: "Forbidden" };
    }

    await db.image.delete({ where: { id: imageId } });

    const entityId = image.roasterId ?? image.cafeId;
    if (entityId) {
      await revalidateEntity(image.entityType, entityId);
    }
    revalidatePath("/admin/images");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function setPrimaryImage(imageId: string): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const image = await db.image.findUnique({ where: { id: imageId } });
    if (!image) return { success: false, error: "Image not found" };

    const profile = await db.userProfile.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = profile?.role === "ADMIN";

    if (!isAdmin) {
      const entity = image.cafeId
        ? await db.cafe.findFirst({ where: { id: image.cafeId, ownerId: userId } })
        : await db.roaster.findFirst({ where: { id: image.roasterId!, ownerId: userId } });

      if (!entity || image.status !== "APPROVED") {
        return { success: false, error: "Forbidden" };
      }
    }

    const conditions = image.roasterId
      ? { entityType: image.entityType, roasterId: image.roasterId }
      : { entityType: image.entityType, cafeId: image.cafeId };

    await db.$transaction([
      db.image.updateMany({
        where: conditions,
        data: { isPrimary: false },
      }),
      db.image.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    const entityId = image.roasterId ?? image.cafeId;
    if (entityId) {
      await revalidateEntity(image.entityType, entityId);
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[setPrimaryImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function getImageUploadInfo(
  entityType: EntityType,
  entityId: string,
): Promise<{ total: number; userTotal: number; maxTotal: number; maxPerUser: number }> {
  const userId = await requireAuth();
  const settings = await getAppSettings();

  const where = { entityType, ...entityImageWhere(entityType, entityId) };
  const [total, userTotal] = await Promise.all([
    db.image.count({ where: { ...where, status: { not: "REJECTED" } } }),
    db.image.count({ where: { ...where, uploadedById: userId } }),
  ]);

  return {
    total,
    userTotal,
    maxTotal: settings.imageMaxTotal,
    maxPerUser: settings.imageMaxPerUser,
  };
}

export async function reorderImages(
  items: { id: string; sortOrder: number }[],
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const profile = await db.userProfile.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = profile?.role === "ADMIN";

    if (!isAdmin) {
      const ids = items.map((i) => i.id);
      const owned = await db.image.findMany({
        where: { id: { in: ids } },
        select: { id: true, uploadedById: true },
      });
      if (
        owned.length !== ids.length ||
        owned.some((img) => img.uploadedById !== userId)
      ) {
        return { success: false, error: "Forbidden" };
      }
    }

    await db.$transaction(
      items.map((item) =>
        db.image.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[reorderImages]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function addDefaultImage(
  url: string,
  entityType: EntityType,
): Promise<ActionResult<{ id: string }>> {
  return uploadImage(url, entityType, undefined, true);
}

export async function linkDefaultImage(
  imageId: string,
  entityType: EntityType,
  entityId: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const image = await db.image.findUnique({ where: { id: imageId } });
    if (!image || !image.isDefault) {
      return { success: false, error: "Image not found or not a default image" };
    }

    const total = await db.image.count({
      where: { entityType, ...entityImageWhere(entityType, entityId), status: { not: "REJECTED" } },
    });
    const settings = await getAppSettings();
    if (total >= settings.imageMaxTotal) {
      return {
        success: false,
        error: `Image limit reached for this entity (${settings.imageMaxTotal})`,
      };
    }

    await db.image.create({
      data: {
        url: image.url,
        entityType,
        roasterId: entityType === "ROASTER" ? entityId : null,
        cafeId: entityType === "CAFE" ? entityId : null,
        uploadedById: image.uploadedById,
        status: "APPROVED",
        isDefault: false,
        isPrimary: total === 0,
      },
    });

    await revalidateEntity(entityType, entityId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[linkDefaultImage]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
