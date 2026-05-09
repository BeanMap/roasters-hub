/**
 * Seed test users for usability testing via Clerk Backend API.
 *
 * Creates 4 accounts:
 *   tester@beanmap.test          — no role (regular user)
 *   tester-roaster@beanmap.test  — ROASTER
 *   tester-cafe@beanmap.test     — CAFE
 *   tester-admin@beanmap.test    — ADMIN
 *
 * Requires CLERK_SECRET_KEY in .env.local
 *
 * Usage: npx tsx --env-file=.env.local prisma/seed_test_users.ts
 */
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

if (!process.env.CLERK_SECRET_KEY) {
  console.error("Missing CLERK_SECRET_KEY in environment");
  process.exit(1);
}

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const PASSWORD = "BeanTest2026!";

interface TestUser {
  email: string;
  role: "ROASTER" | "ADMIN" | "CAFE" | null;
}

const TEST_USERS: TestUser[] = [
  { email: "tester@beenmap-test.com", role: null },
  { email: "tester-roaster@beenmap-test.com", role: "ROASTER" },
  { email: "tester-cafe@beenmap-test.com", role: "CAFE" },
  { email: "tester-admin@beenmap-test.com", role: "ADMIN" },
];

async function main() {
  console.log("Creating test users via Clerk API...\n");

  for (const tu of TEST_USERS) {
    // Check if user already exists in Clerk
    const clerkList = await clerk.users.getUserList({
      emailAddress: [tu.email],
      limit: 1,
    });

    if (clerkList.data.length > 0) {
      const existingUser = clerkList.data[0];
      console.log(`  ⏭ ${tu.email} — already exists (Clerk ID: ${existingUser.id})`);

      // Update role if needed
      if (tu.role) {
        await clerk.users.updateUser(existingUser.id, {
          publicMetadata: { role: tu.role },
        });
        console.log(`    ↳ role set to ${tu.role}`);
      }

      // Find primary email and verify it
      const primaryEmail = existingUser.emailAddresses.find((e) => e.emailAddress === tu.email);
      if (primaryEmail && primaryEmail.verification?.status !== "verified") {
        try {
          await clerk.emailAddresses.updateEmailAddress(primaryEmail.id, {
            verified: true,
          });
          console.log(`    ↳ email verified`);
        } catch {
          // If update fails, create a new verified email
          await clerk.emailAddresses.createEmailAddress({
            userId: existingUser.id,
            emailAddress: tu.email,
            verified: true,
            primary: true,
          });
          console.log(`    ↳ new verified email created`);
        }
      }

      // Ensure UserProfile in DB
      const dbRole = tu.role ?? "ROASTER";
      await prisma.userProfile.upsert({
        where: { id: existingUser.id },
        update: { email: tu.email, role: dbRole },
        create: { id: existingUser.id, email: tu.email, role: dbRole },
      });
      console.log(`    ↳ UserProfile synced in DB`);
      continue;
    }

    // Create new Clerk user (without email first, to avoid verification)
    const clerkUser = await clerk.users.createUser({
      password: PASSWORD,
      skipPasswordChecks: true,
      skipLegalChecks: true,
      publicMetadata: tu.role ? { role: tu.role } : {},
    });

    // Add verified email address
    await clerk.emailAddresses.createEmailAddress({
      userId: clerkUser.id,
      emailAddress: tu.email,
      verified: true,
      primary: true,
    });

    console.log(`  ✓ ${tu.email} (Clerk ID: ${clerkUser.id})`);

    // Create UserProfile in DB
    const dbRole = tu.role ?? "ROASTER";
    await prisma.userProfile.upsert({
      where: { id: clerkUser.id },
      update: { email: tu.email, role: dbRole },
      create: { id: clerkUser.id, email: tu.email, role: dbRole },
    });
    console.log(`    ↳ UserProfile created in DB with role=${dbRole}`);
  }

  console.log("\n─── Login credentials ───");
  console.log(`  Password: ${PASSWORD}`);
  for (const tu of TEST_USERS) {
    const roleLabel = tu.role ?? "regular user";
    console.log(`  ${tu.email} → ${roleLabel}`);
  }
  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
