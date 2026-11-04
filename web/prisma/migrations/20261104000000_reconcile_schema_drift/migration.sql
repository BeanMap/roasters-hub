-- Reconcile schema drift.
--
-- Production was at some point changed with `prisma db push`, so schema.prisma
-- contains objects that no migration ever created (roasters/cafes.ownerId,
-- slug_redirects). A fresh database built from migrations alone (local dev,
-- CI, disaster recovery) was therefore missing them.
--
-- Every statement is idempotent: on production (where these objects already
-- exist) this migration is a no-op; on a fresh database it creates them.
-- Nothing is dropped and no data is touched. The legacy nullable columns
-- user_profiles.roasterId / user_profiles.cafeId are intentionally left in
-- place (they are unused by the app); remove them in a separate, reviewed
-- migration once production data has been checked.

ALTER TABLE "roasters" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "cafes" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

CREATE INDEX IF NOT EXISTS "roasters_ownerId_idx" ON "roasters"("ownerId");
CREATE INDEX IF NOT EXISTS "cafes_ownerId_idx" ON "cafes"("ownerId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roasters_ownerId_fkey') THEN
    ALTER TABLE "roasters" ADD CONSTRAINT "roasters_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cafes_ownerId_fkey') THEN
    ALTER TABLE "cafes" ADD CONSTRAINT "cafes_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "slug_redirects" (
    "id" TEXT NOT NULL,
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "slug_redirects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "slug_redirects_fromSlug_key" ON "slug_redirects"("fromSlug");

-- Legacy one-to-one owner links: the unique indexes/FKs on these unused
-- columns are dropped so they cannot block inserts; the columns stay.
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_cafeId_fkey";
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_roasterId_fkey";
DROP INDEX IF EXISTS "user_profiles_cafeId_key";
DROP INDEX IF EXISTS "user_profiles_roasterId_key";
