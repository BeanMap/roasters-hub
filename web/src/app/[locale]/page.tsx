import { Link } from "@/i18n/navigation";
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
    { title: t("communityRoastersTitle"), desc: t("communityRoastersDesc"), href: "/register" },
    { title: t("communityCafesTitle"), desc: t("communityCafesDesc"), href: "/register/cafe" },
    { title: t("communityLoversTitle"), desc: t("communityLoversDesc"), href: "/map" },
  ];

  const stats = [
    { value: roasterCount, label: t("statsRoastersLabel") },
    { value: cafeCount, label: t("statsCafesLabel") },
    { value: countryCount, label: t("statsCountriesLabel") },
  ];

  const arrow = (
    <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17L17 7M17 7H8M17 7v9" />
    </svg>
  );

  return (
    <>
      <OrganizationJsonLd
        name="Bean Map"
        url={process.env.NEXT_PUBLIC_APP_URL || "https://beanmap.pl"}
        description={t("heroDesc")}
      />
      <Header />
      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#1f1611] text-[#f5efe6]">
          <HeroVideo />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(120% 90% at 85% 10%, rgba(179,68,27,0.28), transparent 55%), linear-gradient(100deg, rgba(31,22,17,0.96) 0%, rgba(31,22,17,0.82) 45%, rgba(31,22,17,0.45) 100%)",
            }}
          />
          <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-10 md:pt-28 min-h-[86svh] flex flex-col">
            <div className="rise label-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-[#f2a77d]">
              <span>Bean Map</span>
              <span className="h-px w-8 bg-[#f2a77d]/50" aria-hidden />
              <span>{t("heroBadge")}</span>
            </div>

            <h1
              className="rise mt-6 max-w-[14ch] text-[clamp(2.9rem,9vw,7.25rem)] leading-[0.92] tracking-[-0.05em] text-[#fbf8f3]"
              style={{ animationDelay: "80ms", fontVariationSettings: '"opsz" 96, "wdth" 85' }}
            >
              {t("heroTitle")}
            </h1>

            <p className="rise mt-7 max-w-[46ch] text-lg md:text-xl leading-relaxed text-[#f5efe6]/75" style={{ animationDelay: "160ms" }}>
              {t("heroDesc")}
            </p>

            <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <Link
                href="/roasters"
                className="group inline-flex items-center gap-2 rounded-full bg-[#f5efe6] text-[#1f1611] pl-6 pr-5 py-3.5 font-semibold hover:bg-white transition-colors"
              >
                {tNav("browseRoasters")}
                {arrow}
              </Link>
              <Link
                href="/cafes"
                className="group inline-flex items-center gap-2 rounded-full border border-[#f5efe6]/30 pl-6 pr-5 py-3.5 font-semibold text-[#f5efe6] hover:border-[#f5efe6]/70 hover:bg-white/5 transition-colors"
              >
                {t("findCafe")}
                {arrow}
              </Link>
              <Link
                href="/register"
                className="ml-1 text-sm font-medium text-[#f5efe6]/60 underline decoration-[#f5efe6]/25 underline-offset-4 hover:text-[#f5efe6] hover:decoration-[#f2a77d] transition-colors"
              >
                {t("listRoastery")}
              </Link>
            </div>

            {/* Stats — printed like the spec block on a coffee bag */}
            <dl className="rise mt-auto pt-16 grid grid-cols-3 border-t border-[#f5efe6]/15" style={{ animationDelay: "320ms" }}>
              {stats.map((stat, i) => (
                <div key={stat.label} className={`pt-5 ${i > 0 ? "pl-4 md:pl-8 border-l border-[#f5efe6]/15" : ""}`}>
                  <dt className="label-mono text-[#f5efe6]/55">{stat.label}</dt>
                  <dd className="mt-1 font-headline text-[clamp(2rem,5vw,3.5rem)] leading-none text-[#fbf8f3] tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Featured roasters ───────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
            <div>
              <p className="label-mono text-primary">01 — {t("featuredRoastersDesc")}</p>
              <h2 className="mt-3 text-[clamp(2.25rem,5vw,4rem)] text-on-surface">{t("featuredRoastersTitle")}</h2>
            </div>
            <Link className="group inline-flex items-center gap-1.5 font-semibold text-on-surface hover:text-primary transition-colors" href="/roasters">
              {t("viewAllRoasters")}
              {arrow}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {featuredRoasters.map((roaster) => (
              <RoasterCard key={roaster.id} roaster={roaster} />
            ))}
          </div>
        </section>

        {/* ── Who it's for ────────────────────────────────────── */}
        <section className="border-y border-outline-variant/70 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
            <p className="label-mono text-primary">02</p>
            <h2 className="mt-3 max-w-[18ch] text-[clamp(2rem,4.5vw,3.5rem)] text-on-surface">{t("communityTitle")}</h2>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 border-t border-outline-variant">
              {communityItems.map(({ title, desc, href }, i) => (
                <Link
                  key={title}
                  href={href}
                  className={`group block py-8 md:py-10 md:px-8 first:md:pl-0 border-b md:border-b-0 border-outline-variant ${i > 0 ? "md:border-l" : ""}`}
                >
                  <span className="label-mono text-outline">0{i + 1}</span>
                  <h3 className="mt-4 text-2xl md:text-[1.75rem] text-on-surface group-hover:text-primary transition-colors">{title}</h3>
                  <p className="mt-3 text-on-surface-variant leading-relaxed">{desc}</p>
                  <span className="mt-6 inline-flex text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">{arrow}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Map teaser ──────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="label-mono text-primary">03 — {t("exploreMap")}</p>
              <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.5rem)] text-on-surface">{t("mapTitle")}</h2>
              <p className="mt-5 max-w-[46ch] text-lg text-on-surface-variant leading-relaxed">{t("mapDesc")}</p>
              <Link
                href="/map"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-on-primary pl-6 pr-5 py-3.5 font-semibold hover:bg-accent-hover transition-colors"
              >
                {t("exploreMap")}
                {arrow}
              </Link>
            </div>
            <Link
              href="/map"
              aria-label={t("exploreMap")}
              className="group relative block aspect-[4/3] rounded-2xl overflow-hidden bg-[#1f1611] editorial-shadow"
            >
              {/* Dotted "world" field — no external image, renders instantly */}
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage: "radial-gradient(rgba(245,239,230,0.22) 1.2px, transparent 1.3px)",
                  backgroundSize: "14px 14px",
                  maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 40%, transparent 75%)",
                }}
              />
              {[
                ["22%", "34%"], ["47%", "28%"], ["52%", "41%"], ["58%", "36%"], ["71%", "55%"], ["30%", "62%"], ["83%", "30%"],
              ].map(([left, top], i) => (
                <span
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left, top }}
                >
                  <span className="block w-3 h-3 rounded-full bg-[#e0662f] ring-4 ring-[#e0662f]/20 group-hover:ring-8 transition-all duration-500" style={{ transitionDelay: `${i * 40}ms` }} />
                </span>
              ))}
              <div className="absolute left-5 bottom-5 right-5 flex items-end justify-between text-[#f5efe6]">
                <span className="label-mono text-[#f5efe6]/60">{roasterCount} · {cafeCount} · {countryCount}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5efe6] text-[#1f1611] px-4 py-2 text-sm font-semibold">
                  {t("exploreMap")}
                  {arrow}
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Newsletter ──────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="relative rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 py-14 md:px-16 md:py-16 text-center overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(90deg,var(--color-primary)_0_18px,transparent_18px_26px)] opacity-70" aria-hidden />
            <p className="label-mono text-primary">04</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] text-on-surface">{t("newsletterTitle")}</h2>
            <p className="mt-4 mx-auto max-w-[52ch] text-on-surface-variant">{t("newsletterDesc")}</p>
            <div className="mt-8 mx-auto max-w-xl">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
