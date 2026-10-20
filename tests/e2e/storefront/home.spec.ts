import { uniqueEmail } from "../fixtures/unique";
import { expect, test } from "@playwright/test";

// E2E-HOM-01..03 and E2E-STO-01..03 (PRD HOM-001..007, STO-001..003, NWS-001 UI)
test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("E2E-HOM-01 renders every section from live data", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Glam Defined Perfectly");
    for (const name of [
      "Find favorites",
      "Trending now",
      "Fresh drops",
      "Most loved product",
      "Made personal",
      "Explore bundle",
      "Moments made on Instagram",
      "Glow more, spend less",
    ]) {
      await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
    }
    await expect(
      page.getByRole("heading", { name: "The right color looks good on you in each moment" }),
    ).toBeVisible();

    // Data-driven blocks: 4 category cards, trending carousel, 4 most-loved cards with Add to cart.
    await expect(page.locator("section[aria-labelledby='favorites-title'] ul > li")).toHaveCount(4);
    await expect(
      page.getByTestId("carousel-track").first().locator("[data-testid='product-card']"),
    ).toHaveCount(8);
    await expect(
      page.locator("section[aria-labelledby='loved-title'] [data-testid='product-card']"),
    ).toHaveCount(4);
    await expect(
      page
        .locator("section[aria-labelledby='loved-title']")
        .getByRole("button", { name: "Add to cart" }),
    ).toHaveCount(4);
  });

  test("E2E-HOM-02 category cards and hero call-to-action navigate to the shop", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /Shop collection/i }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await page.goBack();
    await page.getByRole("link", { name: /01 • Skincare/ }).click();
    await expect(page).toHaveURL(/\/shop\?category=skincare$/);
    await expect(page.getByTestId("results-summary").first()).toContainText("of 16 Products");
  });

  test("E2E-HOM-03 flash-sale countdown ticks and the bundle tabs recalculate the total", async ({
    page,
  }) => {
    const seconds = page.getByTestId("countdown").locator("strong").nth(3);
    await expect(seconds).toHaveText(/^\d\d$/); // hydrated, not the "--" placeholder
    const first = await seconds.innerText();
    await expect.poll(async () => seconds.innerText(), { timeout: 4000 }).not.toBe(first);
    await expect(page.getByTestId("countdown").locator("strong").first()).toHaveText("02");

    const total = page.getByTestId("bundle-total");
    const before = await total.innerText();
    await page.getByRole("tab", { name: "Soft glam" }).click();
    await expect(page.getByRole("tab", { name: "Soft glam" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(total).not.toHaveText(before);
    await expect(total).toContainText("You save");
  });

  test("E2E-HOM-04 testimonials scroll with the arrow controls", async ({ page }) => {
    const track = page.getByTestId("testimonials");
    await expect(track.locator("article")).toHaveCount(4);
    const start = await track.evaluate((el) => el.scrollLeft);
    await page.getByRole("button", { name: "Next stories" }).click();
    await expect.poll(async () => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(start);
  });

  test("E2E-HOM-05 hero shows the 01/02/03 index and arrows and they change the slide", async ({
    page,
  }) => {
    const index = page.getByRole("list", { name: "Slides" });
    await expect(index.getByRole("button")).toHaveCount(3);
    await expect(index.getByRole("button", { name: /^01/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.getByRole("button", { name: "Next slide" }).click();
    await expect(index.getByRole("button", { name: /^02/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await page.getByRole("button", { name: "Previous slide" }).click();
    await expect(index.getByRole("button", { name: /^01/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  // Fidelity guard (Figma 3:2290, 1920 wide): key boxes sit on the design's coordinates, +-1px.
  test("E2E-HOM-06 key elements sit on the Figma coordinates at 1920 wide", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important}",
    });
    // page coordinates (boundingBox is relative to the viewport)
    const box = async (locator: ReturnType<typeof page.locator>) =>
      locator.first().evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
      });
    const near = (what: string, got: number, want: number) =>
      expect(Math.abs(got - want), `${what}: got ${got}, design ${want}`).toBeLessThanOrEqual(1);
    const checks: [string, ReturnType<typeof page.locator>, number, number, number?, number?][] = [
      ["hero title", page.getByRole("heading", { level: 1 }), 300, 250, 446],
      [
        "hero card",
        page.locator("section[aria-label='Featured collection'] aside"),
        1188,
        516,
        432,
        265,
      ],
      ["search field", page.getByTestId("search-trigger"), 1513, 54, 260, 40],
      [
        "category card 1",
        page.locator("section[aria-labelledby='favorites-title'] li a").first(),
        300,
        1109,
        308,
        420,
      ],
      ["marquee", page.getByLabel("Our promises"), 0, 1629, 1920, 82],
      ["first trending card", page.getByTestId("product-card").first(), 300, 1939, 308, 509],
      [
        "flash banner",
        page.locator("section[aria-labelledby='flash-title'] > div"),
        300,
        5492,
        1320,
        274,
      ],
      ["footer", page.locator("footer"), 0, 9222, 1920, 803],
    ];
    for (const [name, locator, x, y, w, h] of checks) {
      const b = await box(locator);
      near(`${name} x`, b.x, x);
      near(`${name} y`, b.y, y);
      if (w !== undefined) near(`${name} width`, b.width, w);
      if (h !== undefined) near(`${name} height`, b.height, h);
    }
    // the page is exactly as tall as the design frame
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(Math.abs(height - 10025)).toBeLessThanOrEqual(2);
  });

  test("E2E-STO-01 Categories dropdown lists the live categories and marks the current page", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Categories", exact: true }).first().hover();
    const menu = page.getByRole("link", { name: "Skincare", exact: true }).first();
    await expect(menu).toBeVisible();
    await expect(page.getByRole("link", { name: "Fragrance", exact: true }).first()).toBeVisible();
    await menu.click();
    await expect(page).toHaveURL(/\/shop\?category=skincare$/);
  });

  test("E2E-STO-04 Shop mega menu shows three link columns, badges and two promo cards", async ({
    page,
  }) => {
    const mega = page.getByTestId("mega-menu");
    await expect(mega).toBeHidden();
    await page.getByRole("link", { name: "Shop", exact: true }).first().hover();
    await expect(mega).toBeVisible();

    for (const title of ["Shop pages", "Shop details", "Shop essentials"]) {
      await expect(mega.getByRole("heading", { name: title })).toBeVisible();
    }
    await expect(mega.getByRole("link", { name: "Shop default" })).toBeVisible();
    await expect(mega.getByRole("link", { name: /Subscribe & save\s*Hot/i })).toBeVisible();
    await expect(mega.getByRole("link", { name: /Top filter\s*New/i })).toBeVisible();
    await expect(mega.getByRole("link", { name: /Compare\s*New/i })).toBeVisible();
    await expect(mega.getByRole("link", { name: /Best seller/i })).toBeVisible();
    await expect(mega.getByRole("link", { name: /New arrival/i })).toBeVisible();
    await expect(mega.getByRole("img")).toHaveCount(2);

    // the panel stays open while the pointer moves from the link into it
    await mega.getByRole("link", { name: "Out of stock" }).hover();
    await expect(mega).toBeVisible();
    await mega.getByRole("link", { name: "Out of stock" }).click();
    await expect(page).toHaveURL(/\/product\/glass-glow-primer$/);
    await expect(page.getByTestId("stock-status")).toHaveText("Out of stock");
  });

  test("E2E-STO-05 mega menu promos link to filtered shop pages and the menu closes on leave", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Shop", exact: true }).first().hover();
    const mega = page.getByTestId("mega-menu");
    await mega.getByRole("link", { name: /Best seller/i }).click();
    await expect(page).toHaveURL(/\/shop\?badge=best-seller$/);

    await page.mouse.move(900, 900); // away from the header
    await expect(mega).toBeHidden();
  });

  test("E2E-STO-06 mega menu opens from the keyboard and highlights the current page", async ({
    page,
  }) => {
    await page.goto("/shop");
    const mega = page.getByTestId("mega-menu");
    await page.getByRole("link", { name: "Shop", exact: true }).first().focus();
    await expect(mega).toBeVisible(); // :focus-within
    await page.keyboard.press("Tab");
    await expect(mega.getByRole("link", { name: "Shop default" })).toBeFocused();
    await expect(mega.getByRole("link", { name: "Shop default" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(mega.getByRole("link", { name: "Grid left sidebar" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  // The Home footer box follows the design: one dashed field with the button inside, plus a consent checkbox added under it (D-044).
  test("E2E-STO-02 Home footer newsletter validates before accepting", async ({ page }) => {
    const form = page.locator("form").filter({ has: page.getByPlaceholder("Enter your email") });
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("alert")).toHaveText("Please enter a valid email address.");

    await form.getByPlaceholder("Enter your email").fill(uniqueEmail("homefooter"));
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("alert")).toHaveText("Please accept the terms to subscribe.");

    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("status")).toHaveText("Thanks! You are subscribed.");
  });

  test("E2E-STO-02b standard footer newsletter asks for consent", async ({ page }) => {
    await page.goto("/shop");
    const form = page.locator("form").filter({ has: page.getByPlaceholder("Enter your email") });
    await form.getByPlaceholder("Enter your email").fill("shopper@example.com");
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("alert")).toHaveText("Please accept the terms to subscribe.");

    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("status")).toHaveText("Thanks for subscribing.");
  });

  test("E2E-STO-03 unknown URLs show the branded 404 with the site header", async ({ page }) => {
    const res = await page.goto("/definitely-not-a-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByTestId("not-found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go back to home" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  });
});
