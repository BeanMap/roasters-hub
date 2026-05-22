import { Suspense } from "react";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { CafeCard } from "@/components/cafes/CafeCard";
import { CafeFilters } from "@/components/cafes/CafeFilters";
import { SortSelect } from "@/components/shared/SortSelect";
import { ItemListJsonLd } from "@/components/shared/JsonLd";
import { db } from "@/lib/db";
import { buildAlternates, buildOpenGraph, buildCanonical, seoKeywords } from "@/lib/seo";
import { buildPageHref } from "@/lib/search-params";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cafes" });
  const title = t("h1");
  const description = t("pageDescription");
  return {
    title,
    description,
    keywords: seoKeywords("cafes"),
    alternates: buildAlternates(locale, "/cafes"),
    openGraph: buildOpenGraph(title, description),
  };
}

const PAGE_SIZE = 12;

export default async function CafesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "cafes" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sort = typeof sp.sort === "string" ? sp.sort : "nameAZ";
  const country = typeof sp.country === "string" ? sp.country : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const amenities = typeof sp.amenities === "string"
    ? sp.amenities.split(",").filter(Boolean)
    : [];

  const where: Prisma.CafeWhereInput = {
    status: "VERIFIED",
    ...(country && { countryCode: country }),
    ...(q && { name: { contains: q, mode: "insensitive" as const } }),
    ...(amenities.length > 0 && { services: { hasSome: amenities } }),
  };

  const orderBy: Prisma.CafeOrderByWithRelationInput =
    sort === "city" ? { city: "asc" } : sort === "rating" ? { reviews: { _count: "desc" } } : { name: "asc" };

  const [total, cafes, countryRows] = await Promise.all([
    db.cafe.count({ where }),
    db.cafe.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        country: true,
        countryCode: true,
        city: true,
        address: true,
        lat: true,
        lng: true,
        website: true,
        instagram: true,
        phone: true,
        logoUrl: true,
        coverImageUrl: true,
        status: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { roasters: true, reviews: true } },
      },
    }),
    db.cafe.groupBy({
      by: ["countryCode", "country"],
      where: { status: "VERIFIED" },
      _count: { _all: true },
      orderBy: { country: "asc" },
    }),
  ]);

  const countries = countryRows.map((r) => ({
    code: r.countryCode,
    name: r.country,
    count: r._count._all,
  }));

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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <ItemListJsonLd
        listName={t("h1")}
        items={cafes.map((c) => ({
          name: c.name,
          url: buildCanonical(locale, `/cafes/${c.slug}`),
        }))}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <nav className="mb-4 text-on-surface-variant flex items-center gap-2 text-xs uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="/">{tCommon("home")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <span className="text-on-surface">{t("breadcrumb")}</span>
        </nav>

        <header className="mb-12">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface text-editorial-tight mb-2">
            {t("h1")}
          </h1>
          <p className="text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            {total} {t("pageDescription")}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-16">
          <Suspense fallback={<div className="w-[300px]" />}>
            <CafeFilters countries={countries} />
          </Suspense>

          <section className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-surface-container-low">
              <span className="text-sm text-on-surface-variant">
                Showing {cafes.length} of {total} results
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest font-semibold">{tCommon("sortBy")}</span>
                <Suspense fallback={<select className="bg-transparent border-none text-sm font-medium text-primary"><option>{t("sortNameAZ")}</option></select>}>
                  <SortSelect
                    basePath="/cafes"
                    options={[
                      { label: t("sortNameAZ"), value: "nameAZ" },
                      { label: t("sortCity"), value: "city" },
                      { label: t("sortRating"), value: "rating" },
                    ]}
                  />
                </Suspense>
              </div>
            </div>

            {cafesWithRating.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {cafesWithRating.map((cafe) => (
                  <CafeCard key={cafe.id} cafe={cafe} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-on-surface-variant text-lg mb-4">{t("noResultsFilters")}</p>
                <Link href="/cafes" className="text-primary font-medium hover:underline">{t("clearFilters")}</Link>
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-20 flex items-center justify-center gap-4">
                {page > 1 && (
                  <Link href={buildPageHref("/cafes", sp, page - 1)} className="flex items-center gap-1 px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                    &larr; {tCommon("previous")}
                  </Link>
                )}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={buildPageHref("/cafes", sp, p)}
                      className={
                        p === page
                          ? "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-primary text-on-primary"
                          : "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium hover:bg-surface-container transition-colors"
                      }
                    >
                      {p}
                    </Link>
                  ))}
                </div>
                {page < totalPages && (
                  <Link href={buildPageHref("/cafes", sp, page + 1)} className="flex items-center gap-1 px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                    {tCommon("next")} &rarr;
                  </Link>
                )}
              </nav>
            )}
          </section>
        </div>

        {/* Suggest banner */}
        <div className="mt-12 rounded-xl border border-outline-variant/30 bg-primary-fixed/30 p-6 text-center">
          <p className="mb-2 text-on-surface-variant">{t("suggestBannerText")}</p>
          <Link
            href="/register/cafe"
            className="inline-block rounded-lg bg-primary px-5 py-2 text-sm font-bold text-on-primary hover:bg-accent-hover transition-colors"
          >
            {t("suggestBannerCta")} →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
