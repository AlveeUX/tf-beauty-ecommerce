import { beforeEach, describe, expect, it } from "vitest";
import { buildCartView, type VariantLine } from "../../src/lib/cart";
import {
  SAMPLE_ORDER,
  SIMULATE_KEY,
  findOrder,
  placeDemoOrder,
  readLastOrder,
  readOrders,
} from "../../src/lib/demo-store/orders";
import { writeStore } from "../../src/lib/demo-store/storage";
import { isOrderNumber } from "../../src/lib/orders";
import type { CheckoutInput } from "../../src/lib/validation/checkout";
import { installBrowser } from "../helpers/browser-shim";

const line = (over: Partial<VariantLine> = {}): VariantLine => ({
  variantId: 1,
  slug: "lip-repair-balm",
  name: "Lip Repair Balm",
  label: "Balm · 10ml",
  sku: "LRB-10",
  image: null,
  unitCents: 1400,
  compareAtCents: null,
  available: 10,
  ...over,
});
const cartOf = (quantity: number, over: Partial<VariantLine> = {}) =>
  buildCartView([{ variantId: 1, quantity }], new Map([[1, line(over)]]));

const input = (over: Partial<CheckoutInput> = {}): CheckoutInput => ({
  firstName: "Ana",
  lastName: "Lopez",
  company: undefined,
  address2: undefined,
  notes: undefined,
  country: "United Kingdom (UK)",
  address1: "1 High Street",
  city: "London",
  postcode: "N1 1AA",
  phone: "+44 20 7946 0000",
  email: "ana@example.com",
  paymentMethod: "bank_transfer",
  acceptTerms: true,
  idempotencyKey: "key_0123456789abcdef",
  ...over,
});

beforeEach(installBrowser);

describe("placeDemoOrder", () => {
  it("stores a pending order with totals in integer cents and remembers it", () => {
    const result = placeDemoOrder(input(), cartOf(1));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isOrderNumber(result.order.number)).toBe(true);
    expect(result.order).toMatchObject({
      status: "pending",
      paymentStatus: "pending",
      subtotalCents: 1400,
      shippingCents: 800,
      totalCents: 2200,
      items: [{ slug: "lip-repair-balm", sku: "LRB-10", quantity: 1, lineCents: 1400 }],
    });
    expect(readOrders()).toHaveLength(1);
    expect(readLastOrder()).toBe(result.order.number);
  });

  it("waives shipping at the free-shipping threshold", () => {
    const result = placeDemoOrder(input(), cartOf(8)); // 8 x $14 = $112
    expect(result.ok && result.order.shippingCents).toBe(0);
    expect(result.ok && result.order.totalCents).toBe(11200);
  });

  it("refuses an empty cart and stock that no longer covers the cart, storing nothing", () => {
    expect(placeDemoOrder(input(), buildCartView([], new Map()))).toMatchObject({
      ok: false,
      error: { code: "empty_cart" },
    });
    expect(placeDemoOrder(input(), cartOf(3, { available: 2 }))).toMatchObject({
      ok: false,
      error: { code: "stock_changed", items: ["Lip Repair Balm"] },
    });
    expect(readOrders()).toHaveLength(0);
  });

  it("approves the test card, and declines it once when the testing hook is set", () => {
    const card = input({ paymentMethod: "card_test" });
    const ok = placeDemoOrder(card, cartOf(1));
    expect(ok.ok && ok.order).toMatchObject({ status: "processing", paymentStatus: "paid" });

    writeStore(SIMULATE_KEY, "decline");
    const declined = placeDemoOrder(card, cartOf(1));
    expect(declined).toMatchObject({ ok: false, error: { code: "payment_failed" } });
    expect(readOrders().map((o) => o.status)).toEqual(["processing", "failed"]);
    expect(readLastOrder()).toBe(ok.ok ? ok.order.number : null); // a failed order is not "the last order"

    const again = placeDemoOrder(card, cartOf(1)); // the hook was single use
    expect(again.ok).toBe(true);
  });
});

describe("findOrder", () => {
  it("needs both the ID and the email, ignoring case", () => {
    const placed = placeDemoOrder(input({ email: "Ana@Example.com" }), cartOf(1));
    const number = placed.ok ? placed.order.number : "";
    expect(findOrder(number.toLowerCase(), "ana@example.com")?.number).toBe(number);
    expect(findOrder(number, "someone@else.com")).toBeNull();
    expect(findOrder("CSM-ZZZZZZZZ", "ana@example.com")).toBeNull();
  });

  it("always finds the documented sample order", () => {
    expect(findOrder("CSM-DEMO2026", "demo@example.com")).toEqual(SAMPLE_ORDER);
    expect(isOrderNumber(SAMPLE_ORDER.number)).toBe(true);
  });
});
