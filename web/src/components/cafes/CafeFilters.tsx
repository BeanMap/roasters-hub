"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { CAFE_SERVICES } from "@/constants/cafe-services";
import { AmenityIcon } from "./AmenityIcon";

interface CafeFiltersProps {
  countries: { code: string; name: string; count: number }[];
}

export function CafeFilters({ countries }: CafeFiltersProps) {
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
      router.push(`/cafes?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleAmenity = useCallback(
    (amenity: string) => {
      const current = searchParams.get("amenities");
      const amenities = current ? current.split(",") : [];
      const updated = amenities.includes(amenity)
        ? amenities.filter((a) => a !== amenity)
        : [...amenities, amenity];
      updateFilter("amenities", updated.length > 0 ? updated.join(",") : null);
    },
    [searchParams, updateFilter]
  );

  const clearAll = useCallback(() => {
    router.push("/cafes");
  }, [router]);

  const activeCountry = searchParams.get("country");
  const activeAmenities = searchParams.get("amenities")?.split(",") || [];

  const hasActiveFilters =
    !!searchParams.get("country") ||
    activeAmenities.length > 0;

  return (
    <aside className="w-full lg:w-[300px] shrink-0">
      {/* Search — always visible on mobile */}
      <div className="lg:hidden mb-4">
        <input
          id="filter-search-mobile"
          className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm"
          placeholder={t("cafePlaceholder")}
          type="text"
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => updateFilter("q", e.target.value || null)}
        />
      </div>

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
            placeholder={t("cafePlaceholder")}
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

        <div>
          <label htmlFor="filter-country" className="label-mono text-outline mb-3 block">{t("country")}</label>
          <select
            id="filter-country"
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

        <div>
          <label className="label-mono text-outline mb-3 block">{t("amenities")}</label>
          <div className="flex flex-wrap gap-2">
            {CAFE_SERVICES.map((service) => {
              const isActive = activeAmenities.includes(service.value);
              return (
                <button
                  key={service.value}
                  onClick={() => toggleAmenity(service.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <AmenityIcon service={service.value} className="w-3.5 h-3.5" />
                  {service.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
