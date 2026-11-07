/**
 * verify-production.ts
 *
 * Runs after production deploy to verify data integrity.
 * Fails the CI job if critical tables are empty.
 *
 * Usage: npx tsx prisma/verify-production.ts
 */

import { createScriptClient } from "./script-client";
import { PRODUCTION_DB_ENDPOINT, endpointId } from "../scripts/production-db.mjs";

// In the production workflow: refuse to "verify" any database other than the
// pinned production endpoint (GitHub and Vercel once pointed at different ones).
if (process.env.EXPECT_PRODUCTION_ENDPOINT) {
  const actual = endpointId(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
  if (actual !== PRODUCTION_DB_ENDPOINT) {
    console.error(`❌ Connected to ${actual ?? "a non-Neon database"}, production is ${PRODUCTION_DB_ENDPOINT}.`);
    process.exit(1);
  }
  console.log(`🔗 Database endpoint ${actual} = production (web/scripts/production-db.mjs)\n`);
}

const db = createScriptClient();

const MIN_COUNTS: Record<string, number> = {
  roasters: 50,
  cafes: 90,
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

  // Cover images by host (read-only diagnostics; a card falls back to a
  // placeholder when its image cannot be loaded or its host is not allowed).
  for (const [label, rows] of [
    ["roasters", await db.roaster.findMany({ where: { status: "VERIFIED" }, select: { coverImageUrl: true } })],
    ["cafes", await db.cafe.findMany({ where: { status: "VERIFIED" }, select: { coverImageUrl: true } })],
  ] as const) {
    const hosts = new Map<string, number>();
    const sample = new Map<string, string>();
    for (const { coverImageUrl } of rows) {
      let host = "(empty)";
      if (coverImageUrl?.trim()) {
        try {
          host = new URL(coverImageUrl).hostname;
        } catch {
          host = `(invalid: ${coverImageUrl.slice(0, 40)})`;
        }
      }
      hosts.set(host, (hosts.get(host) ?? 0) + 1);
      if (coverImageUrl && !sample.has(host)) sample.set(host, coverImageUrl.slice(0, 120));
    }
    console.log(`\n🖼️  ${label} cover images by host:`);
    for (const [host, n] of [...hosts].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${host}\t${sample.get(host) ?? ""}`);
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
