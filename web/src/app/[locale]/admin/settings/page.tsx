import { db } from "@/lib/db";
import { AdminSettingsClient } from "./client";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

interface DefaultImageData {
  id: string;
  url: string;
  entityType: "CAFE" | "ROASTER";
  status: string;
  isDefault: boolean;
  createdAt: string;
  uploadedBy: string;
}

export default async function AdminSettingsPage() {

  let settings = null;
  try {
    settings = await db.appSettings.findUnique({
      where: { id: "singleton" },
    });
  } catch {
    // AppSettings table may not exist yet
  }

  let defaultImages: DefaultImageData[] = [];
  try {
    const images = await db.image.findMany({
      where: { isDefault: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        entityType: true,
        status: true,
        isDefault: true,
        createdAt: true,
        uploadedBy: { select: { email: true } },
      },
    });
    defaultImages = images.map((img) => ({
      id: img.id,
      url: img.url,
      entityType: img.entityType as "CAFE" | "ROASTER",
      status: img.status,
      isDefault: img.isDefault,
      createdAt: img.createdAt.toISOString(),
      uploadedBy: img.uploadedBy.email,
    }));
  } catch {
    // Image table may not exist yet
  }

  return (
    <AdminSettingsClient
      initial={{
        imageMaxTotal: settings?.imageMaxTotal ?? 10,
        imageMaxPerUser: settings?.imageMaxPerUser ?? 1,
        imageMaxPerOwner: settings?.imageMaxPerOwner ?? 3,
        defaultPoolMax: settings?.defaultPoolMax ?? 20,
      }}
      defaultImages={defaultImages}
    />
  );
}
