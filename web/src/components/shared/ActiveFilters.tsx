"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

export type ActiveFilter = { key: string; value: string; label: string };

/** Removable chips for every active filter — same row on every catalog. */
export function ActiveFilters({ basePath, filters }: { basePath: string; filters: ActiveFilter[] }) {
  const t = useTranslations("filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  if (filters.length === 0) return null;

  const remove = (f: ActiveFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    const rest = params.getAll(f.key).filter((v) => v !== f.value);
    params.delete(f.key);
    rest.forEach((v) => params.append(f.key, v));
    if (f.key === "country") params.delete("city");
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8" aria-label={t("activeFilters")}>
      {filters.map((f) => (
        <button
          key={`${f.key}:${f.value}`}
          type="button"
          onClick={() => remove(f)}
          className="group inline-flex items-center gap-1.5 rounded-full bg-on-surface text-surface pl-3 pr-2 py-1 text-[0.8125rem]"
          aria-label={`${t("removeFilter")}: ${f.label}`}
        >
          {f.label}
          <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-surface/20 group-hover:bg-surface/40" aria-hidden>
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => startTransition(() => router.replace(basePath))}
        className="text-sm text-primary hover:underline underline-offset-4 ml-1"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
