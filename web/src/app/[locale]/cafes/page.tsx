import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { CafeCard } from "@/components/cafes/CafeCard";
import { CatalogFilters, type Facet } from "@/components/shared/CatalogFilters";
import { CatalogToolbar } from "@/components/shared/CatalogToolbar";
import type { ActiveFilter } from "@/components/shared/ActiveFilters";
import { AmenityIcon } from "@/components/cafes/AmenityIcon";
import { CAFE_SERVICES } from "@/constants/cafe-services";
import { CAFE_STYLE_TO_SERVING, commonOrderBy, commonWhere, listParam, parseCatalogParams, toCities } from "@/lib/catalog";
import { ItemListJsonLd } from "@/components/shared/JsonLd";
import { db } from "@/lib/db";
import { buildAlternates, buildOpenGraph, buildCanonical, seoKeywords } from "@/lib/seo";
import { Pagination } from "@/components/shared/Pagination";
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
  const tFilters = await getTranslations({ locale, namespace: "filters" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const sp = await searchParams;
  const { page, q, country, city, styles, sort } = parseCatalogParams(sp);
  const amenities = listParam(sp, "amenity", "amenities");
  const serving = styles.map((v) => CAFE_STYLE_TO_SERVING[v]).filter(Boolean);

  const where: Prisma.CafeWhereInput = {
    status: "VERIFIED",
    ...commonWhere({ q, country, city }),
    ...(serving.length > 0 && { serving: { hasSome: serving } }),
    ...(amenities.length > 0 && { services: { hasSome: amenities } }),
  };

  const orderBy = commonOrderBy(sort);

  const [total, cafes, countryRows, cityRows] = await Promise.all([
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
    db.cafe.groupBy({
      by: ["city", "countryCode"],
      where: { status: "VERIFIED" },
      _count: { _all: true },
    }),
  ]);

  const countries = countryRows.map((r) => ({
    code: r.countryCode,
    name: r.country,
    count: r._count._all,
  }));

  const cities = toCities(cityRows);

  const facets: Facet[] = [
    {
      key: "style",
      label: tFilters("coffee"),
      options: Object.keys(CAFE_STYLE_TO_SERVING).map((v) => ({ value: v, label: tFilters(`style.${v}` as "style.Espresso") })),
    },
    {
      key: "amenity",
      label: tFilters("amenities"),
      options: CAFE_SERVICES.map((svc) => ({
        value: svc.value,
        label: tFilters(`amenity.${svc.value}` as "amenity.wifi"),
        icon: <AmenityIcon service={svc.value} className="w-3.5 h-3.5" />,
      })),
    },
  ];
  const active: ActiveFilter[] = [
    ...(q ? [{ key: "q", value: q, label: `“${q}”` }] : []),
    ...(country ? [{ key: "country", value: country, label: countries.find((c) => c.code === country)?.name ?? country }] : []),
    ...(city ? [{ key: "city", value: city, label: city }] : []),
    ...facets.flatMap((f) =>
      listParam(sp, f.key, f.key === "amenity" ? "amenities" : undefined).map((v) => ({
        key: f.key,
        value: v,
        label: f.options.find((o) => o.value === v)?.label ?? v,
      })),
    ),
  ];

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
        <nav className="mb-5 label-mono text-outline flex items-center gap-2">
          <Link className="hover:text-primary transition-colors" href="/">{tCommon("home")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <span className="text-on-surface">{t("breadcrumb")}</span>
        </nav>

        <header className="mb-12 pb-8 border-b border-outline-variant/70">
          <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.92] tracking-[-0.05em] text-on-surface">
            {t("h1")}
          </h1>
          <p className="mt-4 label-mono text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            {t("countLabel", { count: total })}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <Suspense fallback={<div className="lg:w-[280px]" />}>
            <CatalogFilters
              basePath="/cafes"
              searchPlaceholder={tFilters("cafePlaceholder")}
              countries={countries}
              cities={cities}
              facets={facets}
            />
          </Suspense>

          <section className="flex-1">
            <CatalogToolbar basePath="/cafes" shown={cafes.length} total={total} active={active} />

            {cafesWithRating.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
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

            <Pagination
              basePath="/cafes"
              searchParams={sp}
              page={page}
              totalPages={totalPages}
              labels={{ previous: tCommon("previous"), next: tCommon("next"), page: tCommon("page") }}
            />
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
