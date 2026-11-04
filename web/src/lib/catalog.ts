/**
 * Shared catalog logic for /roasters and /cafes.
 *
 * Both catalogs use the same URL contract so search & filtering behave the
 * same way for every listing type:
 *   q        free-text search (name or city)
 *   country  country code
 *   city     city name (exact, case-insensitive)
 *   style    coffee style — repeated (?style=Espresso&style=Filter)
 *   <facet>  type-specific facets — repeated (origin, cert, amenity)
 *   sort     recommended | nameAZ | newest | mostReviewed
 *   page     1-based page number
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export const SORT_VALUES = ["recommended", "nameAZ", "newest", "mostReviewed"] as const;
export type CatalogSort = (typeof SORT_VALUES)[number];

/** Read a repeated param; also accepts legacy comma-separated values. */
export function listParam(sp: SearchParams, key: string, legacyKey?: string): string[] {
  const raw = [sp[key], legacyKey ? sp[legacyKey] : undefined]
    .flatMap((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
  return [...new Set(raw)];
}

function stringParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : undefined;
}

export function parseCatalogParams(sp: SearchParams) {
  const sortRaw = stringParam(sp, "sort");
  // Legacy values: "relevance" → recommended, "rating" → mostReviewed.
  const sortAlias: Record<string, CatalogSort> = { relevance: "recommended", rating: "mostReviewed" };
  const sort: CatalogSort =
    (SORT_VALUES as readonly string[]).includes(sortRaw ?? "")
      ? (sortRaw as CatalogSort)
      : sortAlias[sortRaw ?? ""] ?? "recommended";

  return {
    page: Math.max(1, Number(stringParam(sp, "page")) || 1),
    q: stringParam(sp, "q"),
    country: stringParam(sp, "country"),
    city: stringParam(sp, "city"),
    styles: listParam(sp, "style", "roast"),
    sort,
  };
}

/** Prisma `where` fragment shared by roasters and cafés. */
export function commonWhere({ q, country, city, cityVariants }: { q?: string; country?: string; city?: string; cityVariants?: string[] }) {
  return {
    ...(country && { countryCode: { equals: country.toUpperCase(), mode: "insensitive" as const } }),
    ...(city && { city: { in: cityVariants?.length ? cityVariants : [city.trim()], mode: "insensitive" as const } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { city: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };
}

/** Prisma `orderBy` shared by roasters and cafés (both have featured/name/createdAt/reviews). */
export function commonOrderBy(sort: CatalogSort) {
  switch (sort) {
    case "nameAZ":
      return [{ name: "asc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }];
    case "mostReviewed":
      return [{ reviews: { _count: "desc" as const } }, { name: "asc" as const }];
    default:
      return [{ featured: "desc" as const }, { name: "asc" as const }];
  }
}

/**
 * Coffee style — the facet both listing types share. Espresso and Filter mean
 * the same thing everywhere; roasters add roast levels, cafés add drinks.
 */
export const ROASTER_STYLE_VALUES = ["Espresso", "Filter", "Light", "Medium", "Dark"] as const;
export const CAFE_STYLE_TO_SERVING: Record<string, string> = {
  Espresso: "Espresso",
  Filter: "Filter Coffee",
  ColdBrew: "Cold Brew/Drip",
  Decaf: "Decaf Coffee",
  Nitro: "Nitro Coffee",
};

export type LocationOption = {
  kind: "country" | "city";
  /** URL value: country code (country) or city name (city). */
  value: string;
  countryCode: string;
  label: string;
  /** Country label shown next to a city. */
  hint?: string;
  count: number;
  /** All stored spellings of a city (e.g. "Poznan", "Poznań"). */
  variants?: string[];
};

/** Lower-case, accent-free key so "Poznań", "poznan " and "POZNAN" match. */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").trim().toLowerCase();
}

/**
 * Countries and cities for the location picker, built from one
 * `groupBy(["countryCode", "city"])`. Robust to messy user-entered data:
 * country names come from the ISO code (localized), invalid/empty codes are
 * skipped, and cities differing only in case/accents/whitespace are merged.
 */
export function buildLocations(
  rows: { countryCode: string | null; city: string | null; _count: { _all: number } }[],
  locale: string,
): LocationOption[] {
  let regionNames: Intl.DisplayNames | undefined;
  try {
    regionNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    regionNames = undefined;
  }
  const countries = new Map<string, number>();
  const cities = new Map<string, { code: string; spellings: Map<string, number>; count: number }>();

  for (const row of rows) {
    const code = (row.countryCode ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) continue;
    const n = row._count._all;
    countries.set(code, (countries.get(code) ?? 0) + n);
    const city = (row.city ?? "").trim();
    if (!city) continue;
    const key = `${code}:${foldText(city)}`;
    const entry = cities.get(key) ?? { code, spellings: new Map(), count: 0 };
    entry.count += n;
    entry.spellings.set(city, (entry.spellings.get(city) ?? 0) + n);
    cities.set(key, entry);
  }

  const countryLabel = (code: string) => regionNames?.of(code) ?? code;
  const out: LocationOption[] = [];
  for (const [code, count] of countries) {
    out.push({ kind: "country", value: code, countryCode: code, label: countryLabel(code), count });
  }
  for (const { code, spellings, count } of cities.values()) {
    // Prefer the most common spelling, then the one with diacritics.
    const label = [...spellings.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0][0];
    out.push({ kind: "city", value: label, countryCode: code, label, hint: countryLabel(code), count, variants: [...spellings.keys()] });
  }
  return out.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, locale));
}

/** Spellings stored for the selected city, so "Poznan" also finds "Poznań". */
export function cityVariantsFor(locations: LocationOption[], city: string | undefined): string[] | undefined {
  if (!city) return undefined;
  const key = foldText(city);
  return locations.find((l) => l.kind === "city" && foldText(l.value) === key)?.variants;
}

/** ASCII URL slug for a city: "Poznań" → "poznan", "Frankfurt am Main" → "frankfurt-am-main". */
export function cityUrlSlug(city: string): string {
  return foldText(city).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Old English slugs that existed before cities were renamed to local names. */
const LEGACY_CITY_SLUGS: Record<string, string> = {
  warsaw: "warszawa",
  munich: "munchen",
  cracow: "krakow",
  cologne: "koln",
  nuremberg: "nurnberg",
};

/**
 * Resolve a city URL slug against the stored city names of one country.
 * Returns the matching spellings, or the canonical slug to redirect to.
 */
export function resolveCitySlug(
  slug: string,
  storedCities: string[],
): { variants: string[]; redirectTo?: undefined } | { variants: []; redirectTo: string } | null {
  const wanted = cityUrlSlug(decodeURIComponent(slug));
  const variants = [...new Set(storedCities.filter((c) => cityUrlSlug(c) === wanted))];
  if (variants.length > 0) return { variants };
  const legacy = LEGACY_CITY_SLUGS[wanted];
  if (legacy && storedCities.some((c) => cityUrlSlug(c) === legacy)) return { variants: [], redirectTo: legacy };
  return null;
}
