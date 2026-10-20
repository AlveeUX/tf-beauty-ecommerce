import type { PAYMENT_METHODS } from "@/config/order-constants";

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type ChargeRequest = {
  orderNumber: string;
  method: PaymentMethod;
  amountCents: number;
  /** Test hook honoured only by the mock gateway when simulation is enabled. */
  simulate?: "approve" | "decline";
};

export type ChargeResult = {
  status: "paid" | "pending" | "failed";
  provider: string;
  /** Gateway reference or failure reason. Never card data. */
  reference: string;
};

/** Anything that can take a payment. A real provider would implement this behind the same shape. */
export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}

export { METHOD_LABEL } from "@/lib/orders";

/**
 * Local gateway (decision-log D-037). Bank transfer, cash on delivery and check payments are settled
 * offline, so they stay `pending` until staff mark them paid. The test card approves, and declines
 * only when a test explicitly asks it to and `ALLOW_PAYMENT_SIMULATION=1` is set (the E2E run sets it on its production build; never set it on a real deployment).
 */
export class LocalGateway implements PaymentGateway {
  async charge(request: ChargeRequest): Promise<ChargeResult> {
    if (request.method !== "card_test") {
      return { status: "pending", provider: "offline", reference: request.orderNumber };
    }
    const simulate = process.env.ALLOW_PAYMENT_SIMULATION === "1" ? request.simulate : undefined;
    if (simulate === "decline") {
      return { status: "failed", provider: "mock-card", reference: "card_declined" };
    }
    return { status: "paid", provider: "mock-card", reference: `mock_${request.orderNumber}` };
  }
}

export const localGateway = new LocalGateway();
