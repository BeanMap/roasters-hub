/**
 * Seed explicit cafe-roaster relations — geographic + realistic matching.
 * Replaces the random seed_cafe_roasters_random.ts with fixed, deterministic data.
 *
 * Usage: npx tsx --env-file=.env.local prisma/seed_cafe_roasters_explicit.ts
 */
import { PrismaClient } from "@prisma/client";
import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

// Explicit cafe → roaster relations (geographic + brand matching)
const RELATIONS = [
  // ─── Munich cafes → Munich/German roasters ───
  { cafe: "man-versus-machine-munich", roaster: "the-barn-berlin" },
  { cafe: "man-versus-machine-munich", roaster: "bonanza-coffee" },
  { cafe: "man-versus-machine-munich", roaster: "five-elephant" },
  { cafe: "stray-coffee-roasters-munich", roaster: "the-barn-berlin" },
  { cafe: "stray-coffee-roasters-munich", roaster: "bonanza-coffee" },
  { cafe: "stray-coffee-roasters-munich", roaster: "19grams-coffee" },
  { cafe: "coffee-twins-munich", roaster: "five-elephant" },
  { cafe: "coffee-twins-munich", roaster: "19grams-coffee" },
  { cafe: "coffee-twins-munich", roaster: "larbre-a-cafe" },
  { cafe: "vits-munich", roaster: "the-barn-berlin" },
  { cafe: "vits-munich", roaster: "bonanza-coffee" },
  { cafe: "vits-munich", roaster: "gardelli-specialty" },
  { cafe: "suuapinga-munich", roaster: "five-elephant" },
  { cafe: "suuapinga-munich", roaster: "19grams-coffee" },
  { cafe: "caf-bl-munich", roaster: "the-barn-berlin" },
  { cafe: "caf-bl-munich", roaster: "larbre-a-cafe" },
  { cafe: "poppi-farmer-munich", roaster: "bonanza-coffee" },
  { cafe: "poppi-farmer-munich", roaster: "five-elephant" },
  { cafe: "cofx-4-munich", roaster: "the-barn-berlin" },
  { cafe: "cofx-4-munich", roaster: "19grams-coffee" },
  { cafe: "the-barn-cafe-glockenbachviertel-munich", roaster: "the-barn-berlin" },
  { cafe: "the-barn-cafe-tal-munich", roaster: "the-barn-berlin" },
  { cafe: "schneid-kaffee-r-sterei-munich", roaster: "bonanza-coffee" },
  { cafe: "schneid-kaffee-r-sterei-munich", roaster: "five-elephant" },
  { cafe: "barista-sistar-munich", roaster: "19grams-coffee" },
  { cafe: "barista-sistar-munich", roaster: "the-barn-berlin" },
  { cafe: "calima-specialty-coffee-munich", roaster: "five-elephant" },
  { cafe: "calima-specialty-coffee-munich", roaster: "bonanza-coffee" },
  { cafe: "nine-fine-roastery-bar-munich", roaster: "the-barn-berlin" },
  { cafe: "nine-fine-roastery-bar-munich", roaster: "bonanza-coffee" },
  { cafe: "nine-fine-roastery-bar-munich", roaster: "five-elephant" },
  { cafe: "3-mills-cycling-coffee-munich", roaster: "19grams-coffee" },
  { cafe: "3-mills-cycling-coffee-munich", roaster: "the-barn-berlin" },
  { cafe: "m-i-r-a-cafe-studio-munich", roaster: "five-elephant" },
  { cafe: "m-i-r-a-cafe-studio-munich", roaster: "bonanza-coffee" },
  { cafe: "turm-kaffee-barista-academy-munich", roaster: "the-barn-berlin" },
  { cafe: "turm-kaffee-barista-academy-munich", roaster: "19grams-coffee" },
  { cafe: "humpback-whale-specialty-coffee-munich", roaster: "bonanza-coffee" },
  { cafe: "humpback-whale-specialty-coffee-munich", roaster: "five-elephant" },
  { cafe: "suuapinga-caf-bakery-munich", roaster: "the-barn-berlin" },
  { cafe: "suuapinga-caf-bakery-munich", roaster: "19grams-coffee" },
  { cafe: "sorry-johnny-munich", roaster: "bonanza-coffee" },
  { cafe: "sorry-johnny-munich", roaster: "five-elephant" },
  { cafe: "peet-and-the-flat-white-munich", roaster: "the-barn-berlin" },
  { cafe: "peet-and-the-flat-white-munich", roaster: "19grams-coffee" },
  { cafe: "coffee-box-munich", roaster: "five-elephant" },
  { cafe: "coffee-box-munich", roaster: "bonanza-coffee" },
  { cafe: "standl-20-munich", roaster: "the-barn-berlin" },
  { cafe: "pacand-munich", roaster: "19grams-coffee" },
  { cafe: "pacand-munich", roaster: "five-elephant" },

  // ─── Warsaw cafes → Polish roasters ───
  { cafe: "java-cafe-speciality-roasters-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "java-cafe-speciality-roasters-warsaw", roaster: "hayb-coffee" },
  { cafe: "java-cafe-speciality-roasters-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "bozo-warsaw", roaster: "hayb-coffee" },
  { cafe: "bozo-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "bozo-warsaw", roaster: "milo-coffee-roasters" },
  { cafe: "rost-microroastery-caf-warsaw", roaster: "hayb-coffee" },
  { cafe: "rost-microroastery-caf-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "dot-coffeestation-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "dot-coffeestation-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "cafe-central-lwowska-warsaw", roaster: "hayb-coffee" },
  { cafe: "cafe-central-lwowska-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "cafe-central-hoza-warsaw", roaster: "hayb-coffee" },
  { cafe: "cafe-central-hoza-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "sando-cafe-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "sando-cafe-warsaw", roaster: "milo-coffee-roasters" },
  { cafe: "relax-cafe-bar-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "relax-cafe-bar-warsaw", roaster: "hayb-coffee" },
  { cafe: "aroma-speciality-coffee-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "aroma-speciality-coffee-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "coffeedesk-kawiarnia-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "coffeedesk-kawiarnia-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "relax-na-wilczej-warsaw", roaster: "hayb-coffee" },
  { cafe: "relax-na-wilczej-warsaw", roaster: "milo-coffee-roasters" },
  { cafe: "maruda-cafe-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "maruda-cafe-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "relaks-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "relaks-warsaw", roaster: "hayb-coffee" },
  { cafe: "kawogr-d-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "kawogr-d-warsaw", roaster: "milo-coffee-roasters" },
  { cafe: "story-coffee-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "story-coffee-warsaw", roaster: "hayb-coffee" },
  { cafe: "el-cafetero-kawiarnia-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "el-cafetero-kawiarnia-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "wazaap-warsaw", roaster: "hayb-coffee" },
  { cafe: "wazaap-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "culture-cafe-mokot-w-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "culture-cafe-mokot-w-warsaw", roaster: "milo-coffee-roasters" },
  { cafe: "kawiarnia-czytelnia-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "kawiarnia-czytelnia-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "plakat-wka-warsaw", roaster: "hayb-coffee" },
  { cafe: "plakat-wka-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "secret-life-warsaw", roaster: "milo-coffee-roasters" },
  { cafe: "secret-life-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "tekla-warsaw", roaster: "story-coffee-roasters" },
  { cafe: "tekla-warsaw", roaster: "hayb-coffee" },
  { cafe: "forum-warsaw", roaster: "java-coffee-roasters" },
  { cafe: "forum-warsaw", roaster: "coffeelab-warszawa" },
  { cafe: "cafe-central-solec-warsaw", roaster: "hayb-coffee" },
  { cafe: "cafe-central-solec-warsaw", roaster: "milo-coffee-roasters" },

  // ─── Berlin cafes → Berlin/German roasters ───
  { cafe: "the-barn-ku-damm-berlin", roaster: "the-barn-berlin" },
  { cafe: "the-barn-neuk-lln-berlin", roaster: "the-barn-berlin" },
  { cafe: "the-barn-nordbahnhof-berlin", roaster: "the-barn-berlin" },
  { cafe: "the-barn-sony-center-berlin", roaster: "the-barn-berlin" },
  { cafe: "bonanza-coffee-berlin", roaster: "bonanza-coffee" },
  { cafe: "milchhalle-berlin-coffee-berlin", roaster: "bonanza-coffee" },
  { cafe: "milchhalle-berlin-coffee-berlin", roaster: "five-elephant" },
  { cafe: "19grams-tres-cabezas-caf-berlin", roaster: "19grams-coffee" },
  { cafe: "kawa-roastery-berlin", roaster: "five-elephant" },
  { cafe: "kawa-roastery-berlin", roaster: "the-barn-berlin" },
  { cafe: "kawa-roastery-x-berg-berlin", roaster: "five-elephant" },
  { cafe: "kawa-roastery-x-berg-berlin", roaster: "19grams-coffee" },
  { cafe: "ingwer-berlin", roaster: "the-barn-berlin" },
  { cafe: "ingwer-berlin", roaster: "bonanza-coffee" },
  { cafe: "black-hat-coffee-specialty-espresso-bar-berlin-berlin", roaster: "19grams-coffee" },
  { cafe: "black-hat-coffee-specialty-espresso-bar-berlin-berlin", roaster: "five-elephant" },
  { cafe: "doppio-berlin", roaster: "the-barn-berlin" },
  { cafe: "doppio-berlin", roaster: "bonanza-coffee" },
  { cafe: "green-wall-coffee-berlin", roaster: "the-barn-berlin" },
  { cafe: "green-wall-coffee-berlin", roaster: "19grams-coffee" },
  { cafe: "paska-l-choux-p-berg-berlin", roaster: "bonanza-coffee" },
  { cafe: "paska-l-choux-p-berg-berlin", roaster: "five-elephant" },
  { cafe: "marv-berlin", roaster: "the-barn-berlin" },
  { cafe: "marv-berlin", roaster: "19grams-coffee" },
  { cafe: "symple-caf-berlin", roaster: "bonanza-coffee" },
  { cafe: "symple-caf-berlin", roaster: "five-elephant" },
  { cafe: "gar-on-de-caf-coffee-shop-berlin", roaster: "the-barn-berlin" },
  { cafe: "gar-on-de-caf-coffee-shop-berlin", roaster: "19grams-coffee" },
  { cafe: "brammibal-s-donuts-tiergarten-berlin", roaster: "five-elephant" },
  { cafe: "brammibal-s-donuts-tiergarten-berlin", roaster: "the-barn-berlin" },
  { cafe: "ludwig-cafe-specialty-coffee-and-brunch-berlin", roaster: "bonanza-coffee" },
  { cafe: "ludwig-cafe-specialty-coffee-and-brunch-berlin", roaster: "19grams-coffee" },
  { cafe: "spontan-coffee-roastery-berlin", roaster: "the-barn-berlin" },
  { cafe: "spontan-coffee-roastery-berlin", roaster: "bonanza-coffee" },
  { cafe: "nothing-out-of-the-ordinary-berlin", roaster: "five-elephant" },
  { cafe: "nothing-out-of-the-ordinary-berlin", roaster: "19grams-coffee" },
  { cafe: "kaffeekirsche-berlin", roaster: "the-barn-berlin" },
  { cafe: "kaffeekirsche-berlin", roaster: "bonanza-coffee" },
  { cafe: "warawul-coffee-berlin", roaster: "19grams-coffee" },
  { cafe: "warawul-coffee-berlin", roaster: "five-elephant" },
  { cafe: "zacharias-berlin", roaster: "the-barn-berlin" },
  { cafe: "zacharias-berlin", roaster: "bonanza-coffee" },
  { cafe: "visioneers-caf-berlin", roaster: "19grams-coffee" },
  { cafe: "visioneers-caf-berlin", roaster: "five-elephant" },

  // ─── Poznan cafes → Polish roasters ───
  { cafe: "smash-cafe-roastery-poznan", roaster: "java-coffee-roasters" },
  { cafe: "smash-cafe-roastery-poznan", roaster: "hayb-coffee" },
  { cafe: "smash-cafe-roastery-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "kaferdam-poznan", roaster: "java-coffee-roasters" },
  { cafe: "kaferdam-poznan", roaster: "story-coffee-roasters" },
  { cafe: "body-balance-specialty-coffee-people-poznan", roaster: "hayb-coffee" },
  { cafe: "body-balance-specialty-coffee-people-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "cafe-m-y-ska-poznan", roaster: "java-coffee-roasters" },
  { cafe: "cafe-m-y-ska-poznan", roaster: "milo-coffee-roasters" },
  { cafe: "oki-toki-poznan", roaster: "story-coffee-roasters" },
  { cafe: "oki-toki-poznan", roaster: "hayb-coffee" },
  { cafe: "oldskulowa-cafe-restaurant-poznan", roaster: "java-coffee-roasters" },
  { cafe: "oldskulowa-cafe-restaurant-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "kaferdam-zamek-poznan", roaster: "hayb-coffee" },
  { cafe: "kaferdam-zamek-poznan", roaster: "story-coffee-roasters" },
  { cafe: "sweet-surrender-poznan", roaster: "java-coffee-roasters" },
  { cafe: "sweet-surrender-poznan", roaster: "milo-coffee-roasters" },
  { cafe: "untitled-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "untitled-poznan", roaster: "hayb-coffee" },
  { cafe: "inna-piekarnia-poznan", roaster: "java-coffee-roasters" },
  { cafe: "inna-piekarnia-poznan", roaster: "story-coffee-roasters" },
  { cafe: "stragan-kawiarnia-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "stragan-kawiarnia-poznan", roaster: "milo-coffee-roasters" },
  { cafe: "m-wish-mash-poznan", roaster: "hayb-coffee" },
  { cafe: "m-wish-mash-poznan", roaster: "java-coffee-roasters" },
  { cafe: "d-ungla-cafe-poznan", roaster: "story-coffee-roasters" },
  { cafe: "d-ungla-cafe-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "taczaka-20-poznan", roaster: "java-coffee-roasters" },
  { cafe: "taczaka-20-poznan", roaster: "hayb-coffee" },
  { cafe: "tekstura-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "tekstura-poznan", roaster: "milo-coffee-roasters" },
  { cafe: "lastryko-cafe-poznan", roaster: "hayb-coffee" },
  { cafe: "lastryko-cafe-poznan", roaster: "story-coffee-roasters" },
  { cafe: "bardzo-poznan", roaster: "java-coffee-roasters" },
  { cafe: "bardzo-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "uno-poznan", roaster: "milo-coffee-roasters" },
  { cafe: "uno-poznan", roaster: "hayb-coffee" },
  { cafe: "de-nata-poznan", roaster: "story-coffee-roasters" },
  { cafe: "de-nata-poznan", roaster: "java-coffee-roasters" },
  { cafe: "trzecia-kawa-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "trzecia-kawa-poznan", roaster: "hayb-coffee" },
  { cafe: "piece-of-cake-poznan", roaster: "java-coffee-roasters" },
  { cafe: "piece-of-cake-poznan", roaster: "milo-coffee-roasters" },
  { cafe: "plan-poznan", roaster: "story-coffee-roasters" },
  { cafe: "plan-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "golden-ticket-poznan", roaster: "hayb-coffee" },
  { cafe: "golden-ticket-poznan", roaster: "java-coffee-roasters" },
  { cafe: "czarne-mleko-poznan", roaster: "coffeelab-warszawa" },
  { cafe: "czarne-mleko-poznan", roaster: "milo-coffee-roasters" },
  { cafe: "p-czu-i-kawusia-poznan", roaster: "story-coffee-roasters" },
  { cafe: "p-czu-i-kawusia-poznan", roaster: "hayb-coffee" },
];

async function main() {
  console.log("Seeding explicit cafe-roaster relations...\n");

  const cafeSlugs = [...new Set(RELATIONS.map((r) => r.cafe))];
  const roasterSlugs = [...new Set(RELATIONS.map((r) => r.roaster))];

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

  const cafeMap = new Map(cafes.map((c) => [c.slug, c.id]));
  const roasterMap = new Map(roasters.map((r) => [r.slug, r.id]));

  const relations: { cafeId: string; roasterId: string }[] = [];
  let skipped = 0;

  for (const rel of RELATIONS) {
    const cafeId = cafeMap.get(rel.cafe);
    const roasterId = roasterMap.get(rel.roaster);

    if (!cafeId || !roasterId) {
      console.log(`  ✗ Skip: ${rel.cafe} → ${rel.roaster} (not found)`);
      skipped++;
      continue;
    }

    relations.push({ cafeId, roasterId });
  }

  const result = await prisma.cafeRoasterRelation.createMany({
    data: relations,
    skipDuplicates: true,
  });

  console.log(`\n  ✓ Created ${result.count} relations${skipped > 0 ? ` (skipped ${skipped})` : ""}`);
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
