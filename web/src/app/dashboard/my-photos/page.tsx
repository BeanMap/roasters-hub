import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MyPhotosClient } from "./client";

export const dynamic = "force-dynamic";

export default async function MyPhotosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let photos: {
    id: string;
    url: string;
    entityType: "CAFE" | "ROASTER";
    entityName: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
  }[] = [];

  try {
    const images = await db.image.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        entityType: true,
        status: true,
        createdAt: true,
        roasterId: true,
        cafeId: true,
      },
    });

    const roasterIds = images.filter((i) => i.roasterId).map((i) => i.roasterId!);
    const cafeIds = images.filter((i) => i.cafeId).map((i) => i.cafeId!);

    const [roasters, cafes] = await Promise.all([
      roasterIds.length > 0
        ? db.roaster.findMany({ where: { id: { in: roasterIds } }, select: { id: true, name: true } })
        : [],
      cafeIds.length > 0
        ? db.cafe.findMany({ where: { id: { in: cafeIds } }, select: { id: true, name: true } })
        : [],
    ]);

    const roasterMap = new Map(roasters.map((r) => [r.id, r.name]));
    const cafeMap = new Map(cafes.map((c) => [c.id, c.name]));

    photos = images.map((img) => ({
      id: img.id,
      url: img.url,
      entityType: img.entityType as "CAFE" | "ROASTER",
      entityName: img.roasterId
        ? (roasterMap.get(img.roasterId) ?? null)
        : img.cafeId
          ? (cafeMap.get(img.cafeId) ?? null)
          : null,
      status: img.status as "PENDING" | "APPROVED" | "REJECTED",
      createdAt: img.createdAt.toISOString(),
    }));
  } catch {}

  return <MyPhotosClient photos={photos} />;
}
