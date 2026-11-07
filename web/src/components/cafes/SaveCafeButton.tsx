"use client";

import { useEffect, useState, useTransition } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { isCafeSaved, saveCafe, unsaveCafe } from "@/actions/saved-cafe.actions";

const buttonBase =
  "w-full py-3.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2";

export function SaveCafeButton({ cafeId }: { cafeId: string }) {
  const { isSignedIn } = useAuth();
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Saved state is per user, so it is loaded in the browser: reading the
  // session on the server would make the whole profile page uncacheable.
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    isCafeSaved(cafeId).then((value) => {
      if (!cancelled) setSaved(value);
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, cafeId]);

  const handleToggle = () => {
    startTransition(async () => {
      const result = saved
        ? await unsaveCafe(cafeId)
        : await saveCafe(cafeId);

      if (result.success) {
        setSaved(!saved);
      }
    });
  };

  // Signed-out visitors get the sign-in dialog instead of a silent failure.
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className={`${buttonBase} border border-outline text-on-surface-variant hover:bg-surface-container-low`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save Cafe
        </button>
      </SignInButton>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`${buttonBase} ${
        saved
          ? "bg-primary/10 text-primary border border-primary/20"
          : "border border-outline text-on-surface-variant hover:bg-surface-container-low"
      } disabled:opacity-50`}
      title={saved ? "Remove from saved" : "Save this cafe"}
    >
      <svg
        className="w-4 h-4"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {isPending ? "..." : saved ? "Saved" : "Save Cafe"}
    </button>
  );
}
