import { expect, test } from "@playwright/test";
import { site } from "../../../src/config/site";

// TF4-T07 / T08: metadata, robots.txt, sitemap.xml, the share image and iframe embedding (the live preview on
// ThemeForest shows the demo inside a frame).
const KEY_PAGES = [
  "/",
  "/shop",
  "/product/the-renewal-serum",
  "/blog",
  "/blog/inside-the-formula-behind-beautiful-skin",
  "/about",
  "/contact",
  "/faqs",
  "/store-locator",
  "/policy/privacy",
  "/categories",
  "/track-order",
];

test.describe("Search engine and sharing metadata", () => {
  test("E2E-SEO-01 every key page has its own title and description, a canonical address and share tags", async ({
    page,
  }) => {
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();
    for (const route of [
      ...KEY_PAGES,
      "/shop?category=moisturizers",
      "/policy/shipping",
      "/demos",
    ]) {
      await page.goto(route);
      const title = await page.title();
      expect(title.length, route).toBeGreaterThan(5);
      expect(
        titles.get(title),
        `${route} repeats the title of ${titles.get(title)}`,
      ).toBeUndefined();
      titles.set(title, route);

      const description =
        (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
      expect(description.length, `${route} description`).toBeGreaterThanOrEqual(20);
      expect(
        description.length,
        `${route} description is too long for a snippet`,
      ).toBeLessThanOrEqual(170);
      expect(
        descriptions.get(description),
        `${route} repeats the description of ${descriptions.get(description)}`,
      ).toBeUndefined();
      descriptions.set(description, route);

      // the canonical address is absolute (built from site.url) and names this page without view parameters
      const canonical = new URL(route, site.url);
      if (!route.startsWith("/shop?category=")) canonical.search = "";
      // the Home address has no trailing slash in the tag
      const expected = route === "/" ? site.url : canonical.href;
      await expect(page.locator('link[rel="canonical"]'), route).toHaveAttribute("href", expected);
      await expect(page.locator('meta[property="og:title"]'), route).toHaveAttribute(
        "content",
        title,
      );
      await expect(page.locator('meta[property="og:description"]'), route).toHaveAttribute(
        "content",
        description,
      );
      await expect(page.locator('meta[property="og:url"]'), route).toHaveAttribute(
        "content",
        expected,
      );
      await expect(page.locator('meta[property="og:image"]'), route).toHaveAttribute(
        "content",
        new RegExp(`^${site.url}/opengraph-image`),
      );
      await expect(page.locator('meta[name="twitter:card"]'), route).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      await expect(page.locator('meta[name="robots"]'), `${route} must be indexable`).toHaveCount(
        0,
      );
    }
  });

  test("E2E-SEO-07 filters, sorting and layouts do not create new pages: they point back to the page", async ({
    page,
  }) => {
    for (const [route, canonical] of [
      ["/shop?layout=right&sort=price-asc", "/shop"],
      ["/shop?category=moisturizers&availability=in-stock", "/shop?category=moisturizers"],
      ["/product/the-renewal-serum?layout=inner-zoom&sticky=1", "/product/the-renewal-serum"],
    ] as const) {
      await page.goto(route);
      await expect(page.locator('link[rel="canonical"]'), route).toHaveAttribute(
        "href",
        new URL(canonical, site.url).href,
      );
    }
  });

  test("E2E-SEO-08 personal and working pages ask not to be listed", async ({ request }) => {
    // read from the served HTML: the account pages send a signed-out browser on to the login page at once
    for (const route of [
      "/cart",
      "/checkout",
      "/account",
      "/account/orders",
      "/login",
      "/register",
      "/forgot-password",
      "/wishlist",
      "/compare",
      "/search",
      "/ui-kit",
    ]) {
      const html = await (await request.get(route)).text();
      expect(html, route).toMatch(/<meta name="robots" content="[^"]*noindex/);
    }
  });

  test("E2E-SEO-02 robots.txt hides the personal pages and points to the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toMatch(/Disallow: \/checkout/);
    expect(text).toMatch(/Disallow: \/account/);
    expect(text).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  test("E2E-SEO-03 sitemap.xml lists pages, every product and every post", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(locations.length).toBeGreaterThan(40);
    expect(new Set(locations).size).toBe(locations.length);
    expect(locations.some((l) => l.endsWith("/product/the-renewal-serum"))).toBe(true);
    expect(
      locations.some((l) => l.endsWith("/blog/inside-the-formula-behind-beautiful-skin")),
    ).toBe(true);
    expect(
      locations.some((l) => /\/(checkout|account|cart|login|register)/.test(l)),
      "pages that ask not to be listed stay out of the sitemap",
    ).toBe(false);
    expect(locations.every((l) => l.startsWith(site.url))).toBe(true);
    // every listed address on this site answers (not only the first ones)
    for (const location of locations) {
      const path = new URL(location).pathname + new URL(location).search;
      const status = (await request.get(path)).status();
      expect(status, path).toBe(200);
    }
  });

  test("E2E-SEO-04 the share image and the icon are served", async ({ request }) => {
    const og = await request.get("/opengraph-image");
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
    const icon = await request.get("/icon.svg");
    expect(icon.status()).toBe(200);
  });
});

test.describe("Embedding", () => {
  test("E2E-SEO-05 no page forbids being shown in a frame", async ({ request }) => {
    for (const route of ["/", "/shop", "/demos", "/product/the-renewal-serum"]) {
      const headers = (await request.get(route)).headers();
      expect(headers["x-frame-options"], route).toBeUndefined();
      expect(headers["content-security-policy"] ?? "", route).not.toMatch(/frame-ancestors/);
    }
  });

  test("E2E-SEO-06 the demo hub renders inside an iframe", async ({ page, baseURL }) => {
    await page.setContent(
      `<iframe id="preview" src="${baseURL}/demos" width="1280" height="800"></iframe>`,
    );
    const frame = page.frameLocator("#preview");
    await expect(frame.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(frame.getByRole("link", { name: /shop/i }).first()).toBeVisible();
  });
});
