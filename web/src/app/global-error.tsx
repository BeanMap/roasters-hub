"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center bg-white font-sans">
        <p className="text-7xl font-semibold text-stone-200 mb-4">500</p>
        <h1 className="text-2xl font-semibold text-stone-800 mb-3">
          Something went wrong
        </h1>
        <p className="text-stone-500 mb-8 max-w-sm">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Go to homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
