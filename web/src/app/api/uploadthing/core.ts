import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  roasterImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      const profile = await db.userProfile.findUnique({
        where: { id: userId },
        select: { ownedRoasters: { select: { id: true } } },
      });
      if (!profile?.ownedRoasters.length) throw new Error("No roaster linked");

      return { roasterId: profile.ownedRoasters[0].id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.roasterImage.deleteMany({
        where: { roasterId: metadata.roasterId, isPrimary: true },
      });

      await db.roasterImage.create({
        data: {
          roasterId: metadata.roasterId,
          url: file.ufsUrl,
          alt: file.name,
          order: 0,
          isPrimary: true,
        },
      });

      return { url: file.ufsUrl };
    }),

  cafeImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");

      const cafeId = req.headers.get("x-cafe-id");
      if (!cafeId) throw new UploadThingError("Missing cafeId");

      const profile = await db.userProfile.findUnique({
        where: { id: userId },
        select: { ownedCafes: { select: { id: true } } },
      });
      const owns = profile?.ownedCafes.some((c) => c.id === cafeId);
      if (!owns) {
        throw new UploadThingError("Forbidden");
      }

      return { userId, cafeId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.cafe.update({
        where: { id: metadata.cafeId },
        data: { logoUrl: file.ufsUrl },
      });
      revalidatePath("/cafes");
    }),

  adminImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      let adminId: string;
      try {
        adminId = await requireAdmin();
      } catch {
        throw new UploadThingError("Admin access required");
      }
      return { userId: adminId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  defaultImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      let adminId: string;
      try {
        adminId = await requireAdmin();
      } catch {
        throw new UploadThingError("Admin access required");
      }
      const entityType = req.headers.get("x-entity-type") as
        | "CAFE"
        | "ROASTER"
        | null;
      if (!entityType) throw new UploadThingError("Missing entity type");
      return { userId: adminId, entityType };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.image.create({
        data: {
          url: file.ufsUrl,
          entityType: metadata.entityType,
          uploadedById: metadata.userId,
          status: "APPROVED",
          isDefault: true,
        },
      });
      revalidatePath("/admin/images");
      return { url: file.ufsUrl };
    }),

  userImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");

      const entityType = req.headers.get("x-entity-type") as
        | "CAFE"
        | "ROASTER"
        | null;
      const entityId = req.headers.get("x-entity-id");

      if (!entityType) throw new UploadThingError("Missing entity type");
      if (!entityId) throw new UploadThingError("Missing entity id");

      return { userId, entityType, entityId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db.image.create({
          data: {
            url: file.ufsUrl,
            entityType: metadata.entityType,
            roasterId:
              metadata.entityType === "ROASTER" ? metadata.entityId : null,
            cafeId: metadata.entityType === "CAFE" ? metadata.entityId : null,
            uploadedById: metadata.userId,
            status: "PENDING",
            isDefault: false,
          },
        });
        if (metadata.entityType === "ROASTER") revalidatePath("/roasters");
        if (metadata.entityType === "CAFE") revalidatePath("/cafes");
      } catch (error) {
        console.error("[userImage onUploadComplete]", error);
        throw new UploadThingError("Failed to save photo. Please try again.");
      }
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
