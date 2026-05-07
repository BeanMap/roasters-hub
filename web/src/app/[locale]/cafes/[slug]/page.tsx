import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ReviewForm } from "@/components/shared/ReviewForm";
import { ReviewList } from "@/components/shared/ReviewList";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { AddPhotoButton } from "@/components/shared/AddPhotoButton";
import { AmenityIcon } from "@/components/cafes/AmenityIcon";
import { VerifiedBadge } from "@/components/roasters/VerifiedBadge";
import { CafeProfileTracker } from "@/components/cafes/CafeProfileTracker";
import { CafeTrackedLink } from "@/components/cafes/CafeTrackedLink";
import { SaveCafeButton } from "@/components/cafes/SaveCafeButton";
import { isCafeSaved } from "@/actions/saved-cafe.actions";
import { db } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const cafe = await db.cafe.findUnique({
    where: { slug },
    select: { name: true, city: true, country: true },
  });
  if (!cafe) {
    const t = await getTranslations({ locale, namespace: "profiles" });
    return { title: t("cafeNotFound") };
  }
  const t = await getTranslations({ locale, namespace: "profiles" });
  return {
    title: t("cafeMetaTitle", { name: cafe.name, city: cafe.city, country: cafe.country }),
    description: t("cafeMetaDescription", { name: cafe.name, city: cafe.city, country: cafe.country }),
  };
}

