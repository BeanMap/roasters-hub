import { NextRequest, NextResponse } from "next/server";
import {
  BETA_COOKIE_MAX_AGE,
  BETA_COOKIE_NAME,
  betaCookieValue,
  safeEqual,
} from "@/lib/beta-auth";

/**
 * BETA PASSWORD AUTH
 * ==================
 * POST /api/beta-auth
 * Body: { password: string }
 * Sets a signed "beta_auth" cookie for 24h if password matches BETA_PASSWORD env var.
 *
 * How to remove:
 * 1. Delete this file and src/lib/beta-auth.ts
 * 2. Delete BETA_PASSWORD from env
 * 3. Delete the beta gate block from proxy.ts
 */

export async function POST(req: NextRequest) {
  const betaPassword = process.env.BETA_PASSWORD;
  if (!betaPassword) {
    return NextResponse.json({ ok: true });
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof password !== "string" || !safeEqual(password, betaPassword)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(BETA_COOKIE_NAME, await betaCookieValue(betaPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: BETA_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
