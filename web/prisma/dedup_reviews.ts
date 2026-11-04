/**
 * Deduplicate reviews — remove duplicate reviews caused by running seed_reviews.ts multiple times.
 * Keeps the oldest review for each (roasterId/cafeId + authorName + comment + rating) combo.
 *
 * Usage: npx tsx --env-file=.env.local prisma/dedup_reviews.ts
 */
import { PrismaClient } from "@prisma/client";
import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

async function main() {
  console.log("Deduplicating reviews...\n");

  const allReviews = await prisma.review.findMany({
    orderBy: { createdAt: "asc" },
  });

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const review of allReviews) {
    const key = `${review.roasterId ?? "null"}-${review.cafeId ?? "null"}-${review.authorName}-${review.rating}-${review.comment ?? "null"}`;
    const existing = seen.get(key);
    if (existing) {
      toDelete.push(review.id);
    } else {
      seen.set(key, review.id);
    }
  }

  if (toDelete.length === 0) {
    console.log("  No duplicates found.");
    return;
  }

  console.log(`  Found ${toDelete.length} duplicate reviews to delete.\n`);

  // Delete in batches
  const batchSize = 50;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const result = await prisma.review.deleteMany({
      where: { id: { in: batch } },
    });
    deleted += result.count;
  }

  console.log(`  ✓ Deleted ${deleted} duplicate reviews.`);
  console.log(`  Remaining: ${allReviews.length - deleted} reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
