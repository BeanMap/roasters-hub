import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://beanmap.pl";
const LOCALES = ["pl", "en", "de"];
const DEFAULT_LOCALE = "pl";

function localeUrl(path: string, locale: string): string {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${BASE_URL}${prefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [roasters, cafes, roasterCountries, cafeCountries] = await Promise.all([
    db.roaster.findMany({
      where: { status: "VERIFIED" },
      select: { slug: true, updatedAt: true },
    }),
    db.cafe.findMany({
      where: { status: "VERIFIED" },
      select: { slug: true, updatedAt: true, countryCode: true, city: true },
    }),
    db.roaster.findMany({
      where: { status: "VERIFIED" },
      select: { countryCode: true, country: true },
      distinct: ["countryCode"],
      orderBy: { country: "asc" },
    }),
    db.cafe.findMany({
      where: { status: "VERIFIED" },
      select: { countryCode: true, country: true, city: true },
      distinct: ["countryCode", "city"],
      orderBy: [{ country: "asc" }, { city: "asc" }],
    }),
  ]);

  const staticPages = [
    { path: "/", priority: 1.0, changeFreq: "daily" as const },
    { path: "/roasters", priority: 0.9, changeFreq: "daily" as const },
    { path: "/cafes", priority: 0.9, changeFreq: "daily" as const },
    { path: "/map", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/register", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/register/cafe", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/suggest/roastery", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/suggest/cafe", priority: 0.6, changeFreq: "monthly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of staticPages) {
      entries.push({
        url: localeUrl(page.path, locale),
        lastModified: new Date(),
        changeFrequency: page.changeFreq,
        priority: page.priority,
      });
    }
  }

  for (const locale of LOCALES) {
    for (const roaster of roasters) {
      entries.push({
        url: localeUrl(`/roasters/${roaster.slug}`, locale),
        lastModified: roaster.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    }
  }

  for (const locale of LOCALES) {
    for (const cafe of cafes) {
      entries.push({
        url: localeUrl(`/cafes/${cafe.slug}`, locale),
        lastModified: cafe.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    }
  }

  const countrySet = new Set<string>();
  for (const locale of LOCALES) {
    for (const row of roasterCountries) {
      const code = row.countryCode;
      if (countrySet.has(`${locale}-roaster-${code}`)) continue;
      countrySet.add(`${locale}-roaster-${code}`);
      entries.push({
        url: localeUrl(`/roasters/country/${code}`, locale),
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  }

  for (const locale of LOCALES) {
    for (const row of cafeCountries) {
      entries.push({
        url: localeUrl(`/cafes/country/${row.countryCode}`, locale),
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  }

  for (const locale of LOCALES) {
    for (const row of cafeCountries) {
      const citySlug = row.city.replace(/\s+/g, "-");
      entries.push({
        url: localeUrl(
          `/cafes/country/${row.countryCode}/city/${citySlug}`,
          locale,
        ),
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  }

  return entries;
}
