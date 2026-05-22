import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

import { SEED_ROASTERS } from "./seed";

async function main() {
  console.log(`Loaded ${SEED_ROASTERS.length} seed entries`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const { slug, imageUrl } of SEED_ROASTERS) {
    if (!imageUrl) continue;

    const roaster = await prisma.roaster.findUnique({
      where: { slug },
      select: { id: true, coverImageUrl: true },
    });

    if (!roaster) {
      notFound++;
      continue;
    }

    if (roaster.coverImageUrl === imageUrl) {
      skipped++;
      continue;
    }

    await prisma.roaster.update({
      where: { slug },
      data: { coverImageUrl: imageUrl },
    });
    console.log(`  ✓ ${slug}: ${imageUrl.substring(0, 60)}...`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Not found: ${notFound}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
