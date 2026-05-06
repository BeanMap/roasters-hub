-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
