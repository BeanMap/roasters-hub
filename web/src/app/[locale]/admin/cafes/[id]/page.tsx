import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { AdminCafeDetailClient } from "./client";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminCafeDetailPage({ params }: { params: Params }) {

  const { id } = await params;

  const cafe = await db.cafe.findUnique({
    where: { id },
    include: {
      owner: { select: { email: true } },
    },
  });

  if (!cafe) notFound();

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
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    city: cafe.city,
    country: cafe.country,
    countryCode: cafe.countryCode,
    status: cafe.status as string,
    description: cafe.description,
    address: cafe.address,
    postalCode: cafe.postalCode,
    lat: cafe.lat,
    lng: cafe.lng,
    website: cafe.website,
    email: cafe.email,
    instagram: cafe.instagram,
    phone: cafe.phone,
    priceRange: cafe.priceRange,
    seatingCapacity: cafe.seatingCapacity,
    serving: cafe.serving,
    services: cafe.services,
    coverImageUrl: cafe.coverImageUrl,
    logoUrl: cafe.logoUrl,
    sourceUrl: cafe.sourceUrl,
    openingHours: cafe.openingHours,
    featured: cafe.featured,
    ownerId: cafe.ownerId,
    rejectedReason: cafe.rejectedReason,
    createdAt: cafe.createdAt.toISOString(),
    updatedAt: cafe.updatedAt.toISOString(),
    owner: cafe.owner ? { email: cafe.owner.email } : null,
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
          <Link href="/admin/cafes" className="hover:text-on-surface">Cafes</Link>
          <span>›</span>
          <span className="text-on-surface font-medium">{cafe.name}</span>
        </nav>
        <AdminCafeDetailClient cafe={serialized} />
      </main>
      <Footer />
    </>
  );
}
