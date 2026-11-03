import { describe, expect, it } from "vitest";
import { betaCookieValue, isValidBetaCookie, safeEqual } from "../beta-auth";

describe("beta-auth", () => {
  it("produces a deterministic, password-dependent cookie value", async () => {
    const a = await betaCookieValue("secret");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await betaCookieValue("secret")).toBe(a);
    expect(await betaCookieValue("other")).not.toBe(a);
  });

  it("accepts only the signed cookie for the current password", async () => {
    const valid = await betaCookieValue("secret");
    expect(await isValidBetaCookie(valid, "secret")).toBe(true);
    expect(await isValidBetaCookie("1", "secret")).toBe(false); // old forgeable value
    expect(await isValidBetaCookie(undefined, "secret")).toBe(false);
    expect(await isValidBetaCookie(valid, "rotated")).toBe(false);
  });

  it("safeEqual compares strings correctly", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});
