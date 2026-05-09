import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { VerifiedBadge } from "@/components/roasters/VerifiedBadge";
import { CertificationBadge } from "@/components/roasters/CertificationBadge";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { ProfileTracker } from "@/components/roasters/ProfileTracker";
import { TrackedLink } from "@/components/roasters/TrackedLink";
import { ReviewForm } from "@/components/shared/ReviewForm";
import { ReviewList } from "@/components/shared/ReviewList";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { AddPhotoButton } from "@/components/shared/AddPhotoButton";
import { SaveRoasterButton } from "@/components/roasters/SaveRoasterButton";
import { isRoasterSaved } from "@/actions/saved-roaster.actions";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const roaster = await db.roaster.findUnique({ where: { slug } });
  if (!roaster) {
    const t = await getTranslations({ locale, namespace: "profiles" });
    return { title: t("roasterNotFound") };
  }

  const t = await getTranslations({ locale, namespace: "profiles" });
  return {
    title: t("roasterMetaTitle", { name: roaster.name, city: roaster.city }),
    description: roaster.description || t("roasterMetaDescription", { name: roaster.name, city: roaster.city, country: roaster.country }),
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
  const t = await getTranslations({ locale, namespace: "profiles" });

  const roaster = await db.roaster.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
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

  const saved = await isRoasterSaved(roaster.id);

  const relatedRoasters = await db.roaster.findMany({
    where: {
      countryCode: roaster.countryCode,
      id: { not: roaster.id },
      status: "VERIFIED",
    },
    include: { images: { where: { isPrimary: true }, take: 1 } },
    take: 3,
  });

  const flag = countryFlag(roaster.countryCode);
  const primaryImage = roaster.images[0];
  const isVerified = roaster.status === "VERIFIED";

  return (
    <>
      <Header />
      <ProfileTracker roasterId={roaster.id} />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <nav className="flex text-xs uppercase tracking-widest text-on-surface-variant/60 gap-2">
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
      <header className="w-full h-[400px] md:h-[500px] mt-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-stone-900">
          {primaryImage && (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || `${roaster.name} roastery`}
              fill
              className="object-cover opacity-70"
              sizes="100vw"
              priority
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="max-w-7xl mx-auto h-full px-6 relative flex flex-col justify-end pb-12">
          {isVerified && (
            <div className="absolute top-8 right-6">
              <VerifiedBadge size="lg" />
            </div>
          )}
          <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl text-white tracking-tighter leading-none mb-4">
            {roaster.name}
          </h1>
          <div className="flex items-center text-white/90 gap-2 text-sm md:text-base">
            <svg className="w-5 h-5 text-primary-fixed-dim" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {flag} {roaster.city}, {roaster.country}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16">
        {/* Left Column */}
        <div className="space-y-16">
          {/* About */}
          <section>
            <h2 className="font-headline text-3xl mb-8 tracking-tight">{t("about", { name: roaster.name })}</h2>
            <p className="text-lg leading-relaxed text-on-surface-variant font-light">
              {roaster.description}
            </p>
          </section>

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <section>
              <h2 className="font-headline text-3xl mb-8 tracking-tight">Photos</h2>
              <ImageGallery images={galleryImages} />
            </section>
          )}

          <div className="mb-8">
            <AddPhotoButton entityType="ROASTER" entityId={roaster.id} />
          </div>

          {/* Location Map Link */}
          {roaster.lat && roaster.lng && (
            <section>
              <h2 className="font-headline text-3xl mb-8 tracking-tight">{t("location")}</h2>
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
          <section>
            <h3 className="font-headline text-3xl mb-8 tracking-tight">{t("reviews")}</h3>
            <ReviewList reviews={approvedReviews} averageRating={avgRating} />
            <div className="mt-10 pt-8 border-t border-outline-variant/10">
              <h4 className="text-lg font-medium mb-4">{t("leaveReview")}</h4>
              <ReviewForm roasterId={roaster.id} />
            </div>
          </section>

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
                <SaveRoasterButton roasterId={roaster.id} initialSaved={saved} />
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
