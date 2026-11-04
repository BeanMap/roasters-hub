import { test, expect } from "@playwright/test";

/** Roasters and cafés share one search/filter UX. */
for (const path of ["/pl/roasters", "/pl/cafes"]) {
  test.describe(`Catalog filters: ${path}`, () => {
    test("has the shared panel: search, location (country + city), coffee", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("searchbox")).toBeVisible();
      await expect(page.getByLabel("Kraj")).toBeAttached();
      await expect(page.getByLabel("Miasto")).toBeAttached();
      await expect(page.getByText("Kawa", { exact: true })).toBeAttached();
      await expect(page.getByRole("combobox", { name: "Sort" })).toBeVisible();
    });

    test("coffee chip filters and shows a removable active-filter chip", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      await page.getByRole("button", { name: "Espresso", exact: true }).click();
      await expect(page).toHaveURL(/style=Espresso/);
      const chip = page.getByRole("button", { name: /Usuń filtr: Espresso/ });
      await expect(chip).toBeVisible();
      await chip.click();
      await expect(page).not.toHaveURL(/style=/);
    });

    test("search matches city names too", async ({ page }) => {
      await page.goto(`${path}?q=berlin`);
      await expect(page.getByText(/Wyświetlono [1-9]/)).toBeVisible();
    });
  });
}
