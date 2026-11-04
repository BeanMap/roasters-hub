/**
 * Seed admin notes — notatki admina do palarni (głównie PENDING).
 *
 * Usage: npx tsx --env-file=.env.local prisma/seed_admin_notes.ts
 */
import { PrismaClient } from "@prisma/client";
import { createScriptClient } from "./script-client";

const prisma = createScriptClient();

const ADMIN_EMAIL = "marek.nadra@gmail.com";

const NOTES = [
  {
    roaster: "fika-coffee-roasters",
    note: "Sprawdzić certyfikaty organic — zgłoszone ale nie ma dokumentacji.",
  },
  {
    roaster: "monsooned-coffee",
    note: "Wymagane potwierdzenie strony www. Kontakt: kontakt@monsooned.coffee.",
  },
  {
    roaster: "proper-order-coffee",
    note: "Zweryfikować lokalizację w Dublinie. Sprawdzić czy działają jako roastery czy tylko cafe.",
  },
  {
    roaster: "white-rose-coffee",
    note: "Dobra reputacja w UK specialty scene. Sprawdzić Instagram i website.",
  },
  {
    roaster: "kaffeeform-roasters",
    note: "Ciekawy model biznesowy — recykling fusów. Sprawdzić czy to roaster czy cafe.",
  },
];

async function main() {
  console.log("Seeding admin notes...\n");

  const adminProfile = await prisma.userProfile.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!adminProfile) {
    console.log("  ✗ Admin profile not found. Run seed_user_profiles.ts first.");
    return;
  }

  const roasters = await prisma.roaster.findMany({
    where: { slug: { in: NOTES.map((n) => n.roaster) } },
    select: { id: true, slug: true },
  });

  const roasterMap = new Map(roasters.map((r) => [r.slug, r.id]));

  const notesData = NOTES.map((n) => ({
    roasterId: roasterMap.get(n.roaster)!,
    adminId: adminProfile.id,
    note: n.note,
  })).filter((n) => n.roasterId);

  const result = await prisma.adminNote.createMany({
    data: notesData,
  });

  console.log(`  ✓ Created ${result.count} admin notes`);
  for (const n of NOTES) {
    const found = roasterMap.has(n.roaster);
    console.log(`    ${found ? "✓" : "✗"} ${n.roaster}: ${n.note.substring(0, 50)}...`);
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
