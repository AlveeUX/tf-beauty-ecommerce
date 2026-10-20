import { expect, test, type Page } from "@playwright/test";
import { PDP_LAYOUTS } from "../../../src/lib/pdp-layouts";

// TF3-T08 (docs/responsive-spec.md 6.3): gallery above the details, full-width buy buttons and the sticky
// add-to-cart bar on phones, for every product layout.
const widthOf = (page: Page) => page.viewportSize()!.width;

test.describe("Product page", () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) > 1100, "tablets and phones");
  });

  test("R-02 in every layout the gallery sits above the details and the buy buttons fit the screen", async ({
    page,
  }) => {
    const problems: string[] = [];
    for (const layout of PDP_LAYOUTS) {
      await page.goto(`/product/the-renewal-serum?layout=${layout}`, { waitUntil: "networkidle" });
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const gallery = document.querySelector('[data-testid="product-gallery"]')!;
        const title = document.querySelector("h1")!;
        const add = document.querySelector('[data-testid="add-to-cart"]')!.getBoundingClientRect();
        return {
          vw,
          galleryBottom: gallery.getBoundingClientRect().bottom,
          titleTop: title.getBoundingClientRect().top,
          addLeft: add.left,
          addRight: add.right,
          addHeight: add.height,
          scroll: document.documentElement.scrollWidth,
        };
      });
      if (m.titleTop < m.galleryBottom) problems.push(`${layout}: details above the gallery`);
      if (m.addLeft < -0.5 || m.addRight > m.vw + 0.5)
        problems.push(`${layout}: add to cart off screen`);
      if (m.addHeight < 43.5) problems.push(`${layout}: add to cart is ${m.addHeight}px high`);
      if (m.scroll > m.vw) problems.push(`${layout}: page scrolls sideways (+${m.scroll - m.vw})`);
    }
    expect(problems).toEqual([]);
  });

  test("R-02 phones show the sticky add-to-cart bar once the buy buttons scroll away, in every layout, and it adds to the cart", async ({
    page,
  }) => {
    test.skip(widthOf(page) > 767, "phone only");
    for (const layout of PDP_LAYOUTS) {
      await page.goto(`/product/the-renewal-serum?layout=${layout}`, { waitUntil: "networkidle" });
      const bar = page.getByTestId("sticky-bar");
      await expect(bar, layout).toBeHidden();
      const addTop = await page
        .locator("#buy-row")
        .evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
      await page.evaluate((y) => window.scrollTo(0, y + 200), addTop);
      await expect(bar, layout).toBeVisible();
      // the bar slides in: wait until it rests on the bottom edge
      await expect
        .poll(
          async () => {
            const box = (await bar.boundingBox())!;
            return Math.round(box.y + box.height);
          },
          { message: layout },
        )
        .toBeLessThanOrEqual(page.viewportSize()!.height + 1);
      const button = bar.getByTestId("sticky-add");
      expect((await button.boundingBox())!.height, layout).toBeGreaterThanOrEqual(43.5);
    }
    await page.goto("/product/the-renewal-serum", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.getByTestId("sticky-add").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
  });

  test("R-02 the sticky bar does not cover the footer", async ({ page }) => {
    test.skip(widthOf(page) > 767, "phone only");
    await page.goto("/product/the-renewal-serum", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByTestId("sticky-bar")).toBeHidden();
  });

  test("R-02 in the zoom layouts a tap on the picture opens the full-screen viewer and there is no hover lens", async ({
    page,
  }) => {
    for (const layout of ["inner-zoom", "external-zoom"]) {
      await page.goto(`/product/the-renewal-serum?layout=${layout}`, { waitUntil: "networkidle" });
      await page.getByTestId("gallery-main").click({ position: { x: 60, y: 200 } });
      await expect(page.getByRole("dialog", { name: /image$/ }), layout).toBeVisible();
      await expect(page.getByTestId("zoom-pane")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: /image$/ }), layout).toBeHidden();
    }
  });

  test("R-02 phone dialogs are bottom sheets that fit the screen and close with Escape", async ({
    page,
  }) => {
    test.skip(widthOf(page) > 767, "phone only");
    await page.goto("/product/the-renewal-serum", { waitUntil: "networkidle" });
    await page.getByTestId("size-guide-link").click();
    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible();
    const vp = page.viewportSize()!;
    await expect
      .poll(async () => {
        const box = (await dialog.boundingBox())!;
        return [Math.round(box.x), Math.round(box.width), Math.round(box.y + box.height)];
      })
      .toEqual([0, vp.width, vp.height]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
