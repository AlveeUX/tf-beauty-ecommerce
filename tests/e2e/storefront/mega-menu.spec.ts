import { expect, test, type Page } from "@playwright/test";

// E2E-MEG-01..04: the Shop mega menu (Figma 3:1452). Every entry of the frame must open the right page, the
// open page's entry is highlighted, and the labels are the frame's own.
const COLUMNS = {
  "Shop pages": [
    "Shop default",
    "Grid left sidebar",
    "Grid right sidebar",
    "List left sidebar",
    "List right sidebar",
    "Load more",
    "Top filter",
    "Horizontal filter",
    "Filter drawer",
    "Grid 3 columns",
    "Grid 4 columns",
  ],
  "Shop details": [
    "Detail default",
    "Subscribe & save",
    "On sale countdown",
    "Thumbnail left",
    "Thumbnail right",
    "Gallery 1 column",
    "Gallery 2 column",
    "Out of stock",
    "Sticky add to card",
    "Inner zoom",
    "External zoom",
  ],
  "Shop essentials": [
    "Cart",
    "Wishlist",
    "Checkout",
    "My account",
    "Order track",
    "Compare",
    "Store locator",
    "Privacy policy",
  ],
} as const;

async function openMega(page: Page) {
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Shop", exact: true })
    .hover();
  const mega = page.getByTestId("mega-menu");
  await expect(mega).toBeVisible();
  return mega;
}

