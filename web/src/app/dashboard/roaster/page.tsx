import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { DashboardClient } from "./client";

export const revalidate = 3600;

export default async function RoasterDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await db.userProfile.findUnique({
    where: { id: userId },
    select: { marketingConsent: true, ownedRoasters: { select: { id: true } } },
  });

  if (!profile?.ownedRoasters.length) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="font-headline text-4xl tracking-tight mb-4">
            No Roaster Linked
          </h1>
          <p className="text-on-surface-variant/70 text-lg mb-8">
            Your account is not linked to a roaster profile yet.
            If you registered a roaster, please contact an admin to link your account.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const roaster = await db.roaster.findUnique({
    where: { id: profile.ownedRoasters[0].id },
    include: {
      images: { orderBy: { order: "asc" } },
      _count: { select: { events: true } },
    },
  });

  if (!roaster) redirect("/");

  let galleryImages: { id: string; url: string; isPrimary: boolean; status: "PENDING" | "APPROVED" | "REJECTED" }[] = [];
  try {
    const imgs = await db.image.findMany({
      where: { roasterId: roaster.id, status: { not: "REJECTED" } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, url: true, isPrimary: true, status: true },
    });
    galleryImages = imgs;
  } catch {
    // gallery not available
  }

  const eventCounts = await db.profileEvent.groupBy({
    by: ["type"],
    where: { roasterId: roaster.id },
    _count: true,
  });

  const stats = {
    pageViews: eventCounts.find((e) => e.type === "PAGE_VIEW")?._count ?? 0,
    websiteClicks: eventCounts.find((e) => e.type === "WEBSITE_CLICK")?._count ?? 0,
    shopClicks: eventCounts.find((e) => e.type === "SHOP_CLICK")?._count ?? 0,
    contactClicks: eventCounts.find((e) => e.type === "CONTACT_CLICK")?._count ?? 0,
  };

  const serialized = {
    id: roaster.id,
    name: roaster.name,
    slug: roaster.slug,
    description: roaster.description ?? "",
    city: roaster.city,
    country: roaster.country,
    status: roaster.status,
    address: roaster.address ?? "",
    lat: roaster.lat,
    lng: roaster.lng,
    website: roaster.website ?? "",
    email: roaster.email ?? "",
    instagram: roaster.instagram ?? "",
    shopUrl: roaster.shopUrl ?? "",
    certifications: roaster.certifications,
    origins: roaster.origins,
    roastStyles: roaster.roastStyles,
    imageUrl: roaster.images[0]?.url ?? null,
    imageId: roaster.images[0]?.id ?? null,
    galleryImages: galleryImages.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      status: img.status as "PENDING" | "APPROVED" | "REJECTED",
    })),
  };

  return (
    <>
      <Header />
      <DashboardClient roaster={serialized} stats={stats} marketingConsent={profile.marketingConsent} />
      <Footer />
    </>
  );
}
