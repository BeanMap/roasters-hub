import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Ensure a UserProfile exists in the DB for the given Clerk user.
 * Creates on first call (lazy bootstrap), updates email/role on subsequent calls.
 */
async function ensureUserProfile(
  userId: string,
  email: string,
  role: "ADMIN" | "ROASTER" | "CAFE",
) {
  const { db } = await import("@/lib/db");
  await db.userProfile.upsert({
    where: { id: userId },
    update: { email, role },
    create: { id: userId, email, role },
  });
}

/**
 * Require the caller to be an authenticated ADMIN.
 * Throws if not authenticated or role !== ADMIN.
 * Auto-creates UserProfile in DB on first call.
 * Returns the Clerk userId.
 */
export async function requireAdmin(): Promise<string> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: not signed in");
  }

  // Check role from session claims (set via Clerk Dashboard → Sessions → Edit session token)
  // Falls back to currentUser() if claims not configured yet
  const roleFromClaims = (sessionClaims as Record<string, unknown>)?.metadata as { role?: string } | undefined;
  if (roleFromClaims?.role === "ADMIN") {
    await ensureUserProfile(userId, "", "ADMIN");
    return userId;
  }

  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "ADMIN") {
    throw new Error("Forbidden: admin role required");
  }

  await ensureUserProfile(userId, user.emailAddresses[0]?.emailAddress ?? "", "ADMIN");

  return userId;
}

/**
 * Require the caller to be an authenticated ADMIN with a redirect.
 * Use as a layout-level gate for admin pages (no manual checks per page).
 * Redirects to /sign-in if not authenticated, or / if not admin.
 * Returns user's first name for display in admin nav.
 */
export async function requireAdminPage(): Promise<string> {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  const roleFromClaims = (sessionClaims as Record<string, unknown>)?.metadata as { role?: string } | undefined;
  if (roleFromClaims?.role === "ADMIN") {
    await ensureUserProfile(userId, "", "ADMIN");
    const user = await currentUser();
    return user?.firstName ?? "Admin";
  }

  const user = await currentUser();
  if (!user || user.publicMetadata?.role !== "ADMIN") redirect("/");

  await ensureUserProfile(userId, user.emailAddresses[0]?.emailAddress ?? "", "ADMIN");

  return user.firstName ?? "Admin";
}

/**
 * Require the caller to be authenticated.
 * Returns the Clerk userId. Does NOT check role.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: not signed in");
  }
  return userId;
}

/**
 * Require the caller to be the owner of a specific roaster.
 * Returns the Clerk userId.
 */
export async function requireRoasterOwner(roasterId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: not signed in");
  }

  // Lazy import to avoid circular dependency
  const { db } = await import("@/lib/db");
  const profile = await db.userProfile.findUnique({
    where: { id: userId },
    select: { ownedRoasters: { select: { id: true } } },
  });

  const owns = profile?.ownedRoasters.some((r) => r.id === roasterId);
  if (!owns) {
    throw new Error("Forbidden: not the owner of this roaster");
  }

  return userId;
}

/**
 * Require the caller to be the owner of a specific cafe.
 * Returns the Clerk userId.
 */
export async function requireCafeOwner(cafeId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: not signed in");
  }

  const { db } = await import("@/lib/db");
  const profile = await db.userProfile.findUnique({
    where: { id: userId },
    select: { ownedCafes: { select: { id: true } } },
  });

  const owns = profile?.ownedCafes.some((c) => c.id === cafeId);
  if (!owns) {
    throw new Error("Forbidden: not the owner of this cafe");
  }

  return userId;
}
