"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export type FacetOption = { value: string; label: string; icon?: ReactNode };
export type Facet = { key: string; label: string; options: FacetOption[] };

type CatalogFiltersProps = {
  basePath: "/roasters" | "/cafes";
  searchPlaceholder: string;
  countries: { code: string; name: string; count: number }[];
  cities: { name: string; countryCode: string; count: number }[];
  /** Shared "coffee" facet first, then type-specific facets. Same chip UI for all. */
  facets: Facet[];
};

const field =
  "w-full bg-surface-container-lowest border border-outline-variant rounded-full py-2.5 px-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

/**
 * One filter panel for every catalog (roasters, cafés): same order, same
 * controls, same URL params. Only the type-specific facets differ.
 */
export function CatalogFilters({ basePath, searchPlaceholder, countries, cities, facets }: CatalogFiltersProps) {
  const t = useTranslations("filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const navigate = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
    },
    [basePath, router, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string | null) =>
      navigate((p) => (value ? p.set(key, value) : p.delete(key))),
    [navigate],
  );

  const toggle = useCallback(
    (key: string, value: string) =>
      navigate((p) => {
        const current = p.getAll(key);
        p.delete(key);
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        next.forEach((v) => p.append(key, v));
      }),
    [navigate],
  );

  // Debounced search: no navigation on every keystroke.
  const onQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setParam("q", value.trim() || null), 350);
  };
  useEffect(() => () => clearTimeout(debounce.current), []);

  const activeCountry = searchParams.get("country") ?? "";
  const activeCity = searchParams.get("city") ?? "";
  const visibleCities = activeCountry ? cities.filter((c) => c.countryCode === activeCountry) : cities;
  const activeCount =
    (activeCountry ? 1 : 0) +
    (activeCity ? 1 : 0) +
    facets.reduce((n, f) => n + searchParams.getAll(f.key).length, 0);

  return (
    <aside className={`w-full lg:w-[280px] shrink-0 transition-opacity ${isPending ? "opacity-70" : ""}`} aria-busy={isPending}>
      {/* Search — always visible */}
      <form
        role="search"
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          clearTimeout(debounce.current);
          setParam("q", query.trim() || null);
        }}
      >
        <label htmlFor={`${basePath}-search`} className="label-mono text-outline mb-2 block">{t("searchName")}</label>
        <svg className="absolute left-4 bottom-3 w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path d="m20 20-3.5-3.5" strokeWidth={2} strokeLinecap="round" />
        </svg>
        <input
          id={`${basePath}-search`}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`${field} pl-10`}
          autoComplete="off"
        />
      </form>

      {/* Mobile toggle */}
      <button
        type="button"
        className="lg:hidden mt-4 w-full flex items-center justify-between rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-3"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-semibold">
          {t("title")}
          {activeCount > 0 && (
            <span className="ml-2 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-primary text-on-primary text-xs">{activeCount}</span>
          )}
        </span>
        <svg className={`w-5 h-5 text-on-surface-variant transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`${open ? "block" : "hidden"} lg:block mt-8 space-y-8`}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl hidden lg:block">{t("title")}</h2>
          {activeCount > 0 && (
            <button type="button" onClick={() => startTransition(() => router.replace(basePath))} className="text-sm text-primary hover:underline underline-offset-4">
              {t("clearAll")}
            </button>
          )}
        </div>

        {/* Location — same for every listing type */}
        <fieldset className="space-y-3">
          <legend className="label-mono text-outline mb-3">{t("location")}</legend>
          <select
            aria-label={t("country")}
            className={field}
            value={activeCountry}
            onChange={(e) =>
              navigate((p) => {
                if (e.target.value) p.set("country", e.target.value);
                else p.delete("country");
                p.delete("city");
              })
            }
          >
            <option value="">{t("allCountries")}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <select
            aria-label={t("city")}
            className={field}
            value={activeCity}
            onChange={(e) => setParam("city", e.target.value || null)}
            disabled={visibleCities.length === 0}
          >
            <option value="">{t("allCities")}</option>
            {visibleCities.map((c) => (
              <option key={`${c.countryCode}-${c.name}`} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </fieldset>

        {/* Facets — identical chip controls for every facet */}
        {facets.map((facet) => {
          const active = searchParams.getAll(facet.key);
          return (
            <fieldset key={facet.key}>
              <legend className="label-mono text-outline mb-3">{facet.label}</legend>
              <div className="flex flex-wrap gap-2">
                {facet.options.map((opt) => {
                  const on = active.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(facet.key, opt.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] transition-colors ${
                        on
                          ? "border-on-surface bg-on-surface text-surface"
                          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-on-surface/40 hover:text-on-surface"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </aside>
  );
}
