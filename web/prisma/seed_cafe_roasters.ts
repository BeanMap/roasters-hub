import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

const CAFE_ROASTER_RELATIONS = [
  { cafeSlug: "the-barn-cafe-glockenbachviertel-munich", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "the-barn-cafe-tal-munich", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "the-barn-ku-damm-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "the-barn-neuk-lln-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "the-barn-nordbahnhof-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "the-barn-sony-center-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "19grams-tres-cabezas-caf-berlin", roasterSlug: "19grams-coffee" },
  { cafeSlug: "bonanza-coffee-berlin", roasterSlug: "bonanza-coffee" },
  { cafeSlug: "five-elephant-berlin", roasterSlug: "five-elephant" },
  { cafeSlug: "java-cafe-speciality-roasters-warsaw", roasterSlug: "java-coffee-roasters" },
  { cafeSlug: "story-coffee-warsaw", roasterSlug: "story-coffee-roasters" },
  { cafeSlug: "coffeedesk-kawiarnia-warsaw", roasterSlug: "coffeelab-warszawa" },
  { cafeSlug: "green-wall-coffee-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "milchhalle-berlin-coffee-berlin", roasterSlug: "bonanza-coffee" },
  { cafeSlug: "man-versus-machine-munich", roasterSlug: "man-versus-machine-munich" },
  { cafeSlug: "sltm-coffee-berlin", roasterSlug: "five-elephant" },
  { cafeSlug: "milchhalle-berlin-coffee-berlin", roasterSlug: "five-elephant" },
  { cafeSlug: "spontan-coffee-roastery-berlin", roasterSlug: "spontan-coffee-roastery-berlin" },
  { cafeSlug: "kawa-roastery-berlin", roasterSlug: "kawa-roastery-berlin" },
  { cafeSlug: "kawa-roastery-x-berg-berlin", roasterSlug: "kawa-roastery-berlin" },
  { cafeSlug: "gar-on-de-caf-coffee-shop-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "visioneers-caf-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "nothing-out-of-the-ordinary-berlin", roasterSlug: "the-barn-berlin" },
  { cafeSlug: "elswaldt-coffee-roasters-hamburg", roasterSlug: "elswaldt-coffee-roasters-hamburg" },
];

async function main() {
  console.log("Seeding cafe-roaster relations...");

  // Collect unique slugs
  const cafeSlugs = [...new Set(CAFE_ROASTER_RELATIONS.map((r) => r.cafeSlug))];
  const roasterSlugs = [...new Set(CAFE_ROASTER_RELATIONS.map((r) => r.roasterSlug))];

  // Single batch fetch for all cafes and roasters
  const [cafes, roasters] = await Promise.all([
    prisma.cafe.findMany({
      where: { slug: { in: cafeSlugs } },
      select: { id: true, slug: true },
    }),
    prisma.roaster.findMany({
      where: { slug: { in: roasterSlugs } },
      select: { id: true, slug: true },
    }),
  ]);

  // Build lookup maps
  const cafeMap = new Map(cafes.map((c) => [c.slug, c.id]));
  const roasterMap = new Map(roasters.map((r) => [r.slug, r.id]));

  // Build relations array
  const relations: { cafeId: string; roasterId: string }[] = [];
  let skipped = 0;

  for (const rel of CAFE_ROASTER_RELATIONS) {
    const cafeId = cafeMap.get(rel.cafeSlug);
    const roasterId = roasterMap.get(rel.roasterSlug);

    if (!cafeId || !roasterId) {
      console.log(`Skipping: ${rel.cafeSlug} → ${rel.roasterSlug} (not found)`);
      skipped++;
      continue;
    }

    relations.push({ cafeId, roasterId });
  }

  // Single batch insert
  const result = await prisma.cafeRoasterRelation.createMany({
    data: relations,
    skipDuplicates: true,
  });

  console.log(`Created ${result.count} relations${skipped > 0 ? ` (skipped ${skipped})` : ""}`);
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
