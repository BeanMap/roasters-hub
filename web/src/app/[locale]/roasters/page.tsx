import { Suspense } from "react";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { RoasterFilters } from "@/components/roasters/RoasterFilters";
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
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const country = typeof sp.country === "string" ? sp.country : undefined;
  const origins = Array.isArray(sp.origin) ? sp.origin : sp.origin ? [sp.origin] : [];
  const certs = Array.isArray(sp.cert) ? sp.cert : sp.cert ? [sp.cert] : [];
  const roast = typeof sp.roast === "string" ? sp.roast : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const orderBy: Prisma.RoasterOrderByWithRelationInput =
    sort === "nameAZ" ? { name: "asc" } : sort === "relevance" ? { featured: "desc" } : { createdAt: "desc" };

  const where: Prisma.RoasterWhereInput = {
    status: "VERIFIED",
    ...(country && { countryCode: country }),
    ...(origins.length && { origins: { hasSome: origins } }),
    ...(certs.length && { certifications: { hasSome: certs } }),
    ...(roast && { roastStyles: { has: roast } }),
    ...(q && { name: { contains: q, mode: "insensitive" as const } }),
  };

  const [total, roasters, countryRows] = await Promise.all([
    db.roaster.count({ where }),
    db.roaster.findMany({
      where,
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.roaster.groupBy({
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
        <nav className="mb-4 text-on-surface-variant flex items-center gap-2 text-xs uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="/">{tCommon("home")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <span className="text-on-surface">{t("breadcrumb")}</span>
        </nav>

        {/* Header */}
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
            <RoasterFilters countries={countries} />
          </Suspense>

          <section className="flex-1">
            {/* Sort bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-surface-container-low">
              <span className="text-sm text-on-surface-variant">
                Showing {roasters.length} of {total} results
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest font-semibold">{tCommon("sortBy")}</span>
                <Suspense fallback={<select className="bg-transparent border-none text-sm font-medium text-primary"><option>{t("sortNewest")}</option></select>}>
                  <SortSelect
                    basePath="/roasters"
                    options={[
                      { label: t("sortNewest"), value: "newest" },
                      { label: t("sortNameAZ"), value: "nameAZ" },
                      { label: t("sortRelevance"), value: "relevance" },
                    ]}
                  />
                </Suspense>
              </div>
            </div>

            {/* Grid */}
            {roasters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
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
            {totalPages > 1 && (
              <nav className="mt-20 flex items-center justify-center gap-4">
                {page > 1 && (
                  <Link href={buildPageHref("/roasters", sp, page - 1)} className="flex items-center gap-1 px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                    &larr; {tCommon("previous")}
                  </Link>
                )}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={buildPageHref("/roasters", sp, p)}
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
                  <Link href={buildPageHref("/roasters", sp, page + 1)} className="flex items-center gap-1 px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
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
