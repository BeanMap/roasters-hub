import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { db } from "@/lib/db";
import { CafeDashboardClient } from "./client";

export const dynamic = "force-dynamic";

export default async function CafeDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await db.userProfile.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      marketingConsent: true,
      createdAt: true,
      ownedCafes: {
        include: {
          roasters: {
            include: {
              roaster: { select: { id: true, name: true, slug: true, city: true } },
            },
          },
          _count: { select: { events: true } },
        },
      },
    },
  });

  if (!profile?.ownedCafes.length) redirect("/dashboard/saved-roasters");

  const cafe = profile.ownedCafes[0];

  let galleryImages: { id: string; url: string; isPrimary: boolean; status: string }[] = [];
  try {
    const imgs = await db.image.findMany({
      where: { cafeId: cafe.id, status: { not: "REJECTED" } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, url: true, isPrimary: true, status: true },
    });
    galleryImages = imgs;
  } catch {
    // gallery not available
  }

  const eventCounts = await db.cafeEvent.groupBy({
    by: ["type"],
    where: { cafeId: cafe.id },
    _count: true,
  });

  const stats = {
    pageViews: eventCounts.find((e) => e.type === "PAGE_VIEW")?._count ?? 0,
    websiteClicks: eventCounts.find((e) => e.type === "WEBSITE_CLICK")?._count ?? 0,
    contactClicks: eventCounts.find((e) => e.type === "CONTACT_CLICK")?._count ?? 0,
  };

  return (
    <>
      <Header />
      <CafeDashboardClient
        cafe={{
          id: cafe.id,
          name: cafe.name,
          slug: cafe.slug,
          city: cafe.city,
          country: cafe.country,
          status: cafe.status,
          description: cafe.description ?? "",
          address: cafe.address ?? "",
          lat: cafe.lat,
          lng: cafe.lng,
          website: cafe.website ?? "",
          email: cafe.email ?? "",
          instagram: cafe.instagram ?? "",
          phone: cafe.phone ?? "",
          coverImageUrl: cafe.coverImageUrl ?? null,
        }}
        galleryImages={galleryImages.map((img) => ({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary,
          status: img.status as "PENDING" | "APPROVED" | "REJECTED",
        }))}
        marketingConsent={profile.marketingConsent}
        linkedRoasters={cafe.roasters.map(({ roaster }) => ({
          id: roaster.id,
          name: roaster.name,
          slug: roaster.slug,
          city: roaster.city,
        }))}
        stats={stats}
      />
      <Footer />
    </>
  );
}
