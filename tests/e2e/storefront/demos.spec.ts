import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousViolations } from "../fixtures/axe";
import { addToCart } from "../fixtures/flows";

// E2E-DEMO-01..05 (TF2): the demo hub, the link crawl, the UI kit, the error screen and the shared copy.
const GROUP_COUNTS: Record<string, number> = {
  shop: 10,
  product: 12,
  blog: 6,
  shopping: 7,
  account: 4,
  content: 9,
  tools: 1,
};

test.describe("Demo hub", () => {
  test("E2E-DEMO-01 the hub lists every variant and each link opens the layout it names", async ({
    page,
  }) => {
    await page.goto("/demos");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Demos");
    for (const [id, count] of Object.entries(GROUP_COUNTS)) {
      await expect(page.locator(`#demos-${id}`), id).toContainText(`(${count})`);
    }
    const links = await page
      .getByTestId("demo-link")
      .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute("href") ?? ""));
    expect(links).toHaveLength(Object.values(GROUP_COUNTS).reduce((a, b) => a + b, 0));

    // every shop, product and blog layout link lands on a page that reports that layout
    const variants = links.filter((href) => /[?&]layout=/.test(href));
    expect(variants).toHaveLength(10 + 10 + 5);
    for (const href of variants) {
      const layout = new URL(href, "http://x").searchParams.get("layout")!;
      await page.goto(href);
      await expect(page.locator(`[data-layout="${layout}"]`).first(), href).toBeVisible();
    }
  });

  test("E2E-DEMO-02 a crawl of the hub, menus and footers finds no dead or placeholder link", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const start = [
      "/demos",
      "/",
      "/shop",
      "/product/the-renewal-serum",
      "/blog",
      `/blog/inside-the-formula-behind-beautiful-skin`,
      "/about",
      "/cart",
      "/checkout",
      "/login",
      "/wishlist",
      "/ui-kit",
    ];
    const internal = new Set<string>();
    const external = new Set<string>();
    const problems: string[] = [];

    const collect = async (path: string) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const anchors = await page.locator("a[href]").evaluateAll((els) =>
        els.map((el) => {
          const a = el as HTMLAnchorElement;
          return {
            href: a.getAttribute("href") ?? "",
            target: a.target,
            rel: a.rel,
          };
        }),
      );
      for (const { href, target, rel } of anchors) {
        if (href === "#") problems.push(`${path}: placeholder link href="#"`);
        if (/^(mailto:|tel:|#)/.test(href)) continue;
        if (/^https?:\/\//.test(href)) {
          const url = new URL(href);
          if (url.origin === new URL(page.url()).origin) internal.add(url.pathname + url.search);
          else {
            external.add(href);
            if (target === "_blank" && !/noopener/.test(rel)) {
              problems.push(`${path}: ${href} opens a new tab without rel="noopener"`);
            }
          }
          continue;
        }
        internal.add(href.split("#")[0] || path);
      }
    };

    for (const path of start) await collect(path);
    // links found on the pages above are followed once more, one level deep, for the content pages they lead to
    const firstLevel = [...internal].filter((p) => !start.includes(p) && !p.startsWith("/api/"));
    expect(firstLevel.length).toBeGreaterThan(40);

    const expectedMissing = new Set(["/this-page-does-not-exist"]);
    for (const path of [...internal, ...start]) {
      const response = await page.request.get(path);
      const want = expectedMissing.has(path) ? 404 : 200;
      if (response.status() !== want)
        problems.push(`${path}: HTTP ${response.status()}, wanted ${want}`);
    }
    test.info().annotations.push({
      type: "crawl",
      description: `${internal.size + start.length} internal and ${external.size} external links checked`,
    });
    expect(problems).toEqual([]);
    expect(external.size).toBeGreaterThan(0);
    for (const url of external) expect(url, "external links use https").toMatch(/^https:\/\//);
  });
});

test.describe("UI kit and states", () => {
  test("E2E-DEMO-03 the UI kit shows tokens, components and icons, works, and has no serious violations", async ({
    page,
  }) => {
    await page.goto("/ui-kit");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("UI kit");
    await expect(page.getByTestId("ui-kit-swatch")).toHaveCount(14);
    // the swatches report the token's real value once the browser has computed it
    await expect(page.getByTestId("ui-kit-swatch").first()).toContainText("#211a18");
    expect(await page.getByTestId("ui-kit-icon").count()).toBeGreaterThan(30);
    await expect(page.getByTestId("product-card")).toHaveCount(3);

    await page.getByTestId("kit-toast").click();
    await expect(page.getByText("Saved to your wishlist.")).toBeVisible();
    await page.getByTestId("kit-open-modal").click();
    await expect(page.getByTestId("kit-modal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("kit-modal")).toBeHidden();

    expect(await expectNoSeriousViolations(page)).toEqual([]);
  });

  test("E2E-DEMO-04 a failing page shows the error screen inside the site, and Try again recovers", async ({
    page,
  }) => {
    await page.goto("/ui-kit");
    await page.getByTestId("kit-crash").click();
    const panel = page.getByTestId("error-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { level: 1 })).toHaveText("Something went wrong");
    await expect(page.getByRole("link", { name: /home/i }).first()).toBeVisible(); // the header is still there
    expect(await expectNoSeriousViolations(page)).toEqual([]);

    await panel.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("UI kit");
    await expect(page.getByTestId("error-panel")).toHaveCount(0);
  });

  test("E2E-DEMO-05 the free-shipping threshold reads the same on Home, inner pages, cart and checkout", async ({
    page,
  }) => {
    // the announcement bar is upper-cased by CSS, and innerText follows that
    const text = async (p: Page) => (await p.locator("body").innerText()).toLowerCase();
    const bar = "complimentary shipping on orders over $100";
    await page.goto("/");
    expect(await text(page)).toContain(bar);
    await page.goto("/about");
    expect(await text(page)).toContain(bar);
    // the founding line agrees with the About story (one set of facts, from site.ts)
    expect(await text(page)).toContain("started in a small studio in 2014");
    expect(await text(page)).toMatch(/est\s*·?\s*2014/);

    await page.goto("/policy/privacy"); // a page with the dark benefit strip
    expect(await text(page)).toContain("enjoy free shipping on orders over $100");
    expect(await text(page)).not.toContain("over $50");

    await addToCart(page, "the-renewal-serum", 1); // $48: $52 short of the threshold
    for (const path of ["/cart", "/checkout"]) {
      await page.goto(path);
      await expect(page.getByTestId("shipping-bar").first(), path).toContainText("$52.00");
    }
  });
});
