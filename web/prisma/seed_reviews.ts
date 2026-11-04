/**
 * Seed reviews — ~40 recenzji dla palarni i kawiarni.
 * Mix APPROVED/PENDING/REJECTED, rating 2-5, komentarze PL/EN.
 *
 * Usage: npx tsx --env-file=.env.local prisma/seed_reviews.ts
 */
import { PrismaClient } from "@prisma/client";
import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

const ROASTER_REVIEWS = [
  // APPROVED — positive
  { roaster: "the-barn-berlin", author: "Anna K.", rating: 5, comment: "Absolutnie najlepsze single origins w Berlinie. Każdy batch jest perfekcyjnie wypalony.", status: "APPROVED" as const },
  { roaster: "the-barn-berlin", author: "Marcus W.", rating: 5, comment: "Incredible Ethiopian natural. Best light roast I've had in Europe.", status: "APPROVED" as const },
  { roaster: "onyx-coffee-lab", author: "James T.", rating: 5, comment: "Their transparency reports are unmatched. Coffee quality speaks for itself.", status: "APPROVED" as const },
  { roaster: "onyx-coffee-lab", author: "Sarah M.", rating: 4, comment: "Great coffee but shipping to EU is expensive. Worth it though.", status: "APPROVED" as const },
  { roaster: "tim-wendelboe", author: "Erik N.", rating: 5, comment: "A pilgrimage site for any coffee nerd. The espresso is transcendent.", status: "APPROVED" as const },
  { roaster: "square-mile-coffee", author: "Tom H.", rating: 5, comment: "James Hoffmann's expertise shines through every bag. Consistently excellent.", status: "APPROVED" as const },
  { roaster: "hard-beans-opole", author: "Piotr Z.", rating: 5, comment: "Polska palarnia na światowym poziomie. Kenya AA to arcydzieło.", status: "APPROVED" as const },
  { roaster: "hard-beans-opole", author: "Marta L.", rating: 4, comment: "Świetna jakość, ale ceny mogłyby być niższe. Rozumiem jednak że to specialty.", status: "APPROVED" as const },
  { roaster: "hayb-coffee", author: "Kasia W.", rating: 5, comment: "HAYB to wizytówka polskiego specialty. Bezkonkurencyjni w Warszawie.", status: "APPROVED" as const },
  { roaster: "java-coffee-roasters", author: "Tomek R.", rating: 4, comment: "Klasyka polskiego specialty. Solidna jakość od lat.", status: "APPROVED" as const },
  { roaster: "la-cabra", author: "Lars P.", rating: 5, comment: "Elegant and refined. Their Colombian is a masterpiece.", status: "APPROVED" as const },
  { roaster: "coffee-collective", author: "Mette S.", rating: 5, comment: "Love their transparent pricing model. Coffee tastes amazing too!", status: "APPROVED" as const },
  { roaster: "five-elephant", author: "Julia B.", rating: 4, comment: "Great roaster with a nice cafe. The cheesecake is a bonus.", status: "APPROVED" as const },
  { roaster: "bonanza-coffee", author: "Felix M.", rating: 4, comment: "Solid roaster, great location in Berlin. Always reliable.", status: "APPROVED" as const },
  { roaster: "intelligentsia-coffee", author: "Mike D.", rating: 5, comment: "Pioneers of third wave. Their Black Cat espresso is legendary.", status: "APPROVED" as const },
  { roaster: "stumptown-coffee", author: "Rachel G.", rating: 4, comment: "Hair Bender is my go-to daily driver. Consistent and delicious.", status: "APPROVED" as const },
  { roaster: "tobys-estate", author: "Liam C.", rating: 5, comment: "World's best for a reason. Their espresso blend is perfection.", status: "APPROVED" as const },
  { roaster: "gardelli-specialty", author: "Marco V.", rating: 5, comment: "Rubens is a genius roaster. Every competition winner uses his beans.", status: "APPROVED" as const },
  { roaster: "origin-coffee", author: "David S.", rating: 5, comment: "Best Roaster in Europe 2025 — well deserved! Amazing quality.", status: "APPROVED" as const },
  // PENDING — awaiting moderation
  { roaster: "coffee-proficiency", author: "Bartek N.", rating: 5, comment: "Niesamowite mikroroastery. Competition-grade quality prosto z Krakowa.", status: "PENDING" as const },
  { roaster: "milo-coffee-roasters", author: "Ola P.", rating: 4, comment: "Skandynawski styl palenia w Warszawie. Bardzo jasne, owocowe profile.", status: "PENDING" as const },
  { roaster: "sheep-and-raven", author: "Michał G.", rating: 5, comment: "Eksperymentalne microbatche na najwyższym poziomie.", status: "PENDING" as const },
  { roaster: "dark-matter-labs", author: "Chris A.", rating: 3, comment: "Interesting approach but sometimes too experimental for my taste.", status: "PENDING" as const },
  { roaster: "19grams-coffee", author: "Hans K.", rating: 4, comment: "Good roaster, nice cafe in Berlin. Could improve on consistency.", status: "PENDING" as const },
  // REJECTED
  { roaster: "flora-and-fauna", author: "Spam Bot", rating: 1, comment: "Visit my website for cheap coffee!!!", status: "REJECTED" as const },
  { roaster: "sey-coffee", author: "Troll123", rating: 1, comment: "Terrible coffee, worst I ever had. Don't buy!", status: "REJECTED" as const },
  { roaster: "kurasu-kyoto", author: "Fake Reviewer", rating: 2, comment: "Overpriced and overrated. Not worth the hype.", status: "REJECTED" as const },
];

