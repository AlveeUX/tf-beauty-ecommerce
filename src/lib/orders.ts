import type { ORDER_STATUSES, PAYMENT_METHODS } from "@/config/order-constants";

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type OrderView = {
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  currency: string;
  email: string;
  createdAt: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  billing: {
    firstName: string;
    lastName: string;
    company: string | null;
    country: string;
    address1: string;
    address2: string | null;
    city: string;
    postcode: string;
    phone: string;
  };
  notes: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  items: {
    slug: string;
    name: string;
    variantLabel: string;
    sku: string;
    image: string | null;
    unitCents: number;
    quantity: number;
    lineCents: number;
  }[];
  events: { status: OrderStatus; at: string; note: string | null }[];
};

// OQ-21: "CSM-" plus 8 characters. The alphabet drops look-alikes (0/O, 1/I/L) so the ID can be read aloud.
const ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newOrderNumber(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `CSM-${Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("")}`;
}
export const isOrderNumber = (value: unknown): value is string =>
  typeof value === "string" && /^CSM-[A-Z0-9]{8}$/.test(value);

/** Order lifecycle (PRD ORD-001). `failed` is only reached when a payment is declined at checkout. */
export const TRACKING_STEPS = ["pending", "processing", "shipped", "delivered"] as const;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Payment failed",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Direct bank transfer",
  cod: "Cash on delivery",
  check: "Check payments",
  card_test: "Test card (no real charge)",
};
