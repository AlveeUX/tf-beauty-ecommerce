import { expect, test, type Locator } from "@playwright/test";
import { expectNoSeriousViolations } from "../fixtures/axe";

// E2E-OVL-01..05 (PRD PRD-009, PRD-013..015, WSH-001): quick view, size guide, share and wishlist popups.
// Boxes are viewport coordinates at 1920 x 1080 (the popups are centred in the window).
async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("not visible");
  return {
    x: Math.round(b.x),
    y: Math.round(b.y),
    w: Math.round(b.width),
    h: Math.round(b.height),
  };
}

test.describe("Overlays", () => {
  test("E2E-OVL-01 quick view opens from a card, follows the frame and closes", async ({
    page,
  }) => {
    await page.goto("/shop");
    // the serum has several pictures, so the arrows show
    const card = page.getByTestId("product-card").filter({ hasText: "The renewal serum" }).first();
    const name = (await card.locator("h3").innerText()).trim();
    await card.hover();
    await card.getByTestId("card-quickview").click();
    const popup = page.getByTestId("quick-view");
    await expect(popup).toBeVisible();
    await expect(page).toHaveURL(/\/shop$/); // the page stays where it was
    await expect(popup.getByRole("heading", { name })).toBeVisible();
    expect(await box(popup)).toMatchObject({ x: 410, w: 1100, h: 641 });
    await expect(popup.getByTestId("qv-stock")).toHaveText("In Stock");
    await expect(popup.getByText("Verified")).toBeVisible();
    expect(await box(popup.getByTestId("qv-add"))).toMatchObject({ h: 52 });
    expect(await box(popup.getByTestId("qv-buy-now"))).toMatchObject({ w: 490, h: 52 });

    // image arrows cycle through the product's pictures
    const image = popup.locator("img").first();
    const first = await image.getAttribute("src");
    await popup.getByTestId("qv-next").click();
    await expect.poll(async () => image.getAttribute("src")).not.toBe(first);
    await popup.getByTestId("qv-prev").click();
    await expect.poll(async () => image.getAttribute("src")).toBe(first);

    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    // an unknown product does not break the page
    expect((await page.request.get("/api/products/quick?slug=nope")).status()).toBe(404);
  });

  test("E2E-OVL-02 quick view adds the chosen quantity to the cart, and Buy now goes to checkout", async ({
    page,
  }) => {
    await page.goto("/shop");
    await page
      .getByTestId("product-card")
      .first()
      .getByTestId("card-quickview")
      .click({ force: true });
    const popup = page.getByTestId("quick-view");
    await popup.getByRole("button", { name: "Increase quantity" }).click();
    await expect(popup.getByTestId("qv-quantity").locator("output")).toHaveText("02");
    await popup.getByTestId("qv-add").click();
    await expect(popup).toBeHidden();
    await expect(page.getByTestId("cart-drawer")).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
    await page.keyboard.press("Escape");

    await page
      .getByTestId("product-card")
      .nth(1)
      .getByTestId("card-quickview")
      .click({ force: true });
    await page.getByTestId("qv-buy-now").click();
    await expect(page).toHaveURL(/\/checkout$/);
    await page.goto("/shop");
    await page
      .getByTestId("product-card")
      .first()
      .getByTestId("card-quickview")
      .click({ force: true });
    await page.getByTestId("qv-details").click();
    await expect(page).toHaveURL(/\/product\//);
  });

  test("E2E-OVL-03 the size guide opens from the product page with the design's table", async ({
    page,
  }) => {
    await page.goto("/product/the-renewal-serum");
    // opened from the keyboard: Safari/WebKit does not focus a button on click, so the opener would be the page body
    await page.getByTestId("size-guide-link").focus();
    await page.keyboard.press("Enter");
    const popup = page.getByTestId("size-guide");
    await expect(popup).toBeVisible();
    expect(await box(popup)).toMatchObject({ x: 588, w: 744, h: 445 });
    await expect(popup.getByRole("heading", { name: "Cosmia size guide" })).toBeVisible();
    const rows = popup.locator("tbody tr");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(2)).toContainText("Standard");
    await expect(rows.nth(2)).toContainText("30–100 ml / 8–10 g");
    await expect(rows.nth(2)).toContainText("Everyday use");
    expect(await box(popup.locator("table"))).toMatchObject({ x: 618, w: 684 });
    await expect(popup).toContainText("All measurements in ml / g.");
    await popup.getByRole("button", { name: "Close" }).click();
    await expect(popup).toBeHidden();
    await expect(page.getByTestId("size-guide-link")).toBeFocused(); // focus returns to the opener
  });

  test("E2E-OVL-04 the share popup shows the product, the platforms and the address, and copies it", async ({
    page,
    context,
    browserName,
  }) => {
    // only Chromium lets a test read the clipboard; the other engines still show the "Link copied" status below
    if (browserName === "chromium")
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/product/the-renewal-serum");
    await page.getByTestId("share").click();
    const popup = page.getByTestId("share-modal");
    await expect(popup).toBeVisible();
    expect(await box(popup)).toMatchObject({ x: 689, w: 543, h: 474 });
    await expect(popup.getByRole("heading", { name: "Share this product" })).toBeVisible();
    await expect(popup.getByText("The renewal serum", { exact: true })).toBeVisible();
    await expect(popup.getByTestId("share-url")).toHaveValue(/\/product\/the-renewal-serum$/);
    for (const [id, host] of [
      ["share-facebook", "facebook.com"],
      ["share-x", "twitter.com"],
      ["share-pinterest", "pinterest.com"],
    ] as const) {
      const link = popup.getByTestId(id);
      await expect(link).toHaveAttribute("href", new RegExp(host));
      await expect(link).toHaveAttribute("href", /the-renewal-serum/);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
    // Instagram has no web share address: it copies the link instead
    await popup.getByTestId("share-instagram").click();
    if (browserName === "chromium")
      expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
        /\/product\/the-renewal-serum$/,
      );
    await expect(popup.getByRole("status")).toContainText("Link copied");
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
  });

  test("E2E-OVL-05 the wishlist popup lists what was added, can add to cart and remove", async ({
    page,
  }) => {
    await page.goto("/shop");
    const cards = page.getByTestId("product-card");
    await cards.nth(0).getByTestId("card-wishlist").click({ force: true });
    const popup = page.getByTestId("wishlist-modal");
    await expect(popup.getByRole("heading", { name: "Your wishlist (1)" })).toBeVisible();
    await popup.getByRole("button", { name: "Continue shopping" }).click();
    await cards.nth(1).getByTestId("card-wishlist").click({ force: true });
    await expect(popup.getByRole("heading", { name: "Your wishlist (2)" })).toBeVisible();
    expect(await box(popup)).toMatchObject({ x: 689, w: 543, h: 486 });
    expect(await box(popup.getByRole("button", { name: "Add to cart" }).first())).toMatchObject({
      w: 121,
      h: 41,
    });
    expect(await box(popup.getByRole("link", { name: "View wishlist page" }))).toMatchObject({
      w: 231,
      h: 52,
    });
    await expect(popup.getByText("In Stock")).toHaveCount(2);
    await expect(popup.getByRole("link", { name: "View wishlist page" })).toBeVisible();

    await popup
      .getByRole("button", { name: /^Remove .* from wishlist$/ })
      .first()
      .click();
    await expect(popup.getByRole("heading", { name: "Your wishlist (1)" })).toBeVisible();
    await popup.getByRole("button", { name: "Add to cart" }).click();
    await expect(popup).toBeHidden();
    await expect(page.getByTestId("cart-drawer")).toBeVisible();
  });

  test("E2E-OVL-06 the four popups have no serious accessibility violations and are labelled dialogs", async ({
    page,
  }) => {
    await page.goto("/shop");
    await page
      .getByTestId("product-card")
      .first()
      .getByTestId("card-quickview")
      .click({ force: true });
    await page.getByTestId("qv-add").waitFor();
    await expect(page.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(await expectNoSeriousViolations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await page
      .getByTestId("product-card")
      .first()
      .getByTestId("card-wishlist")
      .click({ force: true });
    await expect(page.getByTestId("wishlist-modal")).toBeVisible();
    expect(await expectNoSeriousViolations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await page.goto("/product/the-renewal-serum");
    await page.getByTestId("size-guide-link").click();
    await expect(page.getByRole("dialog", { name: "Cosmia size guide" })).toBeVisible();
    expect(await expectNoSeriousViolations(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByTestId("share").click();
    await expect(page.getByRole("dialog", { name: "Share this product" })).toBeVisible();
    expect(await expectNoSeriousViolations(page)).toEqual([]);
  });
});
