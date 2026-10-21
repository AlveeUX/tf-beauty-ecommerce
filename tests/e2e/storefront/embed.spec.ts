import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type Page } from "@playwright/test";

// TF4-T05 (D8): ThemeForest shows the live preview inside a frame on its own domain, so the demo is a third-party page
// there. These specs frame it from another origin and use it: no page may forbid framing, and the shop must still work
// where a browser blocks or partitions third-party storage (the cart lives in localStorage).
// The preview page is a small real server on 127.0.0.1 and the demo is on localhost: two different sites, both on the
// loopback address. (A page fulfilled by the test runner counts as a public page, and Chromium then refuses to let it
// reach into a private network.)
let server: Server;
let previewUrl = "";

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const src = new URL(request.url ?? "/", "http://preview.local").searchParams.get("src") ?? "";
    response.setHeader("content-type", "text/html");
    response.end(
      `<!doctype html><title>Live preview</title><body style="margin:0"><iframe id="demo" title="demo" src="${src}" style="width:100%;height:100vh;border:0"></iframe></body>`,
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  previewUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function embed(page: Page, path: string, baseURL: string | undefined) {
  await page.goto(`${previewUrl}?src=${encodeURIComponent(`${baseURL}${path}`)}`);
  return page.frameLocator("#demo");
}

const PAGE_TYPES = [
  "/",
  "/shop",
  "/shop?layout=top-filter",
  "/product/the-renewal-serum",
  "/blog",
  "/blog/inside-the-formula-behind-beautiful-skin",
  "/cart",
  "/checkout",
  "/account",
  "/login",
  "/wishlist",
  "/compare",
  "/search?q=serum",
  "/about",
  "/contact",
  "/faqs",
  "/store-locator",
  "/track-order",
  "/policy/privacy",
  "/demos",
  "/ui-kit",
  "/this-page-does-not-exist",
];

test.describe("Embedding in a frame (the live preview)", () => {
  test("E2E-FRAME-01 no kind of page, the 404 or a static file forbids being framed", async ({
    request,
  }) => {
    for (const route of [...PAGE_TYPES, "/robots.txt", "/sitemap.xml", "/opengraph-image"]) {
      const headers = (await request.get(route)).headers();
      expect(headers["x-frame-options"], `${route} X-Frame-Options`).toBeUndefined();
      expect(headers["content-security-policy"] ?? "", `${route} CSP`).not.toMatch(
        /frame-ancestors|frame-src|default-src/,
      );
      expect(headers["cross-origin-opener-policy"] ?? "", `${route} COOP`).not.toMatch(
        /same-origin/,
      );
      expect(headers["cross-origin-embedder-policy"], `${route} COEP`).toBeUndefined();
    }
  });

  test("E2E-FRAME-02 the main pages render and become interactive inside a frame", async ({
    page,
    baseURL,
  }) => {
    for (const [path, heading] of [
      ["/", /Glam Defined Perfectly/],
      ["/shop", /Shop/],
      ["/product/the-renewal-serum", /The renewal serum/i],
      ["/cart", /Cart/i],
      ["/checkout", /Checkout/i],
      ["/demos", /Demos|Every layout/i],
    ] as const) {
      const frame = await embed(page, path, baseURL);
      await expect(frame.getByRole("heading", { level: 1 }).first(), path).toContainText(heading);
      // hydrated: the header search or menu answers a click
      await expect(
        frame.getByRole("link", { name: "Shop", exact: true }).first(),
        path,
      ).toBeVisible();
    }
  });

  test("E2E-FRAME-03 shopping works in a frame: add to cart, the drawer, a link that stays in the frame", async ({
    page,
    baseURL,
  }) => {
    const frame = await embed(page, "/product/the-renewal-serum", baseURL);
    await frame.getByTestId("add-to-cart").click();
    const drawer = frame.getByTestId("cart-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/renewal serum/i);
    await drawer.getByRole("button", { name: "Close cart" }).click();
    await expect(drawer).toBeHidden();

    // a link inside the frame loads inside the frame; the preview page itself is never replaced
    await frame.getByRole("link", { name: "Shop", exact: true }).first().click();
    await expect(frame.getByRole("heading", { level: 1 }).first()).toContainText(/Shop/);
    expect(page.url().startsWith(previewUrl)).toBe(true);
  });

  test("E2E-FRAME-04 a popup opens inside the frame and fits it", async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const frame = await embed(page, "/product/the-renewal-serum", baseURL);
    await frame.getByTestId("size-guide-link").click();
    const popup = frame.getByTestId("size-guide");
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1280);
    expect(box!.y + box!.height).toBeLessThanOrEqual(800);
  });
  test("E2E-FRAME-05 with storage blocked (Safari and Chrome in a third-party frame) the shop still works for the page view", async ({
    page,
    baseURL,
  }) => {
    // the way a browser that blocks third-party storage answers: touching localStorage throws
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
      });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    for (const path of ["/", "/shop", "/wishlist", "/cart", "/checkout", "/login"]) {
      const frame = await embed(page, path, baseURL);
      await expect(frame.getByRole("heading", { level: 1 }).first(), path).toBeVisible();
      await expect(frame.getByText(/Something went wrong|Try again/i), path).toHaveCount(0);
    }

    const frame = await embed(page, "/product/the-renewal-serum", baseURL);
    await frame.getByTestId("add-to-cart").click();
    const drawer = frame.getByTestId("cart-drawer");
    await expect(drawer).toContainText(/renewal serum/i);
    await drawer.getByRole("button", { name: "Close cart" }).click();
    await expect(drawer).toBeHidden();
    await frame.getByTestId("wishlist").click();
    await expect(frame.getByTestId("wishlist")).toHaveAttribute("aria-pressed", "true");
    expect(errors, "no uncaught error").toEqual([]);
  });
});
