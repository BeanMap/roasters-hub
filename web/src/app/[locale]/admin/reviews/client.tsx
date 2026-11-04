"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { approveReview, rejectReview } from "@/actions/review.actions";

export interface SerializedReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
  roasterName: string | null;
  roasterSlug: string | null;
  cafeName: string | null;
  cafeSlug: string | null;
}

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";
type TabFilter = "roasters" | "cafes";

export function AdminReviewsClient({
  reviews: initial,
}: {
  reviews: SerializedReview[];
}) {
  const t = useTranslations("admin");
  const [reviews, setReviews] = useState(initial);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [tab, setTab] = useState<TabFilter>("roasters");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const tabFiltered =
    tab === "roasters"
      ? reviews.filter((r) => r.roasterSlug !== null)
      : reviews.filter((r) => r.cafeSlug !== null);

  const filtered =
    statusFilter === "all"
      ? tabFiltered
      : tabFiltered.filter((r) => r.status === statusFilter);

  const handleApprove = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await approveReview(id);
      if (result.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r)),
        );
      } else {
        setError(result.error);
      }
    });
  };

  const handleReject = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await rejectReview(id);
      if (result.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r)),
        );
      } else {
        setError(result.error);
      }
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase">
            {t("pending")}
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase">
            {t("verified")}
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full uppercase">
            {t("rejected")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl font-bold">{t("reviewModeration")}</h1>
        <Link
          href="/admin/pending"
          className="text-sm text-primary hover:underline"
        >
          {t("backToRoasters")}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">
            {t("dismiss")}
          </button>
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b border-outline-variant/20">
        {(["roasters", "cafes"] as TabFilter[]).map((tTab) => (
          <button
            key={tTab}
            onClick={() => setTab(tTab)}
            className={
              tab === tTab
                ? "px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary -mb-px"
                : "px-4 py-2 text-sm font-semibold text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
            }
          >
            {tTab === "roasters" ? t("allRoasters") : t("cafes")}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "PENDING", "APPROVED", "REJECTED"] as StatusFilter[]).map(
          (filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={
                statusFilter === filter
                  ? "px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold"
                  : "px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-surface-variant transition-colors"
              }
            >
              {filter === "all"
                ? t("all")
                : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ),
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-on-surface-variant/60 text-center py-12">
          {t("noReviewsToShow")}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {review.authorName}
                    </span>
                    {statusBadge(review.status)}
                  </div>
                  <p className="text-xs text-on-surface-variant/60">
                    on{" "}
                    {review.cafeSlug ? (
                      <a
                        href={`/cafes/${review.cafeSlug}`}
                        className="text-primary hover:underline"
                      >
                        {review.cafeName}
                      </a>
                    ) : (
                      <a
                        href={`/roasters/${review.roasterSlug}`}
                        className="text-primary hover:underline"
                      >
                        {review.roasterName}
                      </a>
                    )}{" "}
                    · {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= review.rating
                          ? "text-amber-500"
                          : "text-on-surface-variant/20"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                  {review.comment}
                </p>
              )}

              {review.status === "PENDING" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApprove(review.id)}
                    disabled={isPending}
                    className="bg-secondary text-on-secondary px-4 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {t("verify")}
                  </button>
                  <button
                    onClick={() => handleReject(review.id)}
                    disabled={isPending}
                    className="border border-error text-error px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-error/5 transition-all disabled:opacity-50"
                  >
                    {t("reject")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
