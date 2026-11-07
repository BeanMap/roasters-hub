/**
 * Fill MISSING cover images of the base directory entries from the seed data.
 *
 * Safe for production: only touches roasters/cafés whose `coverImageUrl` is
 * empty AND that have no uploaded images. Never overwrites a photo set by an
 * owner or admin, never changes any other field. Re-running is a no-op.
 *
 *   DATABASE_URL=... npx tsx prisma/backfill-cover-images.ts [--dry-run]
 */
import { createScriptClient } from "./script-client";
import { SEED_ROASTERS } from "./seed";
import { SEED_CAFES } from "./seed_cafes";

const prisma = createScriptClient();
const dryRun = process.argv.includes("--dry-run");

const isEmpty = (v: string | null) => !v || !v.trim();

async function main() {
  let roasters = 0;
  for (const { slug, imageUrl } of SEED_ROASTERS) {
    if (!imageUrl) continue;
    const row = await prisma.roaster.findUnique({
      where: { slug },
      select: { coverImageUrl: true, _count: { select: { images: true } } },
    });
    if (!row || !isEmpty(row.coverImageUrl) || row._count.images > 0) continue;
    if (!dryRun) await prisma.roaster.update({ where: { slug }, data: { coverImageUrl: imageUrl } });
    console.log(`  roaster ${slug}`);
    roasters++;
  }

  let cafes = 0;
  for (const { slug, coverImageUrl } of SEED_CAFES) {
    if (!coverImageUrl) continue;
    const row = await prisma.cafe.findUnique({
      where: { slug },
      select: { coverImageUrl: true, _count: { select: { galleryImages: true } } },
    });
    if (!row || !isEmpty(row.coverImageUrl) || row._count.galleryImages > 0) continue;
    if (!dryRun) await prisma.cafe.update({ where: { slug }, data: { coverImageUrl } });
    console.log(`  cafe ${slug}`);
    cafes++;
  }

  console.log(`\n${dryRun ? "[dry run] would fill" : "Filled"}: ${roasters} roasters, ${cafes} cafés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
