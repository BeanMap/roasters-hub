import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { AdminRoasterDetailClient } from "./client";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminRoasterDetailPage({ params }: { params: Params }) {

  const { id } = await params;

  const roaster = await db.roaster.findUnique({
    where: { id },
    include: {
      owner: { select: { email: true } },
    },
  });

  if (!roaster) notFound();

  const proposals = await db.enrichmentProposal.findMany({
    where: { entityId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      changeType: true,
      fieldKey: true,
      currentValue: true,
      proposedValue: true,
      confidence: true,
      status: true,
      createdAt: true,
    },
  });

  const serialized = {
    id: roaster.id,
    name: roaster.name,
    slug: roaster.slug,
    city: roaster.city,
    country: roaster.country,
    countryCode: roaster.countryCode,
    status: roaster.status as string,
    description: roaster.description,
    foundedYear: roaster.foundedYear,
    address: roaster.address,
    postalCode: roaster.postalCode,
    lat: roaster.lat,
    lng: roaster.lng,
    website: roaster.website,
    shopUrl: roaster.shopUrl,
    instagram: roaster.instagram,
    facebook: roaster.facebook,
    phone: roaster.phone,
    email: roaster.email,
    certifications: roaster.certifications,
    origins: roaster.origins,
    roastStyles: roaster.roastStyles,
    brewingMethods: roaster.brewingMethods,
    openingHours: roaster.openingHours,
    wholesaleAvailable: roaster.wholesaleAvailable,
    subscriptionAvailable: roaster.subscriptionAvailable,
    hasCafe: roaster.hasCafe,
    hasTastingRoom: roaster.hasTastingRoom,
    coverImageUrl: roaster.coverImageUrl,
    sourceUrl: roaster.sourceUrl,
    featured: roaster.featured,
    featuredUntil: roaster.featuredUntil?.toISOString() ?? null,
    ownerId: roaster.ownerId,
    rejectedReason: roaster.rejectedReason,
    createdAt: roaster.createdAt.toISOString(),
    updatedAt: roaster.updatedAt.toISOString(),
    owner: roaster.owner ? { email: roaster.owner.email } : null,
    proposals: proposals.map((p) => ({
      changeType: p.changeType,
      fieldKey: p.fieldKey,
      currentValue: p.currentValue as string | null,
      proposedValue: p.proposedValue as string,
      confidence: p.confidence,
      status: p.status as string,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-8">
          <Link href="/admin" className="hover:text-on-surface">Admin</Link>
          <span>›</span>
          <Link href="/admin/roasters" className="hover:text-on-surface">Roasters</Link>
          <span>›</span>
          <span className="text-on-surface font-medium">{roaster.name}</span>
        </nav>
        <AdminRoasterDetailClient roaster={serialized} />
      </main>
      <Footer />
    </>
  );
}
