import { afterEach, describe, expect, it } from "vitest";
import { SUBSCRIBE_DISCOUNT_PERCENT } from "../../src/config/store";
import { GALLERY_FOR, PDP_LAYOUTS, parsePdpLayout } from "../../src/lib/pdp-layouts";
import { subscriptionCents } from "../../src/components/product/PurchaseOptions";
import { getProductBySlug } from "../../src/server/catalog/service";
import { resetTables, withTables } from "../helpers/tables";

afterEach(resetTables);

describe("product page layouts (PRD-012)", () => {
  it("knows the ten Figma layouts and a gallery setup for each", () => {
    expect(PDP_LAYOUTS).toHaveLength(10);
    for (const layout of PDP_LAYOUTS) expect(GALLERY_FOR[layout]).toBeDefined();
  });

  it("accepts only known layout names", () => {
    expect(parsePdpLayout("inner-zoom")).toBe("inner-zoom");
    expect(parsePdpLayout("Inner Zoom")).toBeNull();
    expect(parsePdpLayout("../etc")).toBeNull();
    expect(parsePdpLayout(undefined)).toBeNull();
  });

  it("returns the stored layout (validated) and sale end with the product", () => {
    expect(getProductBySlug("the-renewal-serum")?.pdpLayout).toBeNull();
    const setLayout = (layout: string) =>
      withTables(
        (t) => (t.products.find((p) => p.slug === "the-renewal-serum")!.pdpLayout = layout),
      );
    setLayout("gallery-2-column");
    expect(getProductBySlug("the-renewal-serum")?.pdpLayout).toBe("gallery-2-column");
    setLayout("not-a-layout");
    expect(getProductBySlug("the-renewal-serum")?.pdpLayout).toBeNull();
  });

  it("seeds a sale end only for products with a compare-at price", () => {
    const sale = getProductBySlug("barrier-repair-cream")!;
    expect(sale.defaultVariant.compareAtCents).not.toBeNull();
    expect(sale.saleEndsAt!.getTime()).toBeGreaterThan(Date.now());
    expect(getProductBySlug("the-renewal-serum")!.saleEndsAt).toBeNull();
  });

  it("prices the subscription in whole cents", () => {
    expect(subscriptionCents(4800)).toBe(
      Math.round((4800 * (100 - SUBSCRIBE_DISCOUNT_PERCENT)) / 100),
    );
    expect(subscriptionCents(4800)).toBe(4080);
    expect(Number.isInteger(subscriptionCents(3333))).toBe(true);
  });
});
