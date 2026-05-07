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

    photos = await Promise.all(
      images.map(async (img) => {
        let entityName: string | null = null;
        if (img.roasterId) {
          const r = await db.roaster.findUnique({
            where: { id: img.roasterId },
            select: { name: true },
          });
          entityName = r?.name ?? null;
        } else if (img.cafeId) {
          const c = await db.cafe.findUnique({
            where: { id: img.cafeId },
            select: { name: true },
          });
          entityName = c?.name ?? null;
        }
        return {
          id: img.id,
          url: img.url,
          entityType: img.entityType as "CAFE" | "ROASTER",
          entityName,
          status: img.status as "PENDING" | "APPROVED" | "REJECTED",
          createdAt: img.createdAt.toISOString(),
        };
      }),
    );
  } catch {
    // Image table may not exist yet
  }

  return <MyPhotosClient photos={photos} />;
}
