import { describe, expect, it } from "vitest";
import { normalizeLocation, normalizeLocationPatch, resolveCountryCode } from "@/lib/country-codes";

describe("resolveCountryCode", () => {
  it("accepts EN, PL and DE names and codes in any case", () => {
    expect(resolveCountryCode("Poland")).toBe("PL");
    expect(resolveCountryCode("Polska")).toBe("PL"); // used to return "" (PL registration form)
    expect(resolveCountryCode("niemcy ")).toBe("DE");
    expect(resolveCountryCode("Deutschland")).toBe("DE");
    expect(resolveCountryCode("pl")).toBe("PL");
    expect(resolveCountryCode("Atlantis")).toBe("");
    expect(resolveCountryCode("")).toBe("");
  });
});

describe("normalizeLocation", () => {
  it("produces a valid code, canonical country and local city names", () => {
    expect(normalizeLocation({ country: "Polska", city: " Warsaw " })).toEqual({ country: "Poland", countryCode: "PL", city: "Warszawa" });
    expect(normalizeLocation({ country: "Germany", countryCode: "GE", city: "munich" })).toEqual({ country: "Germany", countryCode: "DE", city: "München" });
    expect(normalizeLocation({ country: "PL", city: "Poznan" })).toEqual({ country: "Poland", countryCode: "PL", city: "Poznań" });
    expect(normalizeLocation({ country: "United Kingdom", city: "London" })).toMatchObject({ countryCode: "GB", city: "London" });
  });

  it("only touches fields present in a partial update", () => {
    expect(normalizeLocationPatch({ name: "X" } as { name: string; city?: string })).toEqual({ name: "X" });
    expect(normalizeLocationPatch({ city: "  Kraków " })).toEqual({ city: "Kraków" });
    expect(normalizeLocationPatch({ country: "Niemcy" })).toEqual({ country: "Germany", countryCode: "DE" });
  });
});
