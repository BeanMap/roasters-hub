"use client";

import { useState } from "react";

export type ReviewSort = "newest" | "highest";

interface ReviewSortControlsProps {
  value: ReviewSort;
  onChange: (sort: ReviewSort) => void;
}

export function ReviewSortControls({
  value,
  onChange,
}: ReviewSortControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-on-surface-variant/70 hover:text-on-surface transition-colors"
      >
        <span>Sort: {value === "newest" ? "Newest" : "Highest rated"}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-10">
          <button
            onClick={() => {
              onChange("newest");
              setOpen(false);
            }}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
              value === "newest" ? "text-amber-600 font-medium" : "text-gray-700"
            }`}
          >
            Newest first
          </button>
          <button
            onClick={() => {
              onChange("highest");
              setOpen(false);
            }}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
              value === "highest" ? "text-amber-600 font-medium" : "text-gray-700"
            }`}
          >
            Highest rated
          </button>
        </div>
      )}
    </div>
  );
}
