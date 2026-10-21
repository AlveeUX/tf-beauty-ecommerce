/** Plain constants shared by validation and the UI. */
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "failed",
] as const;
export const PAYMENT_METHODS = ["bank_transfer", "cod", "check", "card_test"] as const;
