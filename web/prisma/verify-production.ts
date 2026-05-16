/**
 * verify-production.ts
 *
 * Runs after production deploy to verify data integrity.
 * Fails the CI job if critical tables are empty.
 *
 * Usage: npx tsx prisma/verify-production.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

const MIN_COUNTS: Record<string, number> = {
  roasters: 50,
  cafes: 90,
  reviews: 40,
  userProfiles: 1,
  images: 50,
  cafeRoasterRelations: 100,
};

async function main() {
  console.log("🔍 Verifying production data integrity...\n");

  const counts = {
    roasters: await db.roaster.count(),
    cafes: await db.cafe.count(),
    reviews: await db.review.count(),
    savedRoasters: await db.savedRoaster.count(),
    profileEvents: await db.profileEvent.count(),
    cafeEvents: await db.cafeEvent.count(),
    savedCafes: await db.savedCafe.count(),
    userProfiles: await db.userProfile.count(),
    images: await db.image.count(),
    cafeRoasterRelations: await db.cafeRoasterRelation.count(),
    adminNotes: await db.adminNote.count(),
  };

  console.log("📊 Production data counts:");
  for (const [table, count] of Object.entries(counts)) {
    const min = MIN_COUNTS[table];
    const status = min !== undefined
      ? count >= min
        ? "✅"
        : "❌"
      : "ℹ️";
    const minLabel = min !== undefined ? ` (min: ${min})` : "";
    console.log(`  ${status} ${table}: ${count}${minLabel}`);
  }

  const failures: string[] = [];
  for (const [table, min] of Object.entries(MIN_COUNTS)) {
    const actual = counts[table as keyof typeof counts];
    if (actual < min) {
      failures.push(`${table}: expected >= ${min}, got ${actual}`);
    }
  }

  if (failures.length > 0) {
    console.error("\n❌ Data integrity check FAILED:");
    failures.forEach((f) => console.error(`  - ${f}`));
    console.error("\nThis usually means the seed scripts did not run correctly.");
    console.error("Check the production-deploy workflow logs.");
    await db.$disconnect();
    process.exit(1);
  }

  console.log("\n✅ Production data integrity verified.");
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error("❌ Verification failed:", error);
  await db.$disconnect();
  process.exit(1);
});
