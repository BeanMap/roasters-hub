import { describe, expect, it } from "vitest";
import { commonOrderBy, commonWhere, listParam, parseCatalogParams } from "@/lib/catalog";

describe("catalog params", () => {
  it("reads repeated and legacy comma-separated params", () => {
    expect(listParam({ amenity: ["wifi", "vegan"] }, "amenity")).toEqual(["wifi", "vegan"]);
    expect(listParam({ amenities: "wifi,vegan" }, "amenity", "amenities")).toEqual(["wifi", "vegan"]);
    expect(listParam({ style: "Espresso", roast: "Espresso" }, "style", "roast")).toEqual(["Espresso"]);
  });

  it("parses shared params with safe defaults and legacy sort values", () => {
    expect(parseCatalogParams({})).toMatchObject({ page: 1, sort: "recommended", styles: [] });
    expect(parseCatalogParams({ sort: "relevance", page: "3" })).toMatchObject({ sort: "recommended", page: 3 });
    expect(parseCatalogParams({ sort: "rating" }).sort).toBe("mostReviewed");
    expect(parseCatalogParams({ sort: "bogus", page: "-4" })).toMatchObject({ sort: "recommended", page: 1 });
    expect(parseCatalogParams({ q: "  Warszawa ", city: "Kraków" })).toMatchObject({ q: "Warszawa", city: "Kraków" });
  });

  it("searches name or city and filters location the same way for every type", () => {
    const w = commonWhere({ q: "berlin", country: "DE", city: "Berlin" });
    expect(w).toMatchObject({
      countryCode: { equals: "DE", mode: "insensitive" },
      city: { in: ["Berlin"], mode: "insensitive" },
    });
    expect(w.OR).toHaveLength(2);
    expect(commonWhere({})).toEqual({});
  });

  it("orders recommended results by featured first", () => {
    expect(commonOrderBy("recommended")[0]).toEqual({ featured: "desc" });
    expect(commonOrderBy("nameAZ")).toEqual([{ name: "asc" }]);
  });
});

describe("buildLocations", () => {
  it("normalizes messy country/city data and localizes names", async () => {
    const { buildLocations, cityVariantsFor, foldText } = await import("@/lib/catalog");
    const rows = [
      { countryCode: "PL", city: "Poznań", _count: { _all: 20 } },
      { countryCode: "pl", city: "Poznan ", _count: { _all: 5 } },
      { countryCode: "", city: "Nowhere", _count: { _all: 1 } },
      { countryCode: "DE", city: "Berlin", _count: { _all: 9 } },
    ];
    const locs = buildLocations(rows, "pl");
    const countries = locs.filter((l) => l.kind === "country");
    expect(countries.map((c) => c.value).sort()).toEqual(["DE", "PL"]);
    expect(countries.find((c) => c.value === "PL")).toMatchObject({ label: "Polska", count: 25 });
    const poznan = locs.find((l) => l.kind === "city" && l.countryCode === "PL");
    expect(poznan).toMatchObject({ label: "Poznań", count: 25 });
    expect(cityVariantsFor(locs, "poznan")?.sort()).toEqual(["Poznan", "Poznań"]);
    expect(foldText("  ŁÓDŹ ")).toBe("lodz");
  });
});

describe("city slugs", () => {
  it("builds ASCII slugs and resolves accents, case and legacy English names", async () => {
    const { cityUrlSlug, resolveCitySlug } = await import("@/lib/catalog");
    expect(cityUrlSlug("Poznań")).toBe("poznan");
    expect(cityUrlSlug("Frankfurt am Main")).toBe("frankfurt-am-main");
    expect(resolveCitySlug("poznan", ["Poznań", "Warszawa"])).toEqual({ variants: ["Poznań"] });
    expect(resolveCitySlug("pozna%C5%84", ["Poznań"])).toEqual({ variants: ["Poznań"] });
    expect(resolveCitySlug("warsaw", ["Warszawa"])).toEqual({ variants: [], redirectTo: "warszawa" });
    expect(resolveCitySlug("atlantis", ["Warszawa"])).toBeNull();
  });
});
