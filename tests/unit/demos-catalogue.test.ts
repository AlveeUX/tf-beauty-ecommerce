import { describe, expect, it } from "vitest";
import { ALL_DEMOS, DEMO_GROUPS } from "../../src/content/demos";
import { BLOG_LAYOUTS } from "../../src/lib/blog";
import { PDP_LAYOUTS } from "../../src/lib/pdp-layouts";
import { SHOP_LAYOUTS } from "../../src/lib/shop-layouts";

const hrefs = ALL_DEMOS.map((d) => d.href);
const group = (id: string) => DEMO_GROUPS.find((g) => g.id === id)!;

describe("demo hub catalogue (TF-D4: every variant ships as a demo)", () => {
  it("lists every shop layout", () => {
    for (const layout of SHOP_LAYOUTS) expect(hrefs, layout).toContain(`/shop?layout=${layout}`);
    expect(group("shop").items).toHaveLength(SHOP_LAYOUTS.length);
  });

  it("lists every product layout, the sticky bar and the sold-out state", () => {
    for (const layout of PDP_LAYOUTS) {
      expect(
        hrefs.some((h) => h.startsWith("/product/") && h.endsWith(`?layout=${layout}`)),
        layout,
      ).toBe(true);
    }
    expect(hrefs.some((h) => h.endsWith("?sticky=1"))).toBe(true);
    expect(group("product").items).toHaveLength(PDP_LAYOUTS.length + 2);
  });

  it("lists every blog layout and an article", () => {
    for (const layout of BLOG_LAYOUTS) expect(hrefs, layout).toContain(`/blog?layout=${layout}`);
    expect(hrefs.some((h) => h.startsWith("/blog/"))).toBe(true);
  });

  it("covers the key pages", () => {
    for (const page of [
      "/cart",
      "/checkout",
      "/wishlist",
      "/compare",
      "/categories",
      "/login",
      "/register",
      "/account",
      "/track-order",
      "/about",
      "/contact",
      "/faqs",
      "/store-locator",
      "/policy/privacy",
      "/policy/shipping",
      "/policy/returns",
      "/policy/terms",
      "/ui-kit",
    ]) {
      expect(hrefs, page).toContain(page);
    }
  });

  it("has unique ids and unique internal links, with exactly one deliberate 404", () => {
    expect(new Set(ALL_DEMOS.map((d) => d.id)).size).toBe(ALL_DEMOS.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(href.startsWith("/")).toBe(true);
    expect(ALL_DEMOS.filter((d) => d.status === 404)).toHaveLength(1);
  });
});
