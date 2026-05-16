"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ReviewSortControls, type ReviewSort } from "@/components/shared/ReviewSortControls";
import { ReviewList } from "@/components/shared/ReviewList";
import { ReviewForm } from "@/components/shared/ReviewForm";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
};

export function ReviewSection({
  reviews,
  averageRating,
  roasterId,
  cafeId,
}: {
  reviews: Review[];
  averageRating: number | null;
  roasterId?: string;
  cafeId?: string;
}) {
  const t = useTranslations("profiles");
  const [sort, setSort] = useState<ReviewSort>("newest");

  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    if (sort === "newest") {
      copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      copy.sort((a, b) => b.rating - a.rating);
    }
    return copy;
  }, [reviews, sort]);

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-headline text-3xl tracking-tight">{t("reviews")}</h3>
        {reviews.length > 1 && (
          <ReviewSortControls value={sort} onChange={setSort} />
        )}
      </div>
      <ReviewList reviews={sortedReviews} averageRating={averageRating} />
      <div className="mt-10 pt-8 border-t border-outline-variant/10">
        <h4 className="text-lg font-medium mb-4">{t("leaveReview")}</h4>
        <ReviewForm roasterId={roasterId} cafeId={cafeId} />
      </div>
    </section>
  );
}
