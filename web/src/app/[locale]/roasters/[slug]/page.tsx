import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { VerifiedBadge } from "@/components/roasters/VerifiedBadge";
import { CertificationBadge } from "@/components/roasters/CertificationBadge";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { ProfileTracker } from "@/components/roasters/ProfileTracker";
import { TrackedLink } from "@/components/roasters/TrackedLink";
import { ReviewSection } from "@/components/shared/ReviewSection";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { AddPhotoButton } from "@/components/shared/AddPhotoButton";
import { SaveRoasterButton } from "@/components/roasters/SaveRoasterButton";
import { LocalBusinessJsonLd, BreadcrumbJsonLd, ReviewJsonLd } from "@/components/shared/JsonLd";
import { buildAlternates, buildOgImage, buildOpenGraph, seoKeywords } from "@/lib/seo";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { CARD_IMAGE } from "@/lib/card-image";

export const revalidate = 3600;
export const dynamicParams = true;

// Prerender verified profiles; anything else is rendered on first visit and then cached (ISR).
export async function generateStaticParams() {
  try {
    const roasters = await db.roaster.findMany({
      where: { status: "VERIFIED" },
      select: { slug: true },
    });
    return roasters.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const roaster = await db.roaster.findUnique({ where: { slug } });
  if (!roaster) {
    const t = await getTranslations({ locale, namespace: "profiles" });
    return { title: t("roasterNotFound") };
  }

  const t = await getTranslations({ locale, namespace: "profiles" });
  const title = t("roasterMetaTitle", { name: roaster.name, city: roaster.city });
  const description = roaster.description || t("roasterMetaDescription", { name: roaster.name, city: roaster.city, country: roaster.country });

  const primaryImageUrl = (
    await db.roaster.findUnique({
      where: { slug },
      select: { coverImageUrl: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    })
  )?.images[0]?.url || null;

  const ogImageUrl = primaryImageUrl || roaster.coverImageUrl;

  const ogImages = ogImageUrl
    ? [buildOgImage(ogImageUrl, `${roaster.name} roastery`)]
    : undefined;

  return {
    title,
    description,
    keywords: seoKeywords("roasters"),
    alternates: buildAlternates(locale, `/roasters/${slug}`),
    openGraph: buildOpenGraph(title, description, ogImages, "profile"),
    twitter: {
      card: "summary_large_image" as const,
      site: "@beanmap",
      title,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
  };
}

function countryFlag(code: string): string {
  if (code.length !== 2) return "";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export default async function RoasterProfilePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "profiles" });

  const roaster = await db.roaster.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      servedAt: {
        include: {
          cafe: {
            select: { id: true, name: true, slug: true, city: true, country: true },
          },
        },
        where: {
          cafe: { status: "VERIFIED" },
        },
      },
    },
  });
  if (!roaster) {
    const slugRedirect = await db.slugRedirect.findUnique({ where: { fromSlug: slug } });
    if (slugRedirect?.entityType === "roaster") redirect(`/roasters/${slugRedirect.toSlug}`);
    notFound();
  }

  let galleryImages: { id: string; url: string; isPrimary: boolean }[] = [];
  try {
    galleryImages = await db.image.findMany({
      where: { roasterId: roaster.id, status: "APPROVED" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, url: true, isPrimary: true },
    });
  } catch {
    // gallery not available — graceful fallback
  }

  let approvedReviews: { id: string; authorName: string; rating: number; comment: string | null; createdAt: Date }[] = [];
  try {
    approvedReviews = await db.review.findMany({
      where: { roasterId: roaster.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch {
    // reviews table may not exist yet (migration pending)
  }

  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
        approvedReviews.length
      : null;


  const relatedRoasters = await db.roaster.findMany({
    where: {
      countryCode: roaster.countryCode,
      id: { not: roaster.id },
      status: "VERIFIED",
    },
    include: { images: CARD_IMAGE },
    take: 3,
  });

  const flag = countryFlag(roaster.countryCode);
  const primaryImage = roaster.images[0];
  const imageUrl = primaryImage?.url || roaster.coverImageUrl;
  const isVerified = roaster.status === "VERIFIED";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://beanmap.pl";
  const profileUrl = `${baseUrl}/roasters/${slug}`;
  const sameAs = [roaster.website, roaster.instagram].filter(Boolean) as string[];

  return (
    <>
      <LocalBusinessJsonLd
        name={roaster.name}
        url={profileUrl}
        description={roaster.description}
        address={roaster.address}
        city={roaster.city}
        country={roaster.country}
        image={primaryImage?.url}
        telephone={roaster.phone}
        email={roaster.email}
        sameAs={sameAs}
        type="Store"
      />
      <BreadcrumbJsonLd
        items={[
          { name: t("home"), url: baseUrl },
          { name: t("roasters"), url: `${baseUrl}/roasters` },
          { name: roaster.name, url: profileUrl },
        ]}
      />
      {approvedReviews.slice(0, 5).map((review) => (
        <ReviewJsonLd
          key={review.id}
          itemReviewed={roaster.name}
          url={profileUrl}
          author={review.authorName}
          rating={review.rating}
          reviewBody={review.comment}
          datePublished={review.createdAt.toISOString()}
        />
      ))}
      <Header />
      <ProfileTracker roasterId={roaster.id} />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <nav className="flex flex-wrap label-mono text-outline gap-2">
          <Link className="hover:text-primary transition-colors" href="/">{t("home")}</Link>
          <span>›</span>
          <Link className="hover:text-primary transition-colors" href="/roasters">{t("roasters")}</Link>
          <span>›</span>
          <Link className="hover:text-primary transition-colors" href={`/roasters/country/${roaster.countryCode}`}>
            {roaster.country}
          </Link>
          <span>›</span>
          <span className="text-on-surface">{roaster.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 mt-6">
      <header className="w-full h-[420px] md:h-[560px] relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[#2a1f19]">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={primaryImage?.alt || `${roaster.name} roastery`}
              fill
              className="object-cover opacity-80"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1611]/90 via-[#1f1611]/30 to-transparent" />
        <div className="h-full px-6 md:px-10 relative flex flex-col justify-end pb-8 md:pb-12">
          {isVerified && (
            <div className="absolute top-6 right-6">
              <VerifiedBadge size="md" />
            </div>
          )}
          <h1 className="text-[clamp(2.75rem,8vw,6.5rem)] text-[#fbf8f3] leading-[0.9] tracking-[-0.05em] mb-5">
            {roaster.name}
          </h1>
          <div className="flex items-center text-[#f5efe6]/85 gap-2 label-mono text-[0.75rem]">
            <svg className="w-5 h-5 text-primary-fixed-dim" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {flag} {roaster.city} — {roaster.country}
          </div>
        </div>
      </header>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16">
        {/* Left Column */}
        <div className="space-y-16">
          {/* About */}
          <section>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] mb-6">{t("about", { name: roaster.name })}</h2>
            <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant max-w-[62ch]">
              {roaster.description}
            </p>
          </section>

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <section>
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] mb-6">{t("photos")}</h2>
              <ImageGallery images={galleryImages} />
            </section>
          )}

          <div className="mb-8">
            <AddPhotoButton entityType="ROASTER" entityId={roaster.id} />
          </div>

          {/* Location Map Link */}
          {roaster.lat && roaster.lng && (
            <section>
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] mb-6">{t("location")}</h2>
              <a
                href={`/map?lat=${roaster.lat}&lng=${roaster.lng}&zoom=14&name=${encodeURIComponent(roaster.name)}`}
                className="block bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 hover:border-primary/30 transition-colors group"
              >
                <div className="aspect-[16/6] bg-surface-container-high relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://tile.openstreetmap.org/12/${Math.floor((roaster.lng + 180) / 360 * (1 << 12))}/${Math.floor((1 - Math.log(Math.tan(roaster.lat * Math.PI / 180) + 1 / Math.cos(roaster.lat * Math.PI / 180)) / Math.PI) / 2 * (1 << 12))}.png')] opacity-30 bg-cover bg-center" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                    </div>
                    <span className="text-on-surface-variant text-sm group-hover:text-primary transition-colors">
                      {t("viewOnMap")}
                    </span>
                  </div>
                </div>
              </a>
            </section>
          )}

          {/* Origins */}
          {roaster.origins.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-6">
                {t("coffeeOrigins")}
              </h3>
              <div className="flex flex-wrap gap-3">
                {roaster.origins.map((origin) => (
                  <span key={origin} className="bg-surface-container-high px-4 py-2 rounded-full text-sm font-medium">
                    {origin}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {roaster.certifications.length > 0 && (
            <section className="bg-surface-container-low p-8 rounded-2xl">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-8">
                {t("qualityCertifications")}
              </h3>
              <div className="flex flex-wrap gap-4">
                {roaster.certifications.map((cert) => (
                  <CertificationBadge key={cert} certification={cert} className="text-sm px-4 py-2" />
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <ReviewSection reviews={approvedReviews} averageRating={avgRating} roasterId={roaster.id} />

          {/* Where to drink */}
          <section className="mt-16">
            <h2 className="font-headline text-3xl tracking-tight mb-6">{t("whereToDrink")}</h2>
            {roaster.servedAt.length === 0 ? (
              <p className="text-on-surface-variant/60 text-sm">
                {t("notInAnyCafe")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roaster.servedAt.map(({ cafe }) => (
                  <Link
                    key={cafe.id}
                    href={`/cafes/${cafe.slug}`}
                    className="bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-colors"
                  >
                    <p className="font-medium">{cafe.name}</p>
                    <p className="text-sm text-on-surface-variant/60">
                      {cafe.city}, {cafe.country}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column — Sticky Sidebar */}
        <aside className="relative">
          <div className="sticky top-24 space-y-8">
            <div className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-headline text-2xl font-bold tracking-tight">{roaster.name}</h4>
                  <p className="text-sm text-on-surface-variant/70">{t("specialtyRoastery")}</p>
                </div>
                {isVerified && (
                  <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-on-surface-variant/40 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  </svg>
                  <p className="text-sm text-on-surface-variant">{roaster.city}, {roaster.country}</p>
                </div>
                {roaster.email && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-on-surface-variant/40 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    <p className="text-sm text-on-surface-variant">{roaster.email}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {roaster.website && (
                  <TrackedLink
                    href={roaster.website}
                    roasterId={roaster.id}
                    eventType="WEBSITE_CLICK"
                    className="w-full bg-primary text-on-primary py-3.5 rounded-lg font-medium text-sm hover:bg-primary-container transition-all shadow-lg shadow-primary/10 block text-center"
                  >
                    {t("visitWebsite")}
                  </TrackedLink>
                )}
                {roaster.shopUrl && (
                  <TrackedLink
                    href={roaster.shopUrl}
                    roasterId={roaster.id}
                    eventType="SHOP_CLICK"
                    className="w-full border border-outline text-on-surface-variant py-3.5 rounded-lg font-medium text-sm hover:bg-surface-container-low transition-all block text-center"
                  >
                    {t("shopOnline")}
                  </TrackedLink>
                )}
                <SaveRoasterButton roasterId={roaster.id} />
              </div>

              {roaster.instagram && (
                <div className="flex items-center justify-between mt-8 pt-8 border-t border-surface-container">
                  <TrackedLink
                    href={`https://instagram.com/${roaster.instagram}`}
                    roasterId={roaster.id}
                    eventType="CONTACT_CLICK"
                    className="text-on-surface-variant/60 hover:text-primary transition-colors text-sm"
                  >
                    @{roaster.instagram}
                  </TrackedLink>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Related Roasters */}
      {relatedRoasters.length > 0 && (
        <section className="bg-surface-container-low py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h3 className="font-headline text-4xl tracking-tight mb-2">
                  {t("discoverCountry", { country: roaster.country })}
                </h3>
                <p className="text-on-surface-variant/60 font-light">
                  {t("moreRoastersInCountry", { country: roaster.country })}
                </p>
              </div>
              <Link
                className="text-xs uppercase tracking-widest font-bold text-primary pb-1 border-b-2 border-primary/20 hover:border-primary transition-all"
                href={`/roasters/country/${roaster.countryCode}`}
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedRoasters.map((r) => (
                <RoasterCard key={r.id} roaster={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
