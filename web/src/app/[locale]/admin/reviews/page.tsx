import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminReviewsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  if (user?.publicMetadata?.role !== "ADMIN") redirect("/");

  let reviews: { id: string; authorName: string; rating: number; comment: string | null; status: string; createdAt: Date; roaster: { name: string; slug: string } | null; cafe: { name: string; slug: string } | null }[] = [];
  try {
    reviews = await db.review.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        authorName: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
        roaster: { select: { name: true, slug: true } },
        cafe: { select: { name: true, slug: true } },
      },
    });
  } catch {
    // migration may not be applied yet
  }

  const serialized = reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    roasterName: r.roaster?.name ?? null,
    roasterSlug: r.roaster?.slug ?? null,
    cafeName: r.cafe?.name ?? null,
    cafeSlug: r.cafe?.slug ?? null,
  }));

  return <AdminReviewsClient reviews={serialized} />;
}
