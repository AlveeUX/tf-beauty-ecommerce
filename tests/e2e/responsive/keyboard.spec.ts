import { expect, test, type Page } from "@playwright/test";
import { addToCart } from "../fixtures/flows";

// TF3-T11 (docs/responsive-spec.md 8, R-05): every overlay of the phone and tablet layouts keeps focus inside
// while it is open, closes with Escape and gives focus back to the control that opened it.
const widthOf = (page: Page) => page.viewportSize()!.width;

async function focusStaysInside(page: Page, overlay: string) {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(
      (selector) => !!document.activeElement?.closest(selector),
      overlay,
    );
    expect(inside, `Tab ${i + 1} left ${overlay}`).toBe(true);
  }
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate((s) => !!document.activeElement?.closest(s), overlay)).toBe(true);
  }
}

test.describe("Keyboard use of the overlays", () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) > 1100, "tablets and phones");
  });

  test("R-05 the filter sheet traps focus, closes with Escape and returns focus to the Filter button", async ({
    page,
  }) => {
    await page.goto("/shop", { waitUntil: "networkidle" });
    const opener = page.getByTestId("filter-sheet-button");
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Filter" })).toBeVisible();
    await focusStaysInside(page, "[role=dialog]");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Filter" })).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("R-05 the cart drawer traps focus, closes with Escape and returns focus to the cart link", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "webkit",
      "Tab does not reach links and buttons in WebKit by default",
    );
    await addToCart(page, "the-renewal-serum", 1);
    await page.goto("/shop", { waitUntil: "networkidle" });
    const opener = page.getByTestId("cart-link");
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("cart-drawer")).toBeVisible();
    await focusStaysInside(page, "[data-testid=cart-drawer]");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("cart-drawer")).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("R-05 the size guide dialog traps focus and returns focus to its link", async ({ page }) => {
    await page.goto("/product/the-renewal-serum", { waitUntil: "networkidle" });
    const opener = page.getByTestId("size-guide-link");
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible();
    await focusStaysInside(page, "[role=dialog]");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("R-05 reduced motion: the drawers and sheets appear without animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/shop", { waitUntil: "networkidle" });
    await page.getByTestId("filter-sheet-button").click();
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll("[role=dialog], [role=dialog] *")]
        .slice(0, 20)
        .map((el) => getComputedStyle(el).animationName)
        .filter((name) => name !== "none"),
    );
    expect(durations).toEqual([]);
  });
});
