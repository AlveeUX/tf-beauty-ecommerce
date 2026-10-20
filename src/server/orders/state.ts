import type { OrderStatus } from "@/lib/orders";

export { STATUS_LABEL, TRACKING_STEPS, type OrderStatus } from "@/lib/orders";

/**
 * Order lifecycle (PRD ORD-001, BR-06). `failed` is only reached when a payment is declined at
 * checkout. Terminal states have no exits.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled", "failed"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
  failed: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  TRANSITIONS[from].includes(to);

/** Statuses after which reserved stock goes back on the shelf. */
export const RELEASES_STOCK: readonly OrderStatus[] = ["cancelled", "failed"];
