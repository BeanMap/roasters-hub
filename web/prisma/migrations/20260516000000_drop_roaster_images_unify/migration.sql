-- DropForeignKey
ALTER TABLE "roaster_images" DROP CONSTRAINT IF EXISTS "roaster_images_roasterId_fkey";

-- AlterTable
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "alt" TEXT;

-- DropTable
DROP TABLE IF EXISTS "roaster_images";