const CAFE_REVIEWS = [
  // APPROVED
  { cafe: "man-versus-machine-munich", author: "Stefan R.", rating: 5, comment: "Best specialty coffee in Munich. The flat white is perfection.", status: "APPROVED" as const },
  { cafe: "man-versus-machine-munich", author: "Lisa M.", rating: 4, comment: "Great atmosphere and excellent coffee. Can get crowded on weekends.", status: "APPROVED" as const },
  { cafe: "java-cafe-speciality-roasters-warsaw", author: "Paweł K.", rating: 5, comment: "Najlepsza kawiarnia specialty w Warszawie. Profesjonalna obsługa.", status: "APPROVED" as const },
  { cafe: "java-cafe-speciality-roasters-warsaw", author: "Aga W.", rating: 4, comment: "Świetna kawa, dobre śniadania. Trochę ciasno w godzinach szczytu.", status: "APPROVED" as const },
  { cafe: "smash-cafe-roastery-poznan", author: "Kamil Z.", rating: 5, comment: "Poznańska perełka. Własna palarnia + kawiarnia = idealne combo.", status: "APPROVED" as const },
  { cafe: "smash-cafe-roastery-poznan", author: "Natalia B.", rating: 5, comment: "Najlepsze espresso w Poznaniu. Barista zna się na rzeczy.", status: "APPROVED" as const },
  { cafe: "the-barn-cafe-tal-munich", author: "Max F.", rating: 5, comment: "The Barn never disappoints. Clean, bright, and flavorful.", status: "APPROVED" as const },
  { cafe: "kawa-roastery-berlin", author: "Anna S.", rating: 4, comment: "Great Polish roaster in Berlin. Love the vibe and the coffee.", status: "APPROVED" as const },
  { cafe: "bozo-warsaw", author: "Jacek M.", rating: 4, comment: "Przytulne miejsce z dobrym jedzeniem i kawą. Polecam na weekend.", status: "APPROVED" as const },
  { cafe: "bonanza-coffee-berlin", author: "Nina L.", rating: 5, comment: "Iconic Berlin coffee spot. The pour-over bar is amazing.", status: "APPROVED" as const },
  { cafe: "rost-microroastery-caf-warsaw", author: "Ewa D.", rating: 4, comment: "Świetna micropalarnia. Własne ziarna, świeżo palone. Polecam!", status: "APPROVED" as const },
  { cafe: "kawa-roastery-x-berg-berlin", author: "Piotr N.", rating: 5, comment: "Polska palarnia w Berlinie — najlepszy ambasador naszego specialty.", status: "APPROVED" as const },
  { cafe: "ingwer-berlin", author: "Lena K.", rating: 4, comment: "Cozy spot in Neukölln. Great filter coffee and friendly staff.", status: "APPROVED" as const },
  { cafe: "doppio-berlin", author: "Tom W.", rating: 4, comment: "Solid espresso bar. Good pastries too. Will come back.", status: "APPROVED" as const },
  { cafe: "bardzo-poznan", author: "Magda R.", rating: 5, comment: "Ukryty klejnot na Żydowskiej. Świetna kawa i klimat.", status: "APPROVED" as const },
  // PENDING
  { cafe: "cafe-central-lwowska-warsaw", author: "Robert T.", rating: 4, comment: "Dobra kawa i miła obsługa. Czekam na więcej opcji jedzenia.", status: "PENDING" as const },
  { cafe: "sando-cafe-warsaw", author: "Iza P.", rating: 5, comment: "Minimalistyczne wnętrze, maksymalna jakość kawy. Uwielbiam!", status: "PENDING" as const },
  { cafe: "stray-coffee-roasters-munich", author: "David H.", rating: 3, comment: "Decent coffee but limited food options. Could be better.", status: "PENDING" as const },
  // REJECTED
  { cafe: "symple-caf-berlin", author: "Hater99", rating: 1, comment: "Worst coffee ever. Avoid at all costs!", status: "REJECTED" as const },
  { cafe: "untitled-poznan", author: "Spam Account", rating: 1, comment: "Buy cheap coffee at my website!!! Click here!!!", status: "REJECTED" as const },
];

