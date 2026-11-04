/**
 * Seed saved roasters — ~20 zapisanych palarni przez użytkowników.
 * Każdy user zapisuje 3-5 palarni.
 *
 * Usage: npx tsx --env-file=.env.local prisma/seed_saved_roasters.ts
 */
import { PrismaClient } from "@prisma/client";
import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

const ADMIN_EMAIL = "marek.nadra@gmail.com";
const OWNER_EMAIL = "kwadratpoz@gmail.com";

// Jakie palarnie zapisuje admin
const ADMIN_SAVED = [
  "the-barn-berlin",
  "onyx-coffee-lab",
  "tim-wendelboe",
  "la-cabra",
  "coffee-collective",
];

// Jakie palarnie zapisuje owner
const OWNER_SAVED = [
  "hard-beans-opole",
  "hayb-coffee",
  "java-coffee-roasters",
  "coffee-proficiency",
  "origin-coffee",
];

async function main() {
  console.log("Seeding saved roasters...\n");

  const [adminProfile, ownerProfile] = await Promise.all([
    prisma.userProfile.findUnique({ where: { email: ADMIN_EMAIL } }),
    prisma.userProfile.findUnique({ where: { email: OWNER_EMAIL } }),
  ]);

  if (!adminProfile) {
    console.log("  ✗ Admin profile not found. Run seed_user_profiles.ts first.");
    return;
  }
  if (!ownerProfile) {
    console.log("  ✗ Owner profile not found. Run seed_user_profiles.ts first.");
    return;
  }

  const allSlugs = [...ADMIN_SAVED, ...OWNER_SAVED];
  const roasters = await prisma.roaster.findMany({
    where: { slug: { in: allSlugs } },
    select: { id: true, slug: true },
  });

  const roasterMap = new Map(roasters.map((r) => [r.slug, r.id]));

  const savedData = [
    ...ADMIN_SAVED.map((slug) => ({
      userId: adminProfile.id,
      roasterId: roasterMap.get(slug)!,
    })).filter((s) => s.roasterId),
    ...OWNER_SAVED.map((slug) => ({
      userId: ownerProfile.id,
      roasterId: roasterMap.get(slug)!,
    })).filter((s) => s.roasterId),
  ];

  const result = await prisma.savedRoaster.createMany({
    data: savedData,
    skipDuplicates: true,
  });

  console.log(`  ✓ Created ${result.count} saved roasters`);
  console.log(`    ${ADMIN_EMAIL}: ${ADMIN_SAVED.length} saved`);
  console.log(`    ${OWNER_EMAIL}: ${OWNER_SAVED.length} saved`);

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
