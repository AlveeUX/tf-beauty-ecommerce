import { expect, test, type Page } from "@playwright/test";

// E2E-CRT-01..05 (PRD CRT-001..005). Each test gets a fresh browser context, so the cart starts empty.
const drawer = (page: Page) => page.getByTestId("cart-drawer");
const addSerum = async (page: Page) => {
  await page.goto("/product/the-renewal-serum");
  await page.getByTestId("add-to-cart").click();
  await expect(drawer(page)).toBeVisible();
};

test.describe("Cart", () => {
  test("E2E-CRT-01 add to cart opens the drawer with the line, subtotal and header count", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("cart-count")).toHaveCount(0);

    await addSerum(page);
    await expect(drawer(page).getByRole("heading", { name: "Your cart (1)" })).toBeVisible();
    await expect(drawer(page).getByTestId("cart-lines").getByRole("listitem")).toHaveCount(1);
    await expect(drawer(page).getByText("The renewal serum")).toBeVisible();
    await expect(drawer(page).getByTestId("drawer-subtotal")).toHaveText("$48");
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    // quantity inside the drawer recalculates the subtotal
    await drawer(page)
      .getByRole("button", { name: /Increase quantity/ })
      .click();
    await expect(drawer(page).getByTestId("drawer-subtotal")).toHaveText("$96");
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    // Escape closes, focus returns to the page
    await page.keyboard.press("Escape");
    await expect(drawer(page)).toBeHidden();
  });

  test("E2E-CRT-02 the free-shipping bar follows the subtotal and unlocks at the threshold", async ({
    page,
  }) => {
    await addSerum(page);
    await expect(drawer(page).getByTestId("shipping-bar")).toContainText("$52.00");
    await drawer(page)
      .getByRole("button", { name: /Increase quantity/ })
      .click();
    await drawer(page)
      .getByRole("button", { name: /Increase quantity/ })
      .click();
    await expect(drawer(page).getByTestId("shipping-bar")).toContainText("unlocked free shipping");
  });

  test("E2E-CRT-03 cart page: totals, quantity, remove with undo, remove all and the empty state", async ({
    page,
  }) => {
    await addSerum(page);
    await drawer(page).getByRole("link", { name: "View Cart" }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cart");

    const rows = page.getByTestId("cart-row");
    await expect(rows).toHaveCount(1);
    await expect(page.getByTestId("cart-total")).toHaveText("$48.00");
    await rows.getByRole("button", { name: /Increase quantity/ }).click();
    await expect(rows.getByTestId("line-subtotal")).toHaveText("$96");
    await expect(page.getByTestId("cart-total")).toHaveText("$96.00");

    await rows.getByRole("button", { name: /Remove The renewal serum/ }).click();
    await expect(page.getByTestId("cart-empty-page")).toBeVisible();
    await expect(page.getByTestId("undo-bar")).toContainText("removed from cart");
    await page.getByTestId("undo-bar").getByRole("button", { name: "Undo?" }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.getByTestId("qty").locator("output")).toHaveText("02");

    await page.getByRole("button", { name: "Remove all" }).click();
    await expect(page.getByTestId("cart-empty-page")).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue shopping" })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  test("E2E-CRT-04 the cart survives a reload and is the same on every page (CRT-004)", async ({
    page,
  }) => {
    await addSerum(page);
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await page.goto("/shop");
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await page.goto("/cart");
    await expect(page.getByTestId("cart-row")).toHaveCount(1);
  });

  test("E2E-CRT-05 stock is enforced (CRT-005)", async ({ page }) => {
    await page.goto("/");
    // the catalog the cart reads from: sold out is reported as 0 available, unknown products are left out
    const sold = await page.request.get("/api/variants?slug=glass-glow-primer");
    expect((await sold.json()).lines[0]).toMatchObject({ slug: "glass-glow-primer", available: 0 });
    const missing = await page.request.get("/api/variants?slug=no-such-product");
    expect((await missing.json()).lines).toEqual([]);
    expect((await page.request.get("/api/variants?variant=abc")).status()).toBe(400);
    expect((await page.request.get("/api/variants")).status()).toBe(400);

    // the product page does not offer a sold-out variant for purchase, and nothing was added
    await page.goto("/product/glass-glow-primer");
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();
    await expect(page.getByTestId("cart-count")).toHaveCount(0);
  });

  test("E2E-CRT-05b quantity above the stock limit is refused (stepper stops, Add shows a message)", async ({
    page,
  }) => {
    // stock for one product is lowered to 2 in the catalog responses
    await page.route("**/api/variants?*", async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { lines: { slug: string; available: number }[] };
      for (const line of body.lines) if (line.slug === "the-renewal-serum") line.available = 2;
      await route.fulfill({ response, json: body });
    });
    await addSerum(page); // 1 of 2
    await page.keyboard.press("Escape");
    await page.getByTestId("add-to-cart").click(); // 2 of 2
    await expect(page.getByTestId("cart-count")).toHaveText("2");
    await expect(drawer(page).getByRole("button", { name: /Increase quantity/ })).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.getByTestId("add-to-cart").click(); // over the limit
    await expect(page.getByText("Only 2 left in stock.")).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
  });

  test("E2E-CRT-06 quick add on a product card and the Home Add to cart button", async ({
    page,
  }) => {
    await page.goto("/shop");
    await page
      .getByTestId("product-card")
      .first()
      .getByRole("button", { name: /^Add .* to cart$/ })
      .click({ force: true });
    await expect(drawer(page)).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await page.keyboard.press("Escape");

    await page.goto("/");
    await page
      .locator("section[aria-labelledby='loved-title']")
      .getByRole("button", { name: "Add to cart" })
      .first()
      .click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");
  });

  test("E2E-CRT-08 Buy now puts the product in the cart and opens checkout", async ({ page }) => {
    await page.goto("/product/the-renewal-serum");
    await page.getByTestId("buy-now").click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByTestId("checkout-lines").getByRole("listitem")).toHaveCount(1);
  });

  test("E2E-CRT-07 an empty cart drawer shows the empty state and Continue shopping", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("cart-link").click();
    await expect(drawer(page).getByTestId("cart-empty")).toBeVisible();
    await expect(drawer(page).getByText("Your beauty bag Is empty")).toBeVisible();
    await drawer(page).getByRole("link", { name: "Continue shopping" }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });
});
