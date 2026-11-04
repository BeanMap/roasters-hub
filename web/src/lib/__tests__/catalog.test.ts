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
    expect(w).toMatchObject({ countryCode: "DE", city: { equals: "Berlin", mode: "insensitive" } });
    expect(w.OR).toHaveLength(2);
    expect(commonWhere({})).toEqual({});
  });

  it("orders recommended results by featured first", () => {
    expect(commonOrderBy("recommended")[0]).toEqual({ featured: "desc" });
    expect(commonOrderBy("nameAZ")).toEqual([{ name: "asc" }]);
  });
});
