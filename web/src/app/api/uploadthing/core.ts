import { z } from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateEntity } from "@/lib/revalidation";

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

      return { roasterId: profile.ownedRoasters[0].id, userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.image.deleteMany({
        where: { roasterId: metadata.roasterId, entityType: "ROASTER", isPrimary: true },
      });

      await db.image.create({
        data: {
          roasterId: metadata.roasterId,
          url: file.ufsUrl,
          entityType: "ROASTER",
          uploadedById: metadata.userId,
          status: "APPROVED",
          isPrimary: true,
        },
      });

      await revalidateEntity("ROASTER", metadata.roasterId);

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
      await revalidateEntity("CAFE", metadata.cafeId);
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
    .input(z.object({
      entityType: z.enum(["CAFE", "ROASTER"]),
      entityId: z.string().min(1),
    }))
    .middleware(async ({ input }) => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");

      return { userId, entityType: input.entityType, entityId: input.entityId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const [settings, total, userTotal] = await Promise.all([
          db.appSettings.findUnique({ where: { id: "singleton" } }),
          db.image.count({
            where: {
              entityType: metadata.entityType,
              ...(metadata.entityType === "ROASTER"
                ? { roasterId: metadata.entityId }
                : { cafeId: metadata.entityId }),
              status: { not: "REJECTED" },
            },
          }),
          db.image.count({
            where: {
              entityType: metadata.entityType,
              ...(metadata.entityType === "ROASTER"
                ? { roasterId: metadata.entityId }
                : { cafeId: metadata.entityId }),
              uploadedById: metadata.userId,
            },
          }),
        ]);

        const maxTotal = settings?.imageMaxTotal ?? 10;
        const maxPerUser = settings?.imageMaxPerUser ?? 1;

        if (total >= maxTotal) {
          throw new UploadThingError(`Image limit reached for this entity (${maxTotal})`);
        }
        if (userTotal >= maxPerUser) {
          throw new UploadThingError(`You've reached the upload limit per entity (${maxPerUser})`);
        }

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
        await revalidateEntity(metadata.entityType, metadata.entityId);
      } catch (error) {
        console.error("[userImage onUploadComplete]", error);
        throw new UploadThingError("Failed to save photo. Please try again.");
      }
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
