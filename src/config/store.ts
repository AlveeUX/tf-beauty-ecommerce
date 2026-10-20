/**
 * Store settings stub. The admin settings screen (P9, AST-001) will own these values.
 * Free-shipping threshold: the announcement bar says $100, the benefit card says $50 (PRD OQ-04);
 * $100 is the provisional default (decision-log D-004).
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 10_000;

/** Compare table limit (PRD OQ-10, default 4). */
export const COMPARE_LIMIT = 4;

/** A cart line may not exceed this even when more is in stock. */
export const MAX_LINE_QUANTITY = 20;

/**
 * Shipping (PRD OQ-04 default, decision-log D-037): one flat rate below the free-shipping threshold,
 * the same for every listed country, no tax. The admin settings screen (P9) will own these values.
 */
export const SHIPPING_FLAT_RATE_CENTS = 800;
export const CURRENCY = "USD";

/** Countries offered at checkout (the design shows a "Country / Region" select). */
export const SHIPPING_COUNTRIES = [
  "United Kingdom (UK)",
  "United States (US)",
  "Canada",
  "Australia",
  "Denmark",
  "France",
  "Germany",
  "Ireland",
  "Netherlands",
  "Sweden",
] as const;

/** Session lifetimes: browser-session style by default, longer with "Remember me". */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
export const SESSION_TTL_REMEMBER_MS = 1000 * 60 * 60 * 24 * 30;
export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60;

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
export const SUBSCRIBE_DISCOUNT_PERCENT = 15;
export const SUBSCRIBE_EVERY_DAYS = 60;
