"use client";

import { useState } from "react";
import { useAuth, SignInButton, useUser } from "@clerk/nextjs";

type ReviewFormProps = {
  roasterId?: string;
  cafeId?: string;
};

export function ReviewForm({ roasterId, cafeId }: ReviewFormProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (roasterId) formData.set("roasterId", roasterId);
    if (cafeId) formData.set("cafeId", cafeId);
    formData.set("rating", String(rating));

    let result: { success: boolean; error?: string };
    if (roasterId) {
      const { submitReview } = await import("@/actions/review.actions");
      result = await submitReview(formData);
    } else {
      const { submitCafeReview } = await import("@/actions/review.actions");
      result = await submitCafeReview(formData);
    }

    setLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "An error occurred");
    }
  }

  if (!isSignedIn) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-sm text-amber-800 mb-2">
          Sign in to leave a review
        </p>
        <SignInButton mode="modal">
          <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-green-700 font-medium text-sm">
          Thank you for your review! It will appear after moderation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {user?.fullName && (
        <input type="hidden" name="authorName" value={user.fullName} />
      )}

      <div>
        <p className="block text-sm font-medium mb-1" id="rating-label">
          Rating
        </p>
        <div
          className="flex gap-1"
          role="group"
          aria-labelledby="rating-label"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl transition-colors"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <span
                className={
                  star <= (hoverRating || rating)
                    ? "text-amber-500"
                    : "text-on-surface-variant/20"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium mb-1"
        >
          Comment{" "}
          <span className="text-on-surface-variant/50">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          name="comment"
          rows={3}
          maxLength={2000}
          className="input-field resize-none"
          placeholder="Share your experience..."
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-container transition-all disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