export async function generateStaticParams() {
  try {
    const cafes = await db.cafe.findMany({
      where: { status: "VERIFIED" },
      select: { slug: true },
    });
    return cafes.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export default async function CafeProfilePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "profiles" });

  let cafe;
  try {
    cafe = await db.cafe.findUnique({
      where: { slug },
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
        coverImageUrl: true,
        openingHours: true,
        serving: true,
          services: true,
          sourceUrl: true,
          status: true,
          featured: true,
          createdAt: true,
          updatedAt: true,
          roasters: {
            include: {
              roaster: {
                select: { id: true, name: true, slug: true, city: true, country: true },
              },
            },
          },
        },
    });
  } catch {
    notFound();
  }

  if (!cafe || cafe.status !== "VERIFIED") {
    const slugRedirect = await db.slugRedirect.findUnique({ where: { fromSlug: slug } });
    if (slugRedirect?.entityType === "cafe") redirect(`/cafes/${slugRedirect.toSlug}`);
    notFound();
  }

  let galleryImages: { id: string; url: string; isPrimary: boolean }[] = [];
  try {
    galleryImages = await db.image.findMany({
      where: { cafeId: cafe.id, status: "APPROVED" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, url: true, isPrimary: true },
    });
  } catch {
    // gallery not available — graceful fallback
  }

  let approvedReviews: { id: string; authorName: string; rating: number; comment: string | null; createdAt: Date }[] = [];
  try {
    const rows = await db.review.findMany({
      where: { cafeId: cafe.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, authorName: true, rating: true, comment: true, createdAt: true },
    });
    approvedReviews = rows;
  } catch {
    // reviews migration may not be applied yet
  }

  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : null;

  const serializedReviews = approvedReviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }));

  const saved = await isCafeSaved(cafe.id);
  const isVerified = cafe.status === "VERIFIED";

  return (
    <>
      <Header />
      <CafeProfileTracker cafeId={cafe.id} />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <nav className="flex text-xs uppercase tracking-widest text-on-surface-variant/60 gap-2">
          <Link className="hover:text-primary transition-colors" href="/">{t("home")}</Link>
          <span>›</span>
          <Link className="hover:text-primary transition-colors" href="/cafes">{t("cafes")}</Link>
          <span>›</span>
          <Link
            className="hover:text-primary transition-colors"
            href={`/cafes/country/${cafe.countryCode}`}
          >
            {cafe.country}
          </Link>
          <span>›</span>
          <Link
            className="hover:text-primary transition-colors"
            href={`/cafes/country/${cafe.countryCode}/city/${cafe.city.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {cafe.city}
          </Link>
          <span>›</span>
          <span className="text-on-surface">{cafe.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <header className="w-full h-[300px] md:h-[400px] mt-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-stone-900">
          {cafe.coverImageUrl && (
            <Image
              src={cafe.coverImageUrl}
              alt={cafe.name}
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
          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl text-white tracking-tighter leading-none mb-4">
            {cafe.name}
          </h1>
          <div className="flex items-center text-white/90 gap-2 text-sm md:text-base">
            <svg className="w-5 h-5 text-primary-fixed-dim" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {cafe.city}, {cafe.country}
            {avgRating !== null && (
              <span className="ml-2 text-primary font-semibold">
                ★ {avgRating.toFixed(1)} ({approvedReviews.length} {approvedReviews.length === 1 ? t("reviewCount", { count: 1 }) : t("reviewCount", { count: approvedReviews.length })})</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16">
        {/* Left Column */}
        <div className="space-y-16">
          {/* About */}
          {cafe.description && (
            <section>
              <h2 className="font-headline text-3xl mb-8 tracking-tight">{t("about", { name: cafe.name })}</h2>
              <p className="text-lg leading-relaxed text-on-surface-variant font-light">
                {cafe.description}
              </p>
            </section>
          )}

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <section>
              <h2 className="font-headline text-3xl mb-8 tracking-tight">Photos</h2>
              <ImageGallery images={galleryImages} />
            </section>
          )}

          <div className="mb-8">
            <AddPhotoButton entityType="CAFE" entityId={cafe.id} />
          </div>

          {/* What they serve + Amenities */}
          {(cafe.serving.length > 0 || cafe.services.length > 0) && (
            <section className="grid gap-6 sm:grid-cols-2">
              {cafe.serving.length > 0 && (
                <div>
                  <h3 className="font-headline text-xl mb-3">{t("whatTheyServe")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cafe.serving.map((item) => (
                      <span key={item} className="bg-surface-container text-sm px-3 py-1 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {cafe.services.length > 0 && (
                <div>
                  <h3 className="font-headline text-xl mb-3">{t("amenities")}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {cafe.services.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-on-surface-variant/80">
                        <AmenityIcon service={item} className="w-5 h-5 text-on-surface-variant/60 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Opening hours */}
          {cafe.openingHours && (
            <section>
              <h3 className="font-headline text-xl mb-3">{t("openingHours")}</h3>
              <div className="text-sm text-on-surface-variant/80 space-y-1">
                {(typeof cafe.openingHours === "string" ? cafe.openingHours : JSON.stringify(cafe.openingHours))
                  .split("\n")
                  .map((line: string, i: number) => {
                    const [day, hours] = line.split("\t");
                    return (
                      <div key={i} className="flex gap-4">
                        <span className="w-28 font-medium">{day}</span>
                        <span>{hours}</span>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <h3 className="font-headline text-3xl mb-8 tracking-tight">{t("reviews")}</h3>
            <ReviewList reviews={serializedReviews} averageRating={avgRating} />
            <div className="mt-10 pt-8 border-t border-outline-variant/10">
              <h4 className="text-lg font-medium mb-4">{t("leaveReview")}</h4>
              <ReviewForm cafeId={cafe.id} />
            </div>
          </section>

          {/* Roasters we serve */}
          <section>
            <h2 className="font-headline text-3xl tracking-tight mb-6">{t("roastersWeServe")}</h2>
            {cafe.roasters.length === 0 ? (
              <p className="text-on-surface-variant/60 text-sm">{t("noRoastersListed")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cafe.roasters.map(({ roaster }) => (
                  <Link
                    key={roaster.id}
                    href={`/roasters/${roaster.slug}`}
                    className="bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-colors"
                  >
                    <p className="font-medium">{roaster.name}</p>
                    <p className="text-sm text-on-surface-variant/60">
                      {roaster.city}, {roaster.country}
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
                  <h4 className="font-headline text-2xl font-bold tracking-tight">{cafe.name}</h4>
                  <p className="text-sm text-on-surface-variant/70">{t("specialtyCoffeeCafe")}</p>
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
                  <p className="text-sm text-on-surface-variant">{cafe.city}, {cafe.country}</p>
                </div>
                {cafe.address && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-on-surface-variant/40 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <p className="text-sm text-on-surface-variant">{cafe.address}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {cafe.website && (
                  <CafeTrackedLink
                    href={cafe.website}
                    cafeId={cafe.id}
                    eventType="WEBSITE_CLICK"
                    className="w-full bg-primary text-on-primary py-3.5 rounded-lg font-medium text-sm hover:bg-primary-container transition-all shadow-lg shadow-primary/10 block text-center"
                  >
                    {t("visitWebsite")}
                  </CafeTrackedLink>
                )}
                <SaveCafeButton cafeId={cafe.id} initialSaved={saved} />
              </div>

              {(cafe.instagram || cafe.phone) && (
                <div className="flex flex-wrap items-center gap-4 mt-8 pt-8 border-t border-surface-container">
                  {cafe.instagram && (
                    <CafeTrackedLink
                      href={`https://instagram.com/${cafe.instagram.replace("@", "")}`}
                      cafeId={cafe.id}
                      eventType="CONTACT_CLICK"
                      className="text-on-surface-variant/60 hover:text-primary transition-colors text-sm"
                    >
                      @{cafe.instagram.replace("@", "")}
                    </CafeTrackedLink>
                  )}
                  {cafe.phone && (
                    <CafeTrackedLink
                      href={`tel:${cafe.phone}`}
                      cafeId={cafe.id}
                      eventType="CONTACT_CLICK"
                      className="text-on-surface-variant/60 hover:text-primary transition-colors text-sm"
                    >
                      {cafe.phone}
                    </CafeTrackedLink>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </>
  );
}