test.describe("Shop mega menu", () => {
  test("E2E-MEG-01 the three columns and two promo cards carry the frame's labels, badges and order", async ({
    page,
  }) => {
    await page.goto("/about");
    const mega = await openMega(page);
    for (const [title, labels] of Object.entries(COLUMNS)) {
      const column = mega.getByRole("navigation", { name: title });
      await expect(column.getByRole("heading", { name: title })).toBeVisible();
      const texts = (await column.getByRole("link").allInnerTexts()).map((t) =>
        t.trim().toLowerCase(),
      );
      // badges are part of the link text ("Subscribe & save HOT")
      expect(
        texts.map((t, i) => t.startsWith((labels[i] ?? "none").toLowerCase())),
        title,
      ).toEqual(labels.map(() => true));
      expect(texts).toHaveLength(labels.length);
    }
    const badge = (name: string, text: string) =>
      expect(
        mega.getByRole("link", { name }).getByText(new RegExp(`^${text}$`, "i")),
      ).toBeVisible();
    await badge("Top filter", "NEW");
    await badge("Subscribe & save", "HOT");
    await badge("Inner zoom", "HOT");
    await badge("Order track", "HOT");
    await badge("Compare", "NEW");
    await expect(mega.getByRole("link", { name: /Best seller/ })).toBeVisible();
    await expect(mega.getByRole("link", { name: /New arrival/ })).toBeVisible();
    // the Home header opens the same menu
    await page.goto("/");
    await expect(page.getByTestId("mega-menu")).toBeAttached();
  });

  test("E2E-MEG-02 every Shop pages and Shop details entry opens its own layout", async ({
    page,
  }) => {
    const shop: [string, string][] = [
      ["Shop default", "left"],
      ["Grid left sidebar", "left"],
      ["Grid right sidebar", "right"],
      ["List left sidebar", "list-left"],
      ["List right sidebar", "list-right"],
      ["Load more", "load-more"],
      ["Top filter", "top-filter"],
      ["Horizontal filter", "horizontal"],
      ["Filter drawer", "filter-drawer"],
      ["Grid 3 columns", "left"],
      ["Grid 4 columns", "top-filter"],
    ];
    for (const [label, layout] of shop) {
      await page.goto("/about");
      const mega = await openMega(page);
      await mega.getByRole("link", { name: new RegExp(`^${label}`) }).click();
      await expect(page, label).toHaveURL(/\/shop(\?|$)/);
      await expect(page.locator(`[data-layout='${layout}']`), label).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 }), label).toHaveText("Shop");
      await expect(page.getByTestId("product-card").first(), label).toBeVisible();
    }

    const details: [string, string][] = [
      ["Detail default", "details-default"],
      ["Subscribe & save", "subscribe-and-save"],
      ["On sale countdown", "on-sale-countdown"],
      ["Thumbnail left", "thumbnail-left"],
      ["Thumbnail right", "thumbnail-right"],
      ["Gallery 1 column", "gallery-1-column"],
      ["Gallery 2 column", "gallery-2-column"],
      ["Inner zoom", "inner-zoom"],
      ["External zoom", "external-zoom"],
    ];
    for (const [label, layout] of details) {
      await page.goto("/about");
      const mega = await openMega(page);
      await mega.getByRole("link", { name: new RegExp(`^${label}`) }).click();
      await expect(page, label).toHaveURL(/\/product\/the-renewal-serum/);
      await expect(page.locator(`section[data-layout='${layout}']`), label).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: "The renewal serum" }),
      ).toBeVisible();
    }

    await page.goto("/about");
    await (await openMega(page)).getByRole("link", { name: /^Out of stock/ }).click();
    await expect(page).toHaveURL(/\/product\/glass-glow-primer$/);
    await expect(page.getByTestId("stock-status")).toHaveText("Out of stock");
    await expect(page.getByTestId("add-to-cart")).toBeDisabled();

    await page.goto("/about");
    await (await openMega(page)).getByRole("link", { name: /^Sticky add to card/ }).click();
    await expect(page).toHaveURL(/\/product\/the-renewal-serum\?sticky=1$/);
    await expect(page.getByTestId("sticky-bar")).toBeAttached();
  });

  test("E2E-MEG-03 Shop essentials and the two promo cards lead to the right pages", async ({
    page,
  }) => {
    const essentials: [string, RegExp, RegExp][] = [
      ["Cart", /\/cart$/, /cart/i],
      ["Wishlist", /\/wishlist$/, /wishlist/i],
      ["Checkout", /\/checkout$/, /checkout|your cart is empty|nothing/i],
      ["My account", /\/login(\?|$)/, /account|login|sign in|welcome/i], // signed out: the account guard sends you to sign in
      ["Order track", /\/track-order$/, /track/i],
      ["Compare", /\/compare$/, /compare/i],
      ["Store locator", /\/store-locator$/, /store/i],
      ["Privacy policy", /\/policy\/privacy$/, /privacy/i],
    ];
    for (const [label, url, heading] of essentials) {
      await page.goto("/about");
      const mega = await openMega(page);
      await mega.getByRole("link", { name: new RegExp(`^${label}`) }).click();
      await expect(page, label).toHaveURL(url);
      await expect(page.getByRole("heading", { level: 1 }).first(), label).toContainText(heading);
      await expect(page.getByTestId("not-found"), label).toHaveCount(0);
    }

    await page.goto("/about");
    await (await openMega(page)).getByRole("link", { name: /Best seller/ }).click();
    await expect(page).toHaveURL(/\/shop\?badge=best-seller$/);
    await expect(page.getByTestId("product-card").first()).toBeVisible();
    await page.goto("/about");
    await (await openMega(page)).getByRole("link", { name: /New arrival/ }).click();
    await expect(page).toHaveURL(/\/shop\?badge=new$/);
    await expect(page.getByTestId("product-card").first()).toBeVisible();
  });

  test("E2E-MEG-04 the entry of the open page is highlighted, and only that one", async ({
    page,
  }) => {
    const current = async () => {
      const mega = await openMega(page);
      const links = mega.locator("a[aria-current='page']");
      return (await links.allInnerTexts()).map((t) =>
        t
          .replace(/\s+(HOT|NEW)$/i, "")
          .trim()
          .toLowerCase(),
      );
    };
    await page.goto("/shop");
    expect(await current()).toEqual(["shop default"]);
    await page.goto("/shop?layout=right");
    expect(await current()).toEqual(["grid right sidebar"]);
    await page.goto("/shop?layout=top-filter&availability=in-stock"); // filters do not matter
    expect(await current()).toEqual(["top filter"]);
    await page.goto("/product/the-renewal-serum");
    expect(await current()).toEqual(["detail default"]);
    await page.goto("/product/the-renewal-serum?layout=inner-zoom");
    expect(await current()).toEqual(["inner zoom"]);
    await page.goto("/product/the-renewal-serum?sticky=1");
    expect(await current()).toEqual(["sticky add to card"]);
    await page.goto("/product/glass-glow-primer");
    expect(await current()).toEqual(["out of stock"]);
    await page.goto("/compare");
    expect(await current()).toEqual(["compare"]);
    await page.goto("/about");
    expect(await current()).toEqual([]);
  });

  test("E2E-MEG-05 the sticky add-to-cart bar appears after the buy buttons scroll away and adds to the cart", async ({
    page,
  }) => {
    await page.goto("/product/the-renewal-serum?sticky=1");
    const bar = page.getByTestId("sticky-bar");
    await expect(bar).toBeHidden(); // the page's own buttons are in view
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(bar).toBeVisible();
    await expect(bar).toContainText("The renewal serum");
    await bar.getByTestId("sticky-add").click();
    await expect(page.getByTestId("cart-drawer")).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toBeHidden();
    // without ?sticky the bar is for phones only: it never shows on a desktop window
    await page.goto("/product/the-renewal-serum");
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.getByTestId("sticky-bar")).toBeHidden();
  });
});
