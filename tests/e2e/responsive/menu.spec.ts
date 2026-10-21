import { expect, test, type Page } from "@playwright/test";
import { JOURNAL_LINKS, PAGES_LINKS, SHOP_MEGA } from "../../../src/config/navigation";

// TF3-T04 (docs/responsive-spec.md 5.1 and 5.2): header row, announcement bar and the mobile menu drawer.
// Up to 1100 px only; above it the desktop menus are used and tested by the 1920 suite.
const widthOf = (page: Page) => page.viewportSize()!.width;
const PAGES_UNDER_TEST = ["/", "/about", "/shop", "/product/the-renewal-serum"];

const menu = (page: Page) => page.getByTestId("mobile-menu");

async function openMenu(page: Page) {
  await page.getByTestId("mobile-menu-button").click();
  await expect(menu(page)).toBeVisible();
}

test.describe("Header and mobile menu", () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) > 1100, "the menu drawer is for tablets and phones");
  });

  test("R-02 the header row fits: menu, logo and icons are visible, 44px, and do not overlap", async ({
    page,
  }) => {
    const problems: string[] = [];
    for (const route of PAGES_UNDER_TEST) {
      await page.goto(route, { waitUntil: "networkidle" });
      const boxes = await page.evaluate(() => {
        const rect = (el: Element | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right };
        };
        const header = document.querySelector("header")!;
        const items: Record<string, ReturnType<typeof rect>> = {
          menu: rect(header.querySelector('[data-testid="mobile-menu-button"]')),
          logo: rect(header.querySelector("a[aria-label$=', home']")),
          search: rect(header.querySelector('[data-testid="search-trigger"]')),
          cart: rect(header.querySelector('[data-testid="cart-link"]')),
        };
        return { items, vw: document.documentElement.clientWidth };
      });
      const { items, vw } = boxes;
      for (const [name, box] of Object.entries(items)) {
        if (!box) {
          problems.push(`${route}: ${name} missing`);
          continue;
        }
        if (box.right > vw + 0.5 || box.x < -0.5)
          problems.push(`${route}: ${name} outside the screen`);
        if (name !== "logo" && (box.w < 43.5 || box.h < 43.5)) {
          problems.push(`${route}: ${name} is ${Math.round(box.w)}x${Math.round(box.h)}`);
        }
      }
      const order = ["menu", "logo", "search", "cart"] as const;
      for (let i = 0; i < order.length - 1; i++) {
        const a = items[order[i]!];
        const b = items[order[i + 1]!];
        if (a && b && a.right > b.x + 0.5)
          problems.push(`${route}: ${order[i]} overlaps ${order[i + 1]}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("R-02 the announcement bar shows its whole message", async ({ page }) => {
    for (const route of ["/", "/shop"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      const clipped = await page.evaluate(() => {
        const bar = document.querySelector("header > div") as HTMLElement;
        const message = [...bar.querySelectorAll("p")].find((p) =>
          /shipping/i.test(p.textContent ?? ""),
        )!;
        const b = bar.getBoundingClientRect();
        const m = message.getBoundingClientRect();
        return {
          barBottom: b.bottom,
          textBottom: m.bottom,
          textRight: m.right,
          vw: document.documentElement.clientWidth,
        };
      });
      expect(clipped.textBottom, `${route} message below the bar`).toBeLessThanOrEqual(
        clipped.barBottom + 0.5,
      );
      expect(clipped.textRight, `${route} message past the screen`).toBeLessThanOrEqual(
        clipped.vw + 0.5,
      );
    }
  });

  test("R-02 the drawer reaches every entry of the desktop menus", async ({ page }) => {
    // opened from a page that does not itself scroll sideways, so the drawer is tested on its own
    await page.goto("/faqs", { waitUntil: "networkidle" });
    await openMenu(page);
    const hrefs = new Set(
      await menu(page)
        .locator("a[href]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? "")),
    );
    const expected = [
      ...SHOP_MEGA.columns.flatMap((c) => c.links.map((l) => l.href)),
      ...SHOP_MEGA.promos.map((p) => p.href),
      ...PAGES_LINKS.map((l) => l.href),
      ...JOURNAL_LINKS.map((l) => l.href),
      "/",
      "/about",
      "/shop",
      "/categories",
      "/account",
      "/login",
      "/wishlist",
      "/compare",
      "/track-order",
      "/store-locator",
    ];
    const missing = [...new Set(expected)].filter(
      (href) => href !== "/account" && href !== "/login" && !hrefs.has(href),
    );
    expect(missing).toEqual([]);
    expect([...hrefs].some((h) => h === "/account" || h === "/login")).toBe(true);
    // the categories accordion lists the real categories
    expect([...hrefs].filter((h) => h.startsWith("/shop?category=")).length).toBeGreaterThanOrEqual(
      5,
    );
    // the accordions are real disclosure widgets: one open at a time
    await menu(page).getByText("Shop", { exact: true }).click();
    await menu(page).getByText("Pages", { exact: true }).click();
    expect(await menu(page).locator("details[open]").count()).toBe(1);
  });

  test("R-02 opens and closes with the button, Escape, the scrim and a link, and returns focus", async ({
    page,
  }) => {
    // opened from a page that does not itself scroll sideways, so the drawer is tested on its own
    await page.goto("/faqs", { waitUntil: "networkidle" });
    const button = page.getByTestId("mobile-menu-button");
    await expect(button).toHaveAttribute("aria-expanded", "false");

    await openMenu(page);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(
      true,
    );
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(button).toBeFocused();

    await openMenu(page);
    await menu(page).getByRole("button", { name: "Close menu" }).click();
    await expect(menu(page)).toBeHidden();

    await openMenu(page);
    await page.mouse.click(widthOf(page) - 4, 300); // the dark area beside the panel
    await expect(menu(page)).toBeHidden();

    await openMenu(page);
    await menu(page).getByText("Pages", { exact: true }).click();
    await menu(page).getByRole("link", { name: "Contact us" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(menu(page)).toBeHidden();
  });

  test("R-05 keyboard focus stays inside the open menu", async ({ page, browserName }) => {
    test.skip(
      browserName === "webkit",
      "Tab does not reach links and buttons in WebKit by default",
    );
    // opened from a page that does not itself scroll sideways, so the drawer is tested on its own
    await page.goto("/faqs", { waitUntil: "networkidle" });
    await openMenu(page);
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')),
        `tab ${i}`,
      ).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(
        await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')),
        `shift-tab ${i}`,
      ).toBe(true);
    }
  });
});
