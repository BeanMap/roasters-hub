/**
 * Seed user profiles — admin + owner z przypisaną własnością.
 *
 * Admin: marek.nadra@gmail.com (ADMIN)
 * Owner: kwadratpoz@gmail.com (ROASTER)
 *
 * Usage: npx tsx --env-file=.env.local prisma/seed_user_profiles.ts
 */
import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

const ADMIN_EMAIL = "marek.nadra@gmail.com";
const OWNER_EMAIL = "kwadratpoz@gmail.com";

// Palarnie przypisane do ownera
const OWNER_ROASTER_SLUGS = [
  "hard-beans-opole",
  "hayb-coffee",
  "coffee-proficiency",
];

// Kawiarnie przypisane do ownera
const OWNER_CAFE_SLUGS = [
  "smash-cafe-roastery-poznan",
  "kawa-roastery-berlin",
  "kawa-roastery-x-berg-berlin",
];

// Palarnie przypisane do admina (do zarządzania)
const ADMIN_ROASTER_SLUGS = [
  "the-barn-berlin",
  "onyx-coffee-lab",
  "java-coffee-roasters",
];

// Kawiarnie przypisane do admina (do zarządzania)
const ADMIN_CAFE_SLUGS = [
  "man-versus-machine-munich",
  "java-cafe-speciality-roasters-warsaw",
  "kawa-roastery-x-berg-berlin",
];

async function main() {
  console.log("Seeding user profiles...\n");

  // Znajdź roastery i kawiarnie
  const [roasters, cafes] = await Promise.all([
    prisma.roaster.findMany({
      where: { slug: { in: [...OWNER_ROASTER_SLUGS, ...ADMIN_ROASTER_SLUGS] } },
      select: { id: true, slug: true },
    }),
    prisma.cafe.findMany({
      where: { slug: { in: [...OWNER_CAFE_SLUGS, ...ADMIN_CAFE_SLUGS] } },
      select: { id: true, slug: true },
    }),
  ]);

  const roasterMap = new Map(roasters.map((r) => [r.slug, r.id]));
  const cafeMap = new Map(cafes.map((c) => [c.slug, c.id]));

  // Zbuduj listy ID
  const ownerRoasterIds = OWNER_ROASTER_SLUGS
    .map((s) => roasterMap.get(s))
    .filter(Boolean) as string[];
  const ownerCafeIds = OWNER_CAFE_SLUGS
    .map((s) => cafeMap.get(s))
    .filter(Boolean) as string[];
  const adminRoasterIds = ADMIN_ROASTER_SLUGS
    .map((s) => roasterMap.get(s))
    .filter(Boolean) as string[];
  const adminCafeIds = ADMIN_CAFE_SLUGS
    .map((s) => cafeMap.get(s))
    .filter(Boolean) as string[];

  // Utwórz lub zaktualizuj profile
  const [adminProfile, ownerProfile] = await Promise.all([
    prisma.userProfile.upsert({
      where: { email: ADMIN_EMAIL },
      update: { role: "ADMIN" },
      create: {
        id: `admin-${Date.now()}`,
        email: ADMIN_EMAIL,
        role: "ADMIN",
      },
    }),
    prisma.userProfile.upsert({
      where: { email: OWNER_EMAIL },
      update: { role: "ROASTER" },
      create: {
        id: `owner-${Date.now()}`,
        email: OWNER_EMAIL,
        role: "ROASTER",
      },
    }),
  ]);

  console.log(`  ✓ Admin: ${adminProfile.email}`);
  console.log(`  ✓ Owner: ${ownerProfile.email}`);

  // Przypisz własność — roastery
  const roasterUpdates = [
    ...adminRoasterIds.map((id) =>
      prisma.roaster.update({
        where: { id },
        data: { ownerId: adminProfile.id },
      }),
    ),
    ...ownerRoasterIds.map((id) =>
      prisma.roaster.update({
        where: { id },
        data: { ownerId: ownerProfile.id },
      }),
    ),
  ];

  // Przypisz własność — kawiarnie
  const cafeUpdates = [
    ...adminCafeIds.map((id) =>
      prisma.cafe.update({
        where: { id },
        data: { ownerId: adminProfile.id },
      }),
    ),
    ...ownerCafeIds.map((id) =>
      prisma.cafe.update({
        where: { id },
        data: { ownerId: ownerProfile.id },
      }),
    ),
  ];

  await Promise.all([...roasterUpdates, ...cafeUpdates]);

  console.log(`\n  Owner owns ${ownerRoasterIds.length} roasters: ${OWNER_ROASTER_SLUGS.join(", ")}`);
  console.log(`  Owner owns ${ownerCafeIds.length} cafes: ${OWNER_CAFE_SLUGS.join(", ")}`);
  console.log(`  Admin manages ${adminRoasterIds.length} roasters: ${ADMIN_ROASTER_SLUGS.join(", ")}`);
  console.log(`  Admin manages ${adminCafeIds.length} cafes: ${ADMIN_CAFE_SLUGS.join(", ")}`);

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
