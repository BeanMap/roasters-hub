import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { ItemListJsonLd } from "@/components/shared/JsonLd";
import { db } from "@/lib/db";
import { buildAlternates, buildOpenGraph, buildCanonical, seoKeywords } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const countries = await db.roaster.findMany({
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
  const row = await db.roaster.findFirst({
    where: { countryCode: country, status: "VERIFIED" },
    select: { country: true },
  });
  if (!row) {
    const title = t("specialtyCoffeeRoasters");
    return {
      title,
      keywords: seoKeywords("roasters"),
      alternates: buildAlternates(locale, `/roasters/country/${country}`),
    };
  }
  const title = t("countryRoastersTitle", { country: row.country });
  const description = t("countryRoastersDescription", { country: row.country });
  return {
    title,
    description,
    keywords: seoKeywords("roasters"),
    alternates: buildAlternates(locale, `/roasters/country/${country}`),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string; locale: string }>;
}) {
  const { country, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profiles" });

  const roasters = await db.roaster.findMany({
    where: { status: "VERIFIED", countryCode: country },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { name: "asc" },
  });

  if (roasters.length === 0) notFound();

  const countryName = roasters[0].country;

  return (
    <>
      <ItemListJsonLd
        listName={t("countryRoastersTitle", { country: countryName })}
        items={roasters.map((r) => ({
          name: r.name,
          url: buildCanonical(locale, `/roasters/${r.slug}`),
        }))}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <nav className="mb-4 text-on-surface-variant flex items-center gap-2 text-xs uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="/">{t("home")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <Link className="hover:text-primary transition-colors" href="/roasters">{t("roasters")}</Link>
          <span className="text-[10px]">&rsaquo;</span>
          <span className="text-on-surface">{countryName}</span>
        </nav>

        <header className="mb-12">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface text-editorial-tight mb-2">
            {t("countryRoastersTitle", { country: countryName })}
          </h1>
          <p className="text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            {t("verifiedRoasterCount", { count: roasters.length })}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {roasters.map((roaster) => (
            <RoasterCard key={roaster.id} roaster={roaster} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/roasters"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            &larr; {t("browseAllRoasters")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
