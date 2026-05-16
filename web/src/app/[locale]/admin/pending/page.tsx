import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminPendingClient } from "./client";

export const revalidate = 3600;

export default async function AdminPendingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  if (user?.publicMetadata?.role !== "ADMIN") redirect("/");

  const roasters = await db.roaster.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const serialized = roasters.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    city: r.city,
    country: r.country,
    countryCode: r.countryCode,
    status: r.status,
    featured: r.featured,
    description: r.description ?? "",
    certifications: r.certifications,
    origins: r.origins,
    website: r.website,
    email: r.email,
    instagram: r.instagram,
    createdAt: r.createdAt.toISOString(),
    imageUrl: r.images[0]?.url ?? null,
    imageAlt: r.images[0]?.alt ?? null,
  }));

  return <AdminPendingClient roasters={serialized} />;
}
