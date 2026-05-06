"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  CreateReviewSchema,
  CreateCafeReviewSchema,
  type ActionResult,
} from "@/types/actions";

export async function submitReview(formData: FormData): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    const user = userId ? await currentUser() : null;
    const authorName = user?.fullName ?? (formData.get("authorName") as string);
    if (!authorName || authorName.length < 2) {
      return { success: false, error: "Name is required" };
    }

    const raw = {
      roasterId: formData.get("roasterId"),
      authorName,
      rating: formData.get("rating"),
      comment: formData.get("comment"),
    };
    const parsed = CreateReviewSchema.safeParse(raw);
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
    const { roasterId, rating, comment } = parsed.data;

    const roaster = await db.roaster.findUnique({
      where: { id: roasterId, status: "VERIFIED" },
      select: { slug: true },
    });
    if (!roaster) return { success: false, error: "Roaster not found" };

    try {
      if (userId) {
        const existing = await db.review.findFirst({
          where: { userId, roasterId },
        });
        if (existing) {
          return {
            success: false,
            error:
              "You've already reviewed this place. You can edit your existing review below.",
          };
        }
      }
      await db.review.create({
        data: {
          roasterId,
          authorName,
          rating,
          comment: comment || null,
          userId: userId ?? null,
        },
      });
    } catch {
      // Fallback: userId column may not exist yet
      await db.review.create({
        data: { roasterId, authorName, rating, comment: comment || null },
      });
    }
    revalidatePath(`/roasters/${roaster.slug}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[submitReview]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function submitCafeReview(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    const user = userId ? await currentUser() : null;
    const authorName = user?.fullName ?? (formData.get("authorName") as string);
    if (!authorName || authorName.length < 2) {
      return { success: false, error: "Name is required" };
    }

    const raw = {
      cafeId: formData.get("cafeId"),
      authorName,
      rating: formData.get("rating"),
      comment: formData.get("comment"),
    };
    const parsed = CreateCafeReviewSchema.safeParse(raw);
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
    const { cafeId, rating, comment } = parsed.data;

    const cafe = await db.cafe.findUnique({
      where: { id: cafeId, status: "VERIFIED" },
      select: { slug: true },
    });
    if (!cafe) return { success: false, error: "Cafe not found" };

    try {
      if (userId) {
        const existing = await db.review.findFirst({
          where: { userId, cafeId },
        });
        if (existing) {
          return {
            success: false,
            error:
              "You've already reviewed this place. You can edit your existing review below.",
          };
        }
      }
      await db.review.create({
        data: {
          cafeId,
          authorName,
          rating,
          comment: comment || null,
          userId: userId ?? null,
        },
      });
    } catch {
      // Fallback: userId column may not exist yet
      await db.review.create({
        data: { cafeId, authorName, rating, comment: comment || null },
      });
    }
    revalidatePath(`/cafes/${cafe.slug}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[submitCafeReview]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateReview(
  reviewId: string,
  data: { rating?: number; comment?: string },
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, roasterId: true, cafeId: true, roaster: { select: { slug: true } }, cafe: { select: { slug: true } } },
    });
    if (!review) return { success: false, error: "Review not found" };
    if (review.userId !== userId) {
      return { success: false, error: "Forbidden" };
    }

    try {
      await db.review.update({
        where: { id: reviewId },
        data: {
          ...(data.rating !== undefined ? { rating: data.rating } : {}),
          ...(data.comment !== undefined ? { comment: data.comment } : {}),
          updatedAt: new Date(),
        },
      });
    } catch {
      // Fallback: updatedAt column may not exist yet
      await db.review.update({
        where: { id: reviewId },
        data: {
          ...(data.rating !== undefined ? { rating: data.rating } : {}),
          ...(data.comment !== undefined ? { comment: data.comment } : {}),
        },
      });
    }

    if (review.roaster?.slug) revalidatePath(`/roasters/${review.roaster.slug}`);
    if (review.cafe?.slug) revalidatePath(`/cafes/${review.cafe.slug}`);
    revalidatePath("/admin/reviews");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateReview]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, roasterId: true, cafeId: true, roaster: { select: { slug: true } }, cafe: { select: { slug: true } } },
    });
    if (!review) return { success: false, error: "Review not found" };

    const isOwner = review.userId === userId;
    const profile = await db.userProfile.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = profile?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Forbidden" };
    }

    await db.review.delete({ where: { id: reviewId } });

    if (review.roaster?.slug) revalidatePath(`/roasters/${review.roaster.slug}`);
    if (review.cafe?.slug) revalidatePath(`/cafes/${review.cafe.slug}`);
    revalidatePath("/admin/reviews");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteReview]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function approveReview(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const review = await db.review.update({
      where: { id: reviewId },
      data: { status: "APPROVED" },
      select: {
        roaster: { select: { slug: true } },
        cafe: { select: { slug: true } },
      },
    });
    if (review.roaster) revalidatePath(`/roasters/${review.roaster.slug}`);
    if (review.cafe) revalidatePath(`/cafes/${review.cafe.slug}`);
    revalidatePath("/admin/reviews");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[approveReview]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function rejectReview(reviewId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const review = await db.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED" },
      select: {
        roaster: { select: { slug: true } },
        cafe: { select: { slug: true } },
      },
    });
    if (review.roaster) revalidatePath(`/roasters/${review.roaster.slug}`);
    if (review.cafe) revalidatePath(`/cafes/${review.cafe.slug}`);
    revalidatePath("/admin/reviews");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[rejectReview]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
