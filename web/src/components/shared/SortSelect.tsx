"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

interface SortOption {
  label: string;
  value: string;
}

export function SortSelect({ options, basePath }: { options: SortOption[]; basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || options[0]?.value;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === options[0]?.value) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(params.toString() ? `${basePath}?${params.toString()}` : basePath, { scroll: false });
    });
  }

  return (
    <select
      aria-label="Sort"
      className={`rounded-full border border-outline-variant bg-surface-container-lowest py-1.5 pl-3 pr-8 text-sm font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer ${isPending ? "opacity-60" : ""}`}
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}