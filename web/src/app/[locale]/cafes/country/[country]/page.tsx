import Link from "next/link";
import { notFound } from "next/navigation";
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
    const countries = await db.cafe.findMany({
      where: { status: "VERIFIED" },
      select: { countryCode: true },
      distinct: ["countryCode"],
    });
    return countries.map((c) => ({ country: c.countryCode }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; locale: string }>;
}): Promise<Metadata> {
  const { country, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profiles" });
  const row = await db.cafe.findFirst({
    where: { countryCode: country, status: "VERIFIED" },
    select: { country: true },
  });
  if (!row) {
    const title = t("specialtyCoffeeCafes");
    return {
      title,
      keywords: seoKeywords("cafes"),
      alternates: buildAlternates(locale, `/cafes/country/${country}`),
    };
  }
  const title = t("countryCafesTitle", { country: row.country });
  const description = t("countryCafesDescription", { country: row.country });
  return {
    title,
    description,
    keywords: seoKeywords("cafes"),
    alternates: buildAlternates(locale, `/cafes/country/${country}`),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function CafeCountryPage({
  params,
}: {
  params: Promise<{ country: string; locale: string }>;
}) {
  const { country, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profiles" });

  const [cafes, cityRows] = await Promise.all([
    db.cafe.findMany({
      where: { status: "VERIFIED", countryCode: country },
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
    }),
    db.cafe.groupBy({
      by: ["city"],
      where: { status: "VERIFIED", countryCode: country },
      _count: { _all: true },
      orderBy: { city: "asc" },
    }),
  ]);

  if (cafes.length === 0) notFound();

  const countryName = cafes[0].country;

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
        listName={t("countryCafesTitle", { country: countryName })}
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
          <span className="text-on-surface">{countryName}</span>
        </nav>

        <header className="mb-12">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface text-editorial-tight mb-2">
            {t("countryCafesTitle", { country: countryName })}
          </h1>
          <p className="text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            {t("verifiedCafeCount", { count: cafes.length })}
          </p>
        </header>

        {cityRows.length > 1 && (
          <section className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-4">
              {t("browseByCity")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {cityRows.map((row) => (
                <Link
                  key={row.city}
                  href={`/cafes/country/${country}/city/${row.city.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-4 py-2 rounded-full bg-surface-container text-sm font-medium hover:bg-surface-container-high transition-colors"
                >
                  {row.city}{" "}
                  <span className="text-on-surface-variant/50">({row._count._all})</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {cafesWithRating.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/cafes"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            &larr; {t("browseAllCafes")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
