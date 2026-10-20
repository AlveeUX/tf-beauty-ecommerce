import { expect, test, type Page } from "@playwright/test";
import { uniqueEmail } from "../fixtures/unique";
import { addToCart, fillBilling, PASSWORD, register, storedOrders } from "../fixtures/flows";

// TF3-T09 (docs/responsive-spec.md 6.4): cart, checkout, wishlist and account at tablet and phone widths,
// with real content (the empty states are covered by the route audit in layout.spec.ts).
const widthOf = (page: Page) => page.viewportSize()!.width;
/** How far the page scrolls sideways; when it does, the message names the widest elements to look at. */
const sideways = (page: Page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const over = document.documentElement.scrollWidth - vw;
    if (over <= 0) return 0;
    const names = [...document.body.querySelectorAll("*")]
      .filter(
        (el) =>
          el.getBoundingClientRect().right > vw + 1 && getComputedStyle(el).position !== "fixed",
      )
      .slice(0, 5)
      .map((el) => `${el.tagName}.${String(el.className).split(" ")[0]}`);
    throw new Error(`page is ${over}px wider than the screen: ${names.join(", ")}`);
  });

test.describe("Cart, checkout and account with content", () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) > 1100, "tablets and phones");
  });

  test("R-01 cart and checkout with items do not scroll sideways and their controls are 44px", async ({
    page,
  }) => {
    await addToCart(page, "the-renewal-serum", 2);
    for (const route of ["/cart", "/checkout"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      expect(await sideways(page), route).toBeLessThanOrEqual(0);
    }
    await page.goto("/cart", { waitUntil: "networkidle" });
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll("main a, main button, main input")) {
        const r = el.getBoundingClientRect();
        if (
          r.width &&
          r.height &&
          (r.height < 43.5 || r.width < 43.5) &&
          !el.closest("p, li > a")
        ) {
          out.push(
            `${el.tagName} ${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20)} ${Math.round(r.width)}x${Math.round(r.height)}`,
          );
        }
      }
      return out;
    });
    expect(small).toEqual([]);
  });

  test("R-02 a phone shopper can change a quantity in the cart, check out and place the order", async ({
    page,
  }) => {
    const email = uniqueEmail("phone");
    await addToCart(page, "the-renewal-serum", 1);
    await page.goto("/cart", { waitUntil: "networkidle" });
    await expect(page.getByTestId("cart-row")).toHaveCount(1);
    await page
      .getByRole("button", { name: /Increase|\+/ })
      .first()
      .click();
    await expect(page.getByTestId("line-subtotal")).toHaveText(/^\$96(\.00)?$/);
    await page.getByRole("link", { name: /Proceed to checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await fillBilling(page, email);
    await page.getByTestId("check-acceptTerms").check();
    await page.getByTestId("place-order").click();
    await expect(page).toHaveURL(/\/checkout\/confirmation\/CSM-[A-Z0-9]{8}$/);
    expect(await storedOrders(page)).toHaveLength(1);
    expect(await sideways(page)).toBeLessThanOrEqual(0);
  });

  test("R-02 account pages show the menu as a row of tabs and fit the screen", async ({ page }) => {
    const email = uniqueEmail("acct");
    await register(page, email.split("@")[0]!, email, PASSWORD);
    for (const route of ["/account", "/account/orders", "/account/addresses"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      expect(await sideways(page), route).toBeLessThanOrEqual(0);
      const tabs = await page
        .locator("nav[aria-label='Account'] a")
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
      expect(new Set(tabs).size, `${route} tabs share one row: ${tabs.join(",")}`).toBe(1);
    }
  });
});
