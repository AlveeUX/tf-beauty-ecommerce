import { expect, test } from "@playwright/test";

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
  test("E2E-SEO-01 every key page has its own title, a description and share tags", async ({
    page,
  }) => {
    const titles = new Map<string, string>();
    for (const route of KEY_PAGES) {
      await page.goto(route);
      const title = await page.title();
      expect(title.length, route).toBeGreaterThan(5);
      expect(
        titles.get(title),
        `${route} repeats the title of ${titles.get(title)}`,
      ).toBeUndefined();
      titles.set(title, route);
      await expect(page.locator('meta[name="description"]'), route).toHaveAttribute(
        "content",
        /.{20,}/,
      );
      await expect(page.locator('meta[property="og:title"]'), route).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]'), route).toHaveCount(1);
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
    expect(locations.some((l) => l.includes("/checkout") || l.includes("/account"))).toBe(false);
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
