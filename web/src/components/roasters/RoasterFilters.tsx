"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { CERTIFICATIONS, CERTIFICATION_LABELS, ROAST_STYLES, ORIGINS } from "@/types/certifications";

interface RoasterFiltersProps {
  countries: { code: string; name: string; count: number }[];
}

export function RoasterFilters({ countries }: RoasterFiltersProps) {
  const t = useTranslations("filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/roasters?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleArrayFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll(key);
      if (current.includes(value)) {
        params.delete(key);
        current.filter((v) => v !== value).forEach((v) => params.append(key, v));
      } else {
        params.append(key, value);
      }
      params.delete("page");
      router.push(`/roasters?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push("/roasters");
  }, [router]);

  const activeCountry = searchParams.get("country");
  const activeOrigins = searchParams.getAll("origin");
  const activeCerts = searchParams.getAll("cert");
  const activeRoast = searchParams.get("roast");

  const hasActiveFilters =
    !!searchParams.get("country") ||
    searchParams.getAll("origin").length > 0 ||
    searchParams.getAll("cert").length > 0 ||
    !!searchParams.get("roast");

  return (
    <aside className="w-full lg:w-[300px] shrink-0">
      {/* Search — always visible on mobile */}
      <div className="lg:hidden mb-4">
        <input
          id="filter-search-mobile"
          className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm"
          placeholder={t("roasteryPlaceholder")}
          type="text"
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => updateFilter("q", e.target.value || null)}
        />
      </div>

      {/* Mobile toggle header */}
      <button
        className="lg:hidden w-full flex items-center justify-between py-3 border-b border-outline-variant/20 mb-6"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-headline text-2xl flex items-center gap-2">
          {t("title")}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </span>
        <svg
          className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`space-y-10 ${open ? "block" : "hidden"} lg:block`}>
        {/* Search — inside panel on desktop */}
        <div className="hidden lg:block">
          <label htmlFor="filter-search-desktop" className="label-mono text-outline mb-3 block">{t("searchName")}</label>
          <input
            id="filter-search-desktop"
            className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm"
            placeholder={t("roasteryPlaceholder")}
            type="text"
            defaultValue={searchParams.get("q") || ""}
            onChange={(e) => updateFilter("q", e.target.value || null)}
          />
        </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline text-2xl hidden lg:block">{t("title")}</h2>
        <button onClick={clearAll} className="text-sm text-primary hover:underline underline-offset-4">
          {t("clearAll")}
        </button>
      </div>

      {/* Country */}
      <div>
        <label className="label-mono text-outline mb-3 block">{t("country")}</label>
        <select
          className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm"
          value={activeCountry || ""}
          onChange={(e) => updateFilter("country", e.target.value || null)}
        >
          <option value="">{t("allCountries")}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {/* Origin Chips */}
      <div>
        <label className="label-mono text-outline mb-3 block">{t("originRegions")}</label>
        <div className="flex flex-wrap gap-2">
          {ORIGINS.slice(0, 6).map((origin) => (
            <button
              key={origin}
              onClick={() => toggleArrayFilter("origin", origin)}
              className={
                activeOrigins.includes(origin)
                  ? "px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs transition-colors"
                  : "px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs hover:bg-surface-variant transition-colors"
              }
            >
              {origin}
            </button>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="label-mono text-outline mb-3 block">{t("certifications")}</label>
        <div className="space-y-3">
          {CERTIFICATIONS.slice(0, 5).map((cert) => (
            <label key={cert} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={activeCerts.includes(cert)}
                onChange={() => toggleArrayFilter("cert", cert)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                {CERTIFICATION_LABELS[cert]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Roast Style */}
      <div>
        <label className="label-mono text-outline mb-3 block">{t("roastStyle")}</label>
        <div className="flex flex-col gap-2">
          {ROAST_STYLES.map((style) => (
            <label key={style} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="roast"
                checked={activeRoast === style}
                onChange={() => updateFilter("roast", activeRoast === style ? null : style)}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm">{style}</span>
            </label>
          ))}
        </div>
      </div>
      </div>
    </aside>
  );
}
