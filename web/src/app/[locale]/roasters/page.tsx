import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { CatalogFilters, type Facet } from "@/components/shared/CatalogFilters";
import { CatalogToolbar } from "@/components/shared/CatalogToolbar";
import type { ActiveFilter } from "@/components/shared/ActiveFilters";
import { commonOrderBy, commonWhere, listParam, parseCatalogParams, ROASTER_STYLE_VALUES, buildLocations, cityVariantsFor } from "@/lib/catalog";
import { CERTIFICATIONS, CERTIFICATION_LABELS, ORIGINS } from "@/types/certifications";
import { ItemListJsonLd } from "@/components/shared/JsonLd";
import { db } from "@/lib/db";
import { getRoasterLocationRows } from "@/lib/catalog-data";
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
  const t = await getTranslations({ locale, namespace: "roasters" });
  const title = t("h1");
  const description = t("pageDescription");
  return {
    title,
    description,
    keywords: seoKeywords("roasters"),
    alternates: buildAlternates(locale, "/roasters"),
    openGraph: buildOpenGraph(title, description),
  };
}

const PAGE_SIZE = 12;

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "roasters" });
  const tFilters = await getTranslations({ locale, namespace: "filters" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const sp = await searchParams;
  const { page, q, country, city, styles, sort } = parseCatalogParams(sp);
  const locationRows = await getRoasterLocationRows();
  const locations = buildLocations(locationRows, locale);
  const totalVerified = locationRows.reduce((n, r) => n + r._count._all, 0);
  const cityVariants = cityVariantsFor(locations, city);
  const origins = listParam(sp, "origin");
  const certs = listParam(sp, "cert");

  const where: Prisma.RoasterWhereInput = {
    status: "VERIFIED",
    ...commonWhere({ q, country, city, cityVariants }),
    ...(styles.length && { roastStyles: { hasSome: styles } }),
    ...(origins.length && { origins: { hasSome: origins } }),
    ...(certs.length && { certifications: { hasSome: certs } }),
  };

  const [total, roasters] = await Promise.all([
    db.roaster.count({ where }),
    db.roaster.findMany({
      where,
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: commonOrderBy(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);


  const styleLabel = (v: string) => tFilters(`style.${v}` as "style.Espresso");
  const facets: Facet[] = [
    { key: "style", label: tFilters("coffee"), options: ROASTER_STYLE_VALUES.map((v) => ({ value: v, label: styleLabel(v) })) },
    { key: "origin", label: tFilters("originRegions"), options: ORIGINS.slice(0, 10).map((o) => ({ value: o, label: o })) },
    { key: "cert", label: tFilters("certifications"), options: CERTIFICATIONS.map((c) => ({ value: c, label: CERTIFICATION_LABELS[c] })) },
  ];
  const active: ActiveFilter[] = [
    ...(q ? [{ key: "q", value: q, label: `“${q}”` }] : []),
    ...(country ? [{ key: "country", value: country, label: locations.find((l) => l.kind === "country" && l.value === country.toUpperCase())?.label ?? country }] : []),
    ...(city ? [{ key: "city", value: city, label: city }] : []),
    ...facets.flatMap((f) =>
      listParam(sp, f.key, f.key === "style" ? "roast" : undefined).map((v) => ({
        key: f.key,
        value: v,
        label: f.options.find((o) => o.value === v)?.label ?? v,
      })),
    ),
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <ItemListJsonLd
        listName={t("h1")}
        items={roasters.map((r) => ({
          name: r.name,
          url: buildCanonical(locale, `/roasters/${r.slug}`),
        }))}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumbs */}
        <nav className="mb-5 label-mono text-outline flex items-center gap-2">
          <Link className="hover:text-primary transition-colors" href="/">{tCommon("home")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <span className="text-on-surface">{t("breadcrumb")}</span>
        </nav>

        {/* Header */}
        <header className="mb-12 pb-8 border-b border-outline-variant/70">
          <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.92] tracking-[-0.05em] text-on-surface">
            {t("h1")}
          </h1>
          <p className="mt-4 label-mono text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            {t("countLabel", { count: totalVerified })}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <Suspense fallback={<div className="lg:w-[280px]" />}>
            <CatalogFilters
              basePath="/roasters"
              searchPlaceholder={tFilters("roasteryPlaceholder")}
              locations={locations}
              facets={facets}
            />
          </Suspense>

          <section className="flex-1">
            <CatalogToolbar basePath="/roasters" shown={roasters.length} total={total} active={active} />

            {/* Grid */}
            {roasters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                {roasters.map((roaster) => (
                  <RoasterCard key={roaster.id} roaster={roaster} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-on-surface-variant text-lg mb-4">{t("noResultsFilters")}</p>
                <Link href="/roasters" className="text-primary font-medium hover:underline">{t("clearFilters")}</Link>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              basePath="/roasters"
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
            href="/register"
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
