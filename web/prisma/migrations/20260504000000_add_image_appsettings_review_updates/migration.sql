-- Migration: add_image_appsettings_review_updates
-- Adds Image + AppSettings models, Review.userId + updatedAt columns

-- CreateEnum EntityType (idempotent)
DO $$ BEGIN
  CREATE TYPE "EntityType" AS ENUM ('CAFE', 'ROASTER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum ImageStatus (idempotent)
DO $$ BEGIN
  CREATE TYPE "ImageStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- AlterTable reviews: add updatedAt + userId
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- CreateTable images
CREATE TABLE IF NOT EXISTS "images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "roasterId" TEXT,
    "cafeId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "status" "ImageStatus" NOT NULL DEFAULT 'PENDING',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable app_settings
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "imageMaxTotal" INTEGER NOT NULL DEFAULT 10,
    "imageMaxPerUser" INTEGER NOT NULL DEFAULT 1,
    "imageMaxPerOwner" INTEGER NOT NULL DEFAULT 3,
    "defaultPoolMax" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- Indexes for images
CREATE INDEX IF NOT EXISTS "images_entityType_roasterId_idx" ON "images"("entityType", "roasterId");
CREATE INDEX IF NOT EXISTS "images_entityType_cafeId_idx" ON "images"("entityType", "cafeId");
CREATE INDEX IF NOT EXISTS "images_uploadedById_idx" ON "images"("uploadedById");
CREATE INDEX IF NOT EXISTS "images_status_idx" ON "images"("status");

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_userId_roasterId_key" ON "reviews"("userId", "roasterId");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_userId_cafeId_key" ON "reviews"("userId", "cafeId");

-- Foreign keys for images (idempotent)
DO $$ BEGIN
  ALTER TABLE "images" ADD CONSTRAINT "images_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "images" ADD CONSTRAINT "images_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "images" ADD CONSTRAINT "images_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Foreign key for reviews
DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