async function main() {
  console.log("Seeding reviews...\n");

  const roasterSlugs = ROASTER_REVIEWS.map((r) => r.roaster);
  const cafeSlugs = CAFE_REVIEWS.map((r) => r.cafe);

  const [roasters, cafes] = await Promise.all([
    prisma.roaster.findMany({
      where: { slug: { in: roasterSlugs } },
      select: { id: true, slug: true },
    }),
    prisma.cafe.findMany({
      where: { slug: { in: cafeSlugs } },
      select: { id: true, slug: true },
    }),
  ]);

  const roasterMap = new Map(roasters.map((r) => [r.slug, r.id]));
  const cafeMap = new Map(cafes.map((c) => [c.slug, c.id]));

  const reviewData: { roasterId?: string; cafeId?: string; authorName: string; rating: number; comment: string; status: "APPROVED" | "PENDING" | "REJECTED" }[] = [
    ...ROASTER_REVIEWS.map((r) => ({
      roasterId: roasterMap.get(r.roaster),
      authorName: r.author,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
    })),
    ...CAFE_REVIEWS.map((r) => ({
      cafeId: cafeMap.get(r.cafe),
      authorName: r.author,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
    })),
  ];

  const validData = reviewData.filter((r) => {
    if (!r.roasterId && !r.cafeId) {
      return false;
    }
    return true;
  });

  // Idempotency: remove only reviews that this script created earlier
  // (anonymous + one of the seed author names). Real user reviews always
  // carry a Clerk userId and are never touched. The previous version deleted
  // EVERY review of every roaster/cafe, which wiped real reviews whenever the
  // seed ran on production.
  const seedAuthors = [...new Set(validData.map((r) => r.authorName))];
  const deleted = await prisma.review.deleteMany({
    where: { userId: null, authorName: { in: seedAuthors } },
  });
  console.log(`  Removed ${deleted.count} previously seeded reviews`);

  const result = await prisma.review.createMany({
    data: validData,
  });

  const approved = validData.filter((r) => r.status === "APPROVED").length;
  const pending = validData.filter((r) => r.status === "PENDING").length;
  const rejected = validData.filter((r) => r.status === "REJECTED").length;

  console.log(`  ✓ Created ${result.count} reviews`);
  console.log(`    APPROVED: ${approved}`);
  console.log(`    PENDING: ${pending}`);
  console.log(`    REJECTED: ${rejected}`);

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
