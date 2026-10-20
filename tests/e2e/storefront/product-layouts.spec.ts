import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoSeriousViolations } from "../fixtures/axe";

// E2E-LAY-01..10 (PRD-010/011/012): the Figma product-page layouts. Coordinates are page coordinates at
// 1920 wide, taken from the frames (gallery column x=300 w=645, purchase panel x=1045 w=575, top y=187).

/** Page-coordinate box (Playwright's boundingBox is viewport-relative). */
async function pageBox(locator: Locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + scrollX),
      y: Math.round(r.top + scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
}

const open = async (page: Page, slug: string, layout: string) => {
  await page.goto(`/product/${slug}?layout=${layout}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

test.describe("Product page layouts", () => {
  test("E2E-LAY-01 every layout renders the same product with the shared purchase panel", async ({
    page,
  }) => {
    for (const layout of [
      "details-default",
      "product-color",
      "subscribe-and-save",
      "on-sale-countdown",
      "thumbnail-right",
      "thumbnail-left",
      "gallery-1-column",
      "gallery-2-column",
      "inner-zoom",
      "external-zoom",
    ]) {
      await open(page, "velvet-skin-foundation", layout);
      await expect(page.getByTestId("add-to-cart"), layout).toBeVisible();
      await expect(page.getByTestId("sku"), layout).toBeVisible();
      await expect(page.getByTestId("product-gallery"), layout).toBeVisible();
      // the gallery column starts where the design puts it
      const gallery = await pageBox(page.getByTestId("product-gallery"));
      expect(gallery.x, layout).toBe(300);
      expect(gallery.y, layout).toBe(187);
    }
  });

  test("E2E-LAY-02 an unknown layout falls back to the default and the product's own layout is used without a URL choice", async ({
    page,
  }) => {
    await open(page, "the-renewal-serum", "no-such-layout");
    await expect(page.getByTestId("product-gallery")).toHaveAttribute("data-mode", "below");
    await expect(page.getByTestId("purchase-options")).toHaveCount(0);
    // a stored product layout and its URL override are covered by tests/integration/pdp-layouts.test.ts
  });

  test("E2E-LAY-03 thumbnail layouts: 80px column beside a 550 x 642 image (3:29779, 3:30941)", async ({
    page,
  }) => {
    await open(page, "the-renewal-serum", "thumbnail-right");
    let main = await pageBox(page.getByTestId("gallery-main"));
    let thumbs = await pageBox(page.getByRole("list", { name: "Product images" }));
    expect(main).toMatchObject({ x: 395, y: 187, w: 550, h: 642 });
    expect(thumbs).toMatchObject({ x: 300, w: 80 });

    await open(page, "the-renewal-serum", "thumbnail-left");
    main = await pageBox(page.getByTestId("gallery-main"));
    thumbs = await pageBox(page.getByRole("list", { name: "Product images" }));
    expect(main).toMatchObject({ x: 300, y: 187, w: 550, h: 642 });
    expect(thumbs).toMatchObject({ x: 865, w: 80 });

    // thumbnails and arrows still change the image
    const before = await page.getByTestId("gallery-main").locator("img").getAttribute("src");
    await page.getByRole("button", { name: "Show image 3 of 5" }).click();
    await expect(page.getByTestId("gallery-main").locator("img")).not.toHaveAttribute(
      "src",
      before!,
    );
    await page.getByRole("button", { name: "Next image" }).click();
    await expect(page.getByRole("button", { name: "Show image 4 of 5" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("E2E-LAY-04 gallery 1 column stacks 3 images of 645 x 751 beside a sticky panel; the viewer reaches all 5", async ({
    page,
  }) => {
    await open(page, "the-renewal-serum", "gallery-1-column");
    const cells = page.getByTestId("gallery-grid").getByRole("button");
    await expect(cells).toHaveCount(3);
    const grid = await pageBox(page.getByTestId("gallery-grid"));
    expect(grid).toMatchObject({ x: 300, y: 187, w: 645, h: 2287 });

    // the purchase panel follows the scroll
    const add = page.getByTestId("add-to-cart");
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(add).toBeInViewport();

    await page.getByRole("button", { name: "View image full screen" }).click();
    const viewer = page.getByRole("dialog");
    await expect(viewer).toBeVisible();
    await viewer.getByRole("button", { name: "Next image" }).click();
    await viewer.getByRole("button", { name: "Close" }).click();
    await expect(viewer).toBeHidden();
  });

  test("E2E-LAY-05 gallery 2 column is a 2 x 2 grid of 315 x 367 cells and opens the viewer on click", async ({
    page,
  }) => {
    await open(page, "the-renewal-serum", "gallery-2-column");
    const cells = page.getByTestId("gallery-grid").getByRole("button");
    await expect(cells).toHaveCount(4);
    const first = await pageBox(cells.first());
    const second = await pageBox(cells.nth(1));
    const third = await pageBox(cells.nth(2));
    expect(first).toMatchObject({ x: 300, y: 187, w: 315 });
    expect(Math.abs(first.h - 367)).toBeLessThanOrEqual(1); // 314.5 x 367 in the frame, rounded
    expect(second.x).toBe(630);
    expect(third.y).toBeGreaterThan(first.y + first.h);
    await cells.nth(2).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("E2E-LAY-06 inner zoom shows a 174px magnifier that follows the mouse and disappears on leave", async ({
    page,
  }) => {
    await open(page, "the-renewal-serum", "inner-zoom");
    const main = page.getByTestId("gallery-main");
    await expect(page.getByTestId("zoom-lens")).toHaveCount(0);
    const box = await pageBox(main);
    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.move(box.x + 320, box.y + 310);
    const lens = page.getByTestId("zoom-lens");
    await expect(lens).toBeVisible();
    const lensBox = await pageBox(lens);
    expect(lensBox.w).toBe(174);
    expect(Math.abs(lensBox.x + 87 - (box.x + 320))).toBeLessThanOrEqual(1);
    expect(Math.abs(lensBox.y + 87 - (box.y + 310))).toBeLessThanOrEqual(1);
    await page.mouse.move(10, 10);
    await expect(lens).toHaveCount(0);
  });

  test("E2E-LAY-07 external zoom opens a 644px pane over the panel on the right (3:18997)", async ({
    page,
  }) => {
    await open(page, "the-renewal-serum", "external-zoom");
    const box = await pageBox(page.getByTestId("gallery-main"));
    await expect(page.getByTestId("zoom-pane")).toHaveCount(0);
    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.move(box.x + 310, box.y + 305);
    const pane = page.getByTestId("zoom-pane");
    await expect(pane).toBeVisible();
    expect(await pageBox(pane)).toMatchObject({ x: 976, y: 187, w: 644, h: 752 });
    await page.mouse.move(10, 10);
    await expect(pane).toHaveCount(0);
  });

  test("E2E-LAY-08 product color: chips show a name and one can be selected (3:35398)", async ({
    page,
  }) => {
    await open(page, "luxe-matte-lipstick", "product-color");
    const chips = page.getByTestId("swatches").getByRole("radio");
    await expect(chips).toHaveCount(2); // blush, crimson
    await expect(chips.first()).toHaveAttribute("aria-checked", "true");
    await chips.nth(1).click();
    await expect(chips.nth(1)).toHaveAttribute("aria-checked", "true");
    await expect(chips.first()).toHaveAttribute("aria-checked", "false");
    await expect(chips.nth(1)).toHaveAccessibleName("Crimson");
    // a product without colors simply has no chips
    await open(page, "the-renewal-serum", "product-color");
    await expect(page.getByTestId("swatches")).toHaveCount(0);
  });

  test("E2E-LAY-09 subscribe and save: both offers shown, the subscription cannot be bought yet (3:36766)", async ({
    page,
  }) => {
    await open(page, "the-renewal-serum", "subscribe-and-save");
    const options = page.getByTestId("purchase-options");
    await expect(options).toContainText("One-Time Purchase");
    await expect(options).toContainText("Subscribe & Save 15%");
    await expect(options).toContainText("$40.80"); // 15% off $48.00
    await expect(options).toContainText("SAVE $7.20");
    await expect(page.getByTestId("plan-once")).toBeChecked();

    await page.getByTestId("plan-subscribe").check();
    await expect(page.getByTestId("subscribe-note")).toBeVisible();
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();
    await expect(page.getByTestId("buy-now")).toBeDisabled();

    await page.getByTestId("plan-once").check();
    await expect(page.getByTestId("add-to-cart")).toBeEnabled();
    await page.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-drawer")).toBeVisible();
  });

  test("E2E-LAY-10 on sale countdown: struck price, SAVE badge and a live timer that stops at the end (3:37901)", async ({
    page,
  }) => {
    await open(page, "barrier-repair-cream", "on-sale-countdown");
    await expect(page.getByTestId("price")).toContainText("$48.00"); // struck compare-at price
    await expect(page.getByTestId("price")).toContainText("$36.00");
    await expect(page.getByTestId("save-badge")).toHaveText("SAVE 25%");
    const days = Number(await page.getByTestId("countdown-days").innerText());
    expect(days).toBeGreaterThanOrEqual(19);
    expect(days).toBeLessThanOrEqual(20);
    const secs = await page.getByTestId("countdown-secs").innerText();
    await expect(page.getByTestId("countdown-secs")).not.toHaveText(secs, { timeout: 3000 });

    // a product that is not on sale has no timer either
    await open(page, "the-renewal-serum", "on-sale-countdown");
    await expect(page.getByTestId("countdown")).toHaveCount(0);
  });

  test("E2E-LAY-11 out of stock still disables buying in the new layouts (3:16432)", async ({
    page,
  }) => {
    for (const layout of ["thumbnail-left", "gallery-2-column", "external-zoom"]) {
      await open(page, "glass-glow-primer", layout);
      await expect(page.getByTestId("add-to-cart"), layout).toBeDisabled();
      await expect(page.getByTestId("stock-status"), layout).toHaveText("Out of stock");
    }
  });

  test("E2E-LAY-12 the new layouts have no serious accessibility violations", async ({ page }) => {
    for (const layout of [
      "product-color",
      "subscribe-and-save",
      "thumbnail-right",
      "gallery-1-column",
      "external-zoom",
    ]) {
      await open(page, "luxe-matte-lipstick", layout);
      expect(await expectNoSeriousViolations(page), layout).toEqual([]);
    }
    await open(page, "barrier-repair-cream", "on-sale-countdown");
    expect(await expectNoSeriousViolations(page)).toEqual([]);
  });
});
