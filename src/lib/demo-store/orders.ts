import { CURRENCY } from "@/config/store";
import type { CartView } from "@/lib/cart";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { newOrderNumber, type OrderStatus, type OrderView } from "@/lib/orders";
import { totalsFor } from "@/lib/totals";
import { readStore, removeStore, writeStore } from "./storage";

export const ORDERS_KEY = "orders";
const LAST_ORDER_KEY = "last-order";
/** Testing hook: set to "decline" and the next test-card payment is declined once (payment-failure UI). */
export const SIMULATE_KEY = "simulate";

/**
 * The one sample order every visitor can look up on Track order (documented for buyers):
 * ID `CSM-DEMO2026`, billing email `demo@example.com`.
 */
export const SAMPLE_ORDER: OrderView = {
  number: "CSM-DEMO2026",
  status: "shipped",
  paymentMethod: "bank_transfer",
  paymentStatus: "paid",
  currency: CURRENCY,
  email: "demo@example.com",
  createdAt: "2026-09-12T10:15:00.000Z",
  subtotalCents: 9600,
  shippingCents: 800,
  discountCents: 0,
  totalCents: 10400,
  billing: {
    firstName: "Demo",
    lastName: "Shopper",
    company: null,
    country: "United Kingdom (UK)",
    address1: "1 Sample Street",
    address2: null,
    city: "London",
    postcode: "N1 1AA",
    phone: "+44 20 7946 0000",
  },
  notes: null,
  carrier: "Demo Courier",
  trackingNumber: "DEMO-TRACK-0001",
  items: [
    {
      slug: "the-renewal-serum",
      name: "The Renewal Serum",
      variantLabel: "Serum · 30ml",
      sku: "DEMO-SERUM-30",
      image: null,
      unitCents: 4800,
      quantity: 2,
      lineCents: 9600,
    },
  ],
  events: [
    { status: "pending", at: "2026-09-12T10:15:00.000Z", note: "Order placed" },
    { status: "processing", at: "2026-09-12T14:02:00.000Z", note: "Payment confirmed" },
    { status: "shipped", at: "2026-09-14T09:30:00.000Z", note: "Handed to the carrier" },
  ],
};

export const readOrders = (): OrderView[] => readStore<OrderView[]>(ORDERS_KEY, []);

/** Newest first. */
export const newestFirst = (orders: OrderView[]): OrderView[] =>
  [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const readLastOrder = (): string | null => readStore<string | null>(LAST_ORDER_KEY, null);

export type PlaceOrderResult =
  | { ok: true; order: OrderView }
  | {
      ok: false;
      error: {
        code: "empty_cart" | "stock_changed" | "payment_failed";
        message: string;
        items?: string[];
      };
    };

/**
 * Place a demo order (CHK-006). Nothing is charged: offline methods stay pending, the test card is
 * approved (or declined once when the `simulate` hook says so). The caller empties the cart on success.
 */
export function placeDemoOrder(input: CheckoutInput, cart: CartView): PlaceOrderResult {
  if (cart.lines.length === 0) {
    return { ok: false, error: { code: "empty_cart", message: "Your cart is empty." } };
  }
  const short = cart.lines.filter((l) => l.available < l.quantity);
  if (short.length > 0) {
    return {
      ok: false,
      error: {
        code: "stock_changed",
        message: "Some items in your cart are no longer available in the quantity you chose.",
        items: short.map((l) => l.name),
      },
    };
  }

  const totals = totalsFor(cart.subtotalCents);
  const now = new Date().toISOString();
  let status: OrderStatus = "pending";
  let paymentStatus: OrderView["paymentStatus"] = "pending";
  const events: OrderView["events"] = [{ status: "pending", at: now, note: "Order placed" }];

  if (input.paymentMethod === "card_test") {
    const decline = readStore<string | null>(SIMULATE_KEY, null) === "decline";
    removeStore(SIMULATE_KEY);
    if (decline) {
      status = "failed";
      paymentStatus = "failed";
      events.push({ status: "failed", at: now, note: "Payment declined" });
    } else {
      status = "processing";
      paymentStatus = "paid";
      events.push({ status: "processing", at: now, note: "Payment received" });
    }
  }

  const order: OrderView = {
    number: newOrderNumber(),
    status,
    paymentMethod: input.paymentMethod,
    paymentStatus,
    currency: CURRENCY,
    email: input.email,
    createdAt: now,
    ...totals,
    billing: {
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company ?? null,
      country: input.country,
      address1: input.address1,
      address2: input.address2 ?? null,
      city: input.city,
      postcode: input.postcode,
      phone: input.phone,
    },
    notes: input.notes ?? null,
    carrier: null,
    trackingNumber: null,
    items: cart.lines.map((l) => ({
      slug: l.slug,
      name: l.name,
      variantLabel: l.label,
      sku: l.sku,
      image: l.image,
      unitCents: l.unitCents,
      quantity: l.quantity,
      lineCents: l.lineCents,
    })),
    events,
  };
  writeStore(ORDERS_KEY, [...readOrders(), order]);
  if (status === "failed") {
    return {
      ok: false,
      error: {
        code: "payment_failed",
        message:
          "Your payment was declined and you have not been charged. Please try another method.",
      },
    };
  }
  writeStore(LAST_ORDER_KEY, order.number);
  return { ok: true, order };
}

/** Order lookup for guests (TRK-001): the ID and the billing email must both match. */
export function findOrder(orderId: string, email: string): OrderView | null {
  const id = orderId.trim().toUpperCase();
  const mail = email.trim().toLowerCase();
  return (
    [SAMPLE_ORDER, ...readOrders()].find(
      (o) => o.number === id && o.email.toLowerCase() === mail,
    ) ?? null
  );
}
