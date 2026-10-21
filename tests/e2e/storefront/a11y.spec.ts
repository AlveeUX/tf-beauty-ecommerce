import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "../fixtures/axe";
import { addToCart } from "../fixtures/flows";

// E2E-A11Y-01: no critical/serious automated accessibility violations on the P4 routes.
// Automated checks catch only a subset of issues; keyboard and manual review are still required (strategy section 2).
const ROUTES = [
  "/",
  "/shop",
  "/shop?category=skincare&price=0-50",
  "/categories",
  "/product/the-renewal-serum",
  "/product/glass-glow-primer",
  "/search?q=serum",
  "/cart",
  "/wishlist",
  "/compare",
  "/login",
  "/register",
  "/forgot-password",
  "/track-order",
  "/policy/privacy",
  "/store-locator",
  "/shop?layout=list-left",
  "/shop?layout=top-filter",
  "/shop?layout=horizontal",
  "/blog",
  "/blog?layout=list",
  "/blog/inside-the-formula-behind-beautiful-skin",
  "/about",
  "/contact",
  "/faqs",
];

for (const route of ROUTES) {
  test(`E2E-A11Y-01 ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    expect(await expectNoSeriousViolations(page)).toEqual([]);
  });
}

test("E2E-A11Y-02 the search overlay is keyboard operable and labelled", async ({ page }) => {
  await page.goto("/shop");
  await page.getByTestId("search-trigger").focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Search" });
  await expect(dialog).toBeVisible();
  expect(await expectNoSeriousViolations(page, "dialog")).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("search-trigger")).toBeFocused(); // focus returns to the trigger
});

test("E2E-A11Y-03 the cart drawer is a labelled modal: focus moves in, Tab stays inside, Escape returns focus", async ({
  page,
  browserName,
}) => {
  // Playwright's WebKit follows Safari's default of Tab skipping links and buttons (Option+Tab reaches them), so a Tab walk proves nothing there
  test.skip(browserName === "webkit", "Tab does not reach links and buttons in WebKit by default");
  await page.goto("/shop");
  await page.getByTestId("cart-link").focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: /Your cart/i });
  await expect(drawer).toBeVisible();
  expect(await expectNoSeriousViolations(page, "[data-testid='cart-drawer']")).toEqual([]);
  await expect(drawer.getByRole("button", { name: "Close cart" })).toBeFocused();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByTestId("cart-link")).toBeFocused();
});

test("E2E-A11Y-04 the checkout form (with items in the cart) has no serious violations", async ({
  page,
}) => {
  await addToCart(page, "the-renewal-serum", 1);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  expect(await expectNoSeriousViolations(page)).toEqual([]);
  // and with errors showing: every message is announced next to its field
  await page.getByTestId("place-order").click();
  await expect(page.getByTestId("error-firstName")).toBeVisible();
  expect(await expectNoSeriousViolations(page)).toEqual([]);
});
