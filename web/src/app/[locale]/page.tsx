import Link from "next/link";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { HeroVideo } from "@/components/shared/HeroVideo";
import { OrganizationJsonLd } from "@/components/shared/JsonLd";
import { buildAlternates, buildOpenGraph, seoKeywords } from "@/lib/seo";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("heroTitle");
  const description = t("heroDesc");
  return {
    title,
    description,
    keywords: seoKeywords("home"),
    alternates: buildAlternates(locale),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const [featuredRoasters, roasterCount, countryCount, cafeCount] = await Promise.all([
    db.roaster.findMany({
      where: { status: "VERIFIED", featured: true },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      take: 4,
    }),
    db.roaster.count({ where: { status: "VERIFIED" } }),
    db.roaster.findMany({
      where: { status: "VERIFIED" },
      select: { countryCode: true },
      distinct: ["countryCode"],
    }).then((r) => r.length),
    db.cafe.count({ where: { status: "VERIFIED" } }),
  ]);

  const communityItems = [
    { title: t("communityRoastersTitle"), desc: t("communityRoastersDesc"), iconBg: "#ffdbc9", emoji: "🫘" },
    { title: t("communityCafesTitle"), desc: t("communityCafesDesc"), iconBg: "#aeeecb", emoji: "☕" },
    { title: t("communityLoversTitle"), desc: t("communityLoversDesc"), iconBg: "#c8e6ff", emoji: "🗺️" },
  ];

  return (
    <>
      <OrganizationJsonLd
        name="Bean Map"
        url={process.env.NEXT_PUBLIC_APP_URL || "https://beanmap.pl"}
        description={t("heroDesc")}
      />
      <Header />
      <main>
        {/* Hero Section — full-screen video background */}
        <section
          className="relative overflow-hidden min-h-screen flex items-center"
          style={{ background: "#1a1009" }}
        >
          {/* Background video — opacity 0.55 per design spec */}
          <HeroVideo />
          {/* Diagonal gradient overlay: left-heavy for text legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, rgba(10,5,0,0.72) 0%, rgba(10,5,0,0.35) 55%, rgba(10,5,0,0.18) 100%)",
            }}
          />
          {/* Bottom fade — blends into the stats bar / site bg below */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(249,249,247,0.9), transparent)",
            }}
          />
          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-[80px] w-full">
            <div className="max-w-[640px]">
              <div
                className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase px-3 py-[5px] rounded-full mb-[22px] backdrop-blur-sm"
                style={{
                  background: "rgba(255,219,201,0.18)",
                  border: "1px solid rgba(255,219,201,0.35)",
                  color: "#ffdbc9",
                }}
              >
                🫘 {t("heroBadge")}
              </div>
              <h1
                className="font-headline text-[58px] font-semibold tracking-[-0.025em] text-white leading-[1.06] mb-5"
                style={{
                  textWrap: "pretty",
                  textShadow: "0 2px 24px rgba(0,0,0,0.25)",
                }}
              >
                {t("heroTitle")}
              </h1>
              <p
                className="text-lg text-white/80 leading-[1.65] mb-9 max-w-xl"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
              >
                {t("heroDesc")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/roasters"
                  className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-[30px] py-[14px] rounded-lg font-semibold text-base hover:bg-accent-hover transition-colors"
                >
                  {tNav("browseRoasters")}
                  <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-[30px] py-[14px] rounded-lg font-semibold text-base text-white transition-colors backdrop-blur-sm"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1.5px solid rgba(255,255,255,0.45)",
                  }}
                >
                  {t("listRoastery")}
                </Link>
                <Link
                  href="/cafes"
                  className="inline-flex items-center gap-1.5 text-white/75 px-4 py-[14px] rounded-lg font-semibold text-base hover:text-white transition-colors"
                >
                  {t("findCafe")}
                  <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <div className="border-t border-b border-surface-container-high bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-6 py-[22px] flex flex-col md:flex-row justify-center items-center gap-10 md:gap-14">
            <div className="text-center">
              <div className="font-headline text-[38px] font-bold text-primary leading-none tracking-[-0.03em]">{roasterCount}+</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-outline mt-[3px]">{t("statsRoastersLabel")}</div>
            </div>
            <div className="h-[38px] w-px bg-surface-container-high hidden md:block" />
            <div className="text-center">
              <div className="font-headline text-[38px] font-bold text-primary leading-none tracking-[-0.03em]">{cafeCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-outline mt-[3px]">{t("statsCafesLabel")}</div>
            </div>
            <div className="h-[38px] w-px bg-surface-container-high hidden md:block" />
            <div className="text-center">
              <div className="font-headline text-[38px] font-bold text-primary leading-none tracking-[-0.03em]">{countryCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-outline mt-[3px]">{t("statsCountriesLabel")}</div>
            </div>
            <div className="h-[38px] w-px bg-surface-container-high hidden md:block" />
            <div className="text-center">
              <div className="font-headline text-[38px] font-bold text-primary leading-none tracking-[-0.03em]">{roasterCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-outline mt-[3px]">{t("statsVerifiedLabel")}</div>
            </div>
          </div>
        </div>

        {/* Featured Roasters */}
        <section className="max-w-7xl mx-auto px-6 py-[60px]">
          <div className="flex justify-between items-baseline mb-8">
            <div>
              <h2 className="font-headline text-[34px] font-semibold tracking-[-0.02em] text-on-surface">{t("featuredRoastersTitle")}</h2>
              <p className="text-[15px] text-outline mt-1.5">{t("featuredRoastersDesc")}</p>
            </div>
            <Link className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:opacity-80 transition-opacity" href="/roasters">
              {t("viewAllRoasters")} ↗
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredRoasters.map((roaster) => (
              <RoasterCard key={roaster.id} roaster={roaster} />
            ))}
          </div>
        </section>

        {/* Value Props */}
        <section className="bg-surface-container-lowest py-[60px] border-t border-surface-container-high">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-headline text-[34px] font-semibold tracking-[-0.02em] text-center text-on-surface mb-10">
              {t("communityTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {communityItems.map(({ title, desc, iconBg, emoji }) => (
                <div key={title} className="text-center px-4">
                  <div
                    className="w-[52px] h-[52px] rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl"
                    style={{ background: iconBg }}
                  >
                    {emoji}
                  </div>
                  <h3 className="font-headline text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-on-surface-variant leading-[1.65]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map Teaser */}
        <section className="py-[60px] max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="font-headline text-[34px] font-semibold tracking-[-0.02em] text-on-surface mb-4 leading-[1.1]">
                {t("mapTitle")}
              </h2>
              <p className="text-base text-on-surface-variant mb-8 leading-relaxed">
                {t("mapDesc")}
              </p>
              <Link
                href="/map"
                className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-5 py-[10px] rounded-lg font-semibold text-sm hover:bg-accent-hover transition-colors"
              >
                {t("exploreMap")}
                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </Link>
            </div>
            <div className="relative h-[320px] rounded-xl overflow-hidden bg-[#f4f4f0]">
              <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop" alt="World map" fill className="object-cover opacity-50 grayscale" sizes="50vw" />
              <div className="absolute top-1/4 left-1/3 w-[30px] h-[30px] bg-primary rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(151,68,0,0.4)] cursor-pointer" />
              <div className="absolute top-1/2 left-2/3 w-[30px] h-[30px] bg-primary rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(151,68,0,0.4)]" />
              <div className="absolute bottom-1/3 left-1/2 w-[30px] h-[30px] bg-primary rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(151,68,0,0.4)] animate-pulse" />
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-background py-24 border-t border-outline-variant/10">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="font-headline text-4xl font-bold text-on-background mb-4">{t("newsletterTitle")}</h2>
            <p className="text-on-surface-variant mb-10 font-light">{t("newsletterDesc")}</p>
            <NewsletterForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
