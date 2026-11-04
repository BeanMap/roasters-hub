import { test, expect } from "@playwright/test";

/** UX regressions found in the 2026-11 audit. */

const CATALOG_PAGES = ["/", "/roasters", "/cafes", "/cafes?page=5", "/roasters/onyx-coffee-lab"];

test.describe("Smoke: UX", () => {
  for (const path of CATALOG_PAGES) {
    test(`no horizontal scroll on phones: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("Polish catalog has no untranslated filter labels", async ({ page }) => {
    await page.goto("/pl/roasters");
    await expect(page.getByText(/zweryfikowan/i).first()).toBeVisible();
    await expect(page.getByText("Search name")).toHaveCount(0);
    await expect(page.getByText(/Showing \d+ of/)).toHaveCount(0);
  });

  test("pagination keeps the locale", async ({ page }) => {
    await page.goto("/de/cafes");
    await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: /2$/ }).click();
    await expect(page).toHaveURL(/\/de\/cafes\?page=2/);
  });

  test("unknown page shows the branded 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /roasters/i }).first()).toBeVisible();
  });
});
