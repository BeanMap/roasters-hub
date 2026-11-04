/**
 * Seed profile events — ~50 eventów symulujących aktywność użytkowników.
 * PAGE_VIEW, CONTACT_CLICK, SHOP_CLICK, WEBSITE_CLICK.
 *
 * Usage: npx tsx --env-file=.env.local prisma/seed_profile_events.ts
 */
import { PrismaClient, EventType } from "@prisma/client";
import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

const EVENTS = [
  // Popular roasters — high page views
  { roaster: "the-barn-berlin", type: "PAGE_VIEW" as const, count: 8 },
  { roaster: "the-barn-berlin", type: "WEBSITE_CLICK" as const, count: 2 },
  { roaster: "the-barn-berlin", type: "SHOP_CLICK" as const, count: 3 },
  { roaster: "onyx-coffee-lab", type: "PAGE_VIEW" as const, count: 5 },
  { roaster: "onyx-coffee-lab", type: "SHOP_CLICK" as const, count: 2 },
  { roaster: "tim-wendelboe", type: "PAGE_VIEW" as const, count: 4 },
  { roaster: "tim-wendelboe", type: "CONTACT_CLICK" as const, count: 1 },
  { roaster: "square-mile-coffee", type: "PAGE_VIEW" as const, count: 3 },
  { roaster: "square-mile-coffee", type: "WEBSITE_CLICK" as const, count: 1 },
  { roaster: "hard-beans-opole", type: "PAGE_VIEW" as const, count: 4 },
  { roaster: "hard-beans-opole", type: "CONTACT_CLICK" as const, count: 1 },
  { roaster: "hayb-coffee", type: "PAGE_VIEW" as const, count: 3 },
  { roaster: "hayb-coffee", type: "SHOP_CLICK" as const, count: 1 },
  { roaster: "java-coffee-roasters", type: "PAGE_VIEW" as const, count: 3 },
  { roaster: "java-coffee-roasters", type: "CONTACT_CLICK" as const, count: 1 },
  { roaster: "la-cabra", type: "PAGE_VIEW" as const, count: 2 },
  { roaster: "la-cabra", type: "WEBSITE_CLICK" as const, count: 1 },
  { roaster: "coffee-collective", type: "PAGE_VIEW" as const, count: 2 },
  { roaster: "coffee-collective", type: "SHOP_CLICK" as const, count: 1 },
  { roaster: "five-elephant", type: "PAGE_VIEW" as const, count: 2 },
  { roaster: "five-elephant", type: "CONTACT_CLICK" as const, count: 1 },
  { roaster: "bonanza-coffee", type: "PAGE_VIEW" as const, count: 2 },
  { roaster: "intelligentsia-coffee", type: "PAGE_VIEW" as const, count: 2 },
  { roaster: "intelligentsia-coffee", type: "SHOP_CLICK" as const, count: 1 },
  { roaster: "stumptown-coffee", type: "PAGE_VIEW" as const, count: 2 },
  { roaster: "tobys-estate", type: "PAGE_VIEW" as const, count: 2 },
  { roaster: "tobys-estate", type: "WEBSITE_CLICK" as const, count: 1 },
  { roaster: "gardelli-specialty", type: "PAGE_VIEW" as const, count: 1 },
  { roaster: "origin-coffee", type: "PAGE_VIEW" as const, count: 1 },
  { roaster: "origin-coffee", type: "SHOP_CLICK" as const, count: 1 },
  { roaster: "coffee-proficiency", type: "PAGE_VIEW" as const, count: 1 },
  { roaster: "milo-coffee-roasters", type: "PAGE_VIEW" as const, count: 1 },
  { roaster: "dark-matter-labs", type: "PAGE_VIEW" as const, count: 1 },
  { roaster: "19grams-coffee", type: "PAGE_VIEW" as const, count: 1 },
  { roaster: "kurasu-kyoto", type: "PAGE_VIEW" as const, count: 1 },
  { roaster: "fuglen-coffee", type: "PAGE_VIEW" as const, count: 1 },
];

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  console.log("Seeding profile events...\n");

  const roasterSlugs = [...new Set(EVENTS.map((e) => e.roaster))];
  const roasters = await prisma.roaster.findMany({
    where: { slug: { in: roasterSlugs } },
    select: { id: true, slug: true },
  });

  const roasterMap = new Map(roasters.map((r) => [r.slug, r.id]));

  const events: { roasterId: string; type: EventType; ipHash: string; userAgent: string; createdAt: Date }[] = [];

  for (const entry of EVENTS) {
    const roasterId = roasterMap.get(entry.roaster);
    if (!roasterId) {
      console.log(`  ✗ Skip: ${entry.roaster} (not found)`);
      continue;
    }

    for (let i = 0; i < entry.count; i++) {
      events.push({
        roasterId,
        type: entry.type,
        ipHash: `hash_${Math.random().toString(36).substring(2, 10)}`,
        userAgent: "Mozilla/5.0 (seed)",
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      });
    }
  }

  const result = await prisma.profileEvent.createMany({
    data: events,
  });

  console.log(`  ✓ Created ${result.count} events`);

  const byType = new Map<string, number>();
  for (const e of events) {
    byType.set(e.type, (byType.get(e.type) || 0) + 1);
  }

  for (const [type, count] of byType) {
    console.log(`    ${type}: ${count}`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
