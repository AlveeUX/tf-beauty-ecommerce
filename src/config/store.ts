import { site } from "./site";

/**
 * Shop rules the cart, checkout and content read. Their values live in `site.ts` (`site.commerce`);
 * the names below stay as short constants for the code that uses them.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = site.commerce.freeShippingThresholdCents;

/** Compare table limit. */
export const COMPARE_LIMIT = site.commerce.compareLimit;

/** A cart line may not exceed this even when more is in stock. */
export const MAX_LINE_QUANTITY = site.commerce.maxLineQuantity;

/** One flat rate below the free-shipping threshold, the same for every listed country, no tax. */
export const SHIPPING_FLAT_RATE_CENTS = site.commerce.shippingFlatRateCents;
export const CURRENCY = site.commerce.currency;

/** Countries offered at checkout (the design shows a "Country / Region" select). */
export const SHIPPING_COUNTRIES = site.commerce.countries;

/**
 * Payment methods offered at checkout. The design shows the three offline methods; the test card is
 * hidden unless `NEXT_PUBLIC_PAYMENT_METHODS` (a comma-separated list, read at build time) includes it.
 * Demo mode: no method charges anything.
 */
export type PaymentMethodId = "bank_transfer" | "cod" | "check" | "card_test";
export function enabledPaymentMethods(): PaymentMethodId[] {
  const configured = (process.env.NEXT_PUBLIC_PAYMENT_METHODS ?? "bank_transfer,cod,check")
    .split(",")
    .map((m) => m.trim())
    .filter((m): m is PaymentMethodId =>
      ["bank_transfer", "cod", "check", "card_test"].includes(m),
    );
  return configured.length > 0 ? configured : ["bank_transfer"];
}

/**
 * Subscribe and save (Figma "Subscribe and save" layout, PRD-010). The design shows 15% off and a
 * delivery every 60 days; there is no recurring-order backend yet, so the option is displayed but cannot
 * be bought (decision-log D-038).
 */
export const SUBSCRIBE_DISCOUNT_PERCENT = site.commerce.subscribeDiscountPercent;
export const SUBSCRIBE_EVERY_DAYS = 60;
