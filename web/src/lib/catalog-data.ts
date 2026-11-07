import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export type LocationRow = { countryCode: string | null; city: string | null; _count: { _all: number } };

/**
 * Country/city counts for the catalog location picker. Identical for every
 * request, so it is cached (1h, like the ISR pages) instead of running before
 * every filtered query. Admin edits call revalidatePath("/roasters" | "/cafes"),
 * which also drops these entries through the page's implicit cache tags.
 */
export const getRoasterLocationRows = unstable_cache(
  async (): Promise<LocationRow[]> => {
    const rows = await db.roaster.groupBy({
      by: ["countryCode", "city"],
      where: { status: "VERIFIED" },
      _count: { _all: true },
    });
    return rows.map((r) => ({ countryCode: r.countryCode, city: r.city, _count: { _all: r._count._all } }));
  },
  ["catalog-locations-roasters"],
  { revalidate: 3600, tags: ["roasters"] },
);

export const getCafeLocationRows = unstable_cache(
  async (): Promise<LocationRow[]> => {
    const rows = await db.cafe.groupBy({
      by: ["countryCode", "city"],
      where: { status: "VERIFIED" },
      _count: { _all: true },
    });
    return rows.map((r) => ({ countryCode: r.countryCode, city: r.city, _count: { _all: r._count._all } }));
  },
  ["catalog-locations-cafes"],
  { revalidate: 3600, tags: ["cafes"] },
);
