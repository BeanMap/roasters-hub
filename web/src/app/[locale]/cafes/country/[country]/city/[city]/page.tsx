import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { CafeCard } from "@/components/cafes/CafeCard";
import { ItemListJsonLd } from "@/components/shared/JsonLd";
import { db } from "@/lib/db";
import { buildAlternates, buildOpenGraph, buildCanonical, seoKeywords } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const rows = await db.cafe.findMany({
      where: { status: "VERIFIED" },
      select: { countryCode: true, city: true },
      distinct: ["countryCode", "city"],
    });
    return rows.map((r) => ({
      country: r.countryCode,
      city: r.city.toLowerCase().replace(/\s+/g, "-"),
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; city: string; locale: string }>;
}): Promise<Metadata> {
  const { country, city, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profiles" });
  const row = await db.cafe.findFirst({
    where: {
      countryCode: country,
      status: "VERIFIED",
      city: { equals: city.replace(/-/g, " "), mode: "insensitive" },
    },
    select: { city: true, country: true },
  });
  if (!row) {
    const title = t("specialtyCoffeeCafes");
    return {
      title,
      keywords: seoKeywords("cafes"),
      alternates: buildAlternates(locale, `/cafes/country/${country}/city/${city}`),
    };
  }
  const title = t("cityCafesTitle", { city: row.city, country: row.country });
  const description = t("cityCafesDescription", { city: row.city, country: row.country });
  return {
    title,
    description,
    keywords: seoKeywords("cafes"),
    alternates: buildAlternates(locale, `/cafes/country/${country}/city/${city}`),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function CafeCityPage({
  params,
}: {
  params: Promise<{ country: string; city: string; locale: string }>;
}) {
  const { country, city, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profiles" });

  const cafes = await db.cafe.findMany({
    where: {
      status: "VERIFIED",
      countryCode: country,
      city: { equals: city.replace(/-/g, " "), mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      city: true,
      country: true,
      countryCode: true,
      coverImageUrl: true,
      status: true,
      _count: { select: { roasters: true, reviews: true } },
    },
  });

  if (cafes.length === 0) {
    const fallbackCountry = decodeURIComponent(country);
    const fallbackCity = city.replace(/-/g, " ");
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-on-surface-variant/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="font-headline text-4xl font-bold mb-4">{t("noCafesInCityTitle", { city: fallbackCity })}</h1>
          <p className="text-on-surface-variant text-lg mb-10 max-w-lg mx-auto">
            {t("noCafesInCityDesc", { city: fallbackCity, country: fallbackCountry })}
          </p>
          <div className="flex justify-center gap-4">
            <Link href={`/cafes/country/${country}`} className="bg-primary text-on-primary px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-all">
              {t("allCafesInCountry", { country: fallbackCountry })}
            </Link>
            <Link href="/cafes" className="border border-outline/20 text-on-surface-variant px-6 py-3 rounded-lg font-medium hover:bg-surface-container-low transition-all">
              {t("browseAllCafes")}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const countryName = cafes[0].country;
  const cityName = cafes[0].city;

  const cafeIds = cafes.map((c) => c.id);
  const ratingAggs = cafeIds.length > 0
    ? await db.review.groupBy({
        by: ["cafeId"],
        where: { cafeId: { in: cafeIds }, status: "APPROVED" },
        _avg: { rating: true },
      })
    : [];
  const ratingMap = new Map(ratingAggs.map((r) => [r.cafeId, r._avg.rating]));
  const cafesWithRating = cafes.map((cafe) => ({
    ...cafe,
    averageRating: ratingMap.get(cafe.id) ?? null,
  }));

  return (
    <>
      <ItemListJsonLd
        listName={t("cityCafesTitle", { city: cityName })}
        items={cafes.map((c) => ({
          name: c.name,
          url: buildCanonical(locale, `/cafes/${c.slug}`),
        }))}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <nav className="mb-4 text-on-surface-variant flex items-center gap-2 text-xs uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="/">{t("home")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <Link className="hover:text-primary transition-colors" href="/cafes">{t("cafes")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <Link
            className="hover:text-primary transition-colors"
            href={`/cafes/country/${country}`}
          >
            {countryName}
          </Link>
          <span className="text-[10px]">&rsaquo;</span>
          <span className="text-on-surface">{cityName}</span>
        </nav>

        <header className="mb-12">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface text-editorial-tight mb-2">
            {t("cityCafesTitle", { city: cityName })}
          </h1>
          <p className="text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            {t("verifiedCafeCountWithCountry", { count: cafes.length, country: countryName })}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {cafesWithRating.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href={`/cafes/country/${country}`}
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            &larr; {t("allCafesInCountry", { country: countryName })}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
