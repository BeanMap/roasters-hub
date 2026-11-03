/**
 * Beta password gate — shared helpers for proxy.ts and /api/beta-auth.
 *
 * The cookie value is an HMAC of a fixed label keyed with BETA_PASSWORD, so it
 * cannot be forged without knowing the password (previously the cookie was a
 * literal "1" that anyone could set by hand). Changing BETA_PASSWORD
 * invalidates all existing cookies.
 *
 * Uses Web Crypto only, so it runs in both the proxy and route handlers.
 */

export const BETA_COOKIE_NAME = "beta_auth";
export const BETA_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

const encoder = new TextEncoder();

export async function betaCookieValue(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("beanmap-beta-auth:v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison (avoids leaking match length via timing). */
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export async function isValidBetaCookie(
  cookie: string | undefined,
  password: string
): Promise<boolean> {
  if (!cookie) return false;
  return safeEqual(cookie, await betaCookieValue(password));
}
