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
export function commonWhere({ q, country, city }: { q?: string; country?: string; city?: string }) {
  return {
    ...(country && { countryCode: country }),
    ...(city && { city: { equals: city, mode: "insensitive" as const } }),
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

/** Group rows into the {name,countryCode,count} shape the city select expects. */
export function toCities(rows: { city: string; countryCode: string; _count: { _all: number } }[]) {
  return rows
    .map((r) => ({ name: r.city, countryCode: r.countryCode, count: r._count._all }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
