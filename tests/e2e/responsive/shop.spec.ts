import { expect, test, type Page } from "@playwright/test";
import { SHOP_LAYOUTS } from "../../../src/lib/shop-layouts";

// TF3-T07 (docs/responsive-spec.md 6.2): up to 1100 px every shop layout filters in a sheet, the grid is
// two columns on phones, and list layouts become cards. Above 1100 px the layouts keep their inline filters.
const widthOf = (page: Page) => page.viewportSize()!.width;

test.describe("Shop and filter sheet", () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) > 1100, "the filter sheet is for tablets and phones");
  });

  test("R-02 every layout has a Filter button that opens a labelled sheet and Show results closes it", async ({
    page,
  }) => {
    for (const layout of SHOP_LAYOUTS) {
      await page.goto(`/shop?layout=${layout}`, { waitUntil: "networkidle" });
      const button = page
        .getByTestId(layout === "filter-drawer" ? "filter-button" : "filter-sheet-button")
        .first();
      await expect(button, layout).toBeVisible();
      await expect(page.locator("#shop-filters-sheet"), layout).toHaveCount(0);
      await button.click();
      const sheet = page.getByRole("dialog", { name: "Filter" });
      await expect(sheet, layout).toBeVisible();
      await expect(sheet.getByRole("button", { name: "Show results" })).toBeVisible();
      await sheet.getByRole("button", { name: "Show results" }).click();
      await expect(sheet, layout).toBeHidden();
    }
  });

  test("R-02 a filter chosen in the sheet narrows the products and Escape closes the sheet", async ({
    page,
  }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const total = async () =>
      (await page.getByTestId("results-summary").first().innerText()).trim();
    const before = await total();
    await page.getByTestId("filter-sheet-button").click();
    const sheet = page.getByRole("dialog", { name: "Filter" });
    await sheet.getByRole("checkbox", { name: /^Makeup/ }).click();
    await expect.poll(total).not.toBe(before);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("R-02 phones show two product columns and list layouts keep the picture beside the text", async ({
    page,
  }) => {
    test.skip(widthOf(page) > 767, "phone only");
    await page.goto("/shop", { waitUntil: "networkidle" });
    const tops = await page
      .getByTestId("product-grid")
      .locator("> li")
      .evaluateAll((items) =>
        items.slice(0, 4).map((li) => Math.round(li.getBoundingClientRect().top)),
      );
    expect(new Set(tops).size).toBe(2);

    await page.goto("/shop?layout=list-left", { waitUntil: "networkidle" });
    const box = await page
      .getByTestId("product-grid")
      .locator("> li")
      .first()
      .evaluate((li) => {
        const img = li.querySelector("img")!.getBoundingClientRect();
        const title = li.querySelector("h3")!.getBoundingClientRect();
        return { imageRight: img.right, titleLeft: title.left };
      });
    expect(box.titleLeft).toBeGreaterThanOrEqual(box.imageRight - 1);
  });
});
