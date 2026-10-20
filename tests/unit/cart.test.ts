import { describe, expect, it } from "vitest";
import { buildCartView, checkQuantity, EMPTY_CART, type VariantLine } from "../../src/lib/cart";
import { createJsonProvider } from "../../src/data/json-provider";
import { tables } from "../../src/data/tables";

const line = (over: Partial<VariantLine> = {}): VariantLine => ({
  variantId: 1,
  slug: "a",
  name: "A",
  label: "Serum · 30ml",
  sku: "A-30",
  image: null,
  unitCents: 1000,
  compareAtCents: null,
  available: 5,
  ...over,
});

describe("checkQuantity (CRT-005)", () => {
  it("accepts whole numbers within stock and the line limit", () => {
    expect(checkQuantity(1, 5)).toBeNull();
    expect(checkQuantity(5, 5)).toBeNull();
    expect(checkQuantity(20, 100)).toBeNull();
  });

  it("rejects bad quantities, sold-out items and amounts above stock", () => {
    expect(checkQuantity(0, 5)?.code).toBe("invalid_quantity");
    expect(checkQuantity(1.5, 5)?.code).toBe("invalid_quantity");
    expect(checkQuantity(21, 100)?.code).toBe("invalid_quantity");
    expect(checkQuantity(1, 0)).toMatchObject({ code: "out_of_stock", available: 0 });
    expect(checkQuantity(6, 5)).toMatchObject({ code: "stock_limit", available: 5 });
  });
});

describe("buildCartView", () => {
  it("is empty without items and uses integer cents", () => {
    expect(buildCartView([], new Map())).toEqual(EMPTY_CART);
    const view = buildCartView(
      [
        { variantId: 1, quantity: 2 },
        { variantId: 2, quantity: 1 },
      ],
      new Map([
        [1, line({ unitCents: 1999 })],
        [2, line({ variantId: 2, unitCents: 1 })],
      ]),
    );
    expect(view.count).toBe(3);
    expect(view.subtotalCents).toBe(3999);
    expect(view.lines[0]!.lineCents).toBe(3998);
    expect(view.remainingForFreeShippingCents).toBe(10_000 - 3999);
  });

  it("drops items whose product is gone and reports no negative remainder", () => {
    const view = buildCartView(
      [
        { variantId: 1, quantity: 1 },
        { variantId: 99, quantity: 3 },
      ],
      new Map([[1, line({ unitCents: 20_000 })]]),
    );
    expect(view.lines).toHaveLength(1);
    expect(view.count).toBe(1);
    expect(view.remainingForFreeShippingCents).toBe(0);
  });
});

describe("getVariantLines (the cart's catalog feed)", () => {
  const provider = createJsonProvider(tables);

  it("resolves a slug to its default variant and a variant id to itself", () => {
    const [bySlug] = provider.getVariantLines([{ slug: "the-renewal-serum" }]);
    expect(bySlug).toMatchObject({ slug: "the-renewal-serum", unitCents: 4800 });
    const [byId] = provider.getVariantLines([{ variantId: bySlug!.variantId }]);
    expect(byId).toEqual(bySlug);
  });

  it("reports sold-out stock as 0 and skips unknown products", () => {
    expect(provider.getVariantLines([{ slug: "glass-glow-primer" }])[0]!.available).toBe(0);
    expect(provider.getVariantLines([{ slug: "nope" }, { variantId: 987654 }])).toEqual([]);
  });
});
