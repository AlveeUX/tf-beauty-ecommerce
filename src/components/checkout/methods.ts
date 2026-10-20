import type { PaymentMethodId } from "@/config/store";
import { site } from "@/config/site";

/** Checkout labels (Figma 3:22452..3:22459) and the text shown under the chosen method. */
export const METHOD_COPY: Record<PaymentMethodId, { label: string; description: string }> = {
  bank_transfer: {
    label: "Direct bank transfer",
    description:
      "Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will not be shipped until the funds have successfully cleared in our account and are verified by our finance team.",
  },
  cod: {
    label: "Cash on delivery",
    description: "Pay in cash when your order is delivered.",
  },
  check: {
    label: "Check payments",
    description: `Please send a check made out to ${site.name}. Your order will not be shipped until the check has cleared.`,
  },
  card_test: {
    label: "Test card",
    description: "Pays with the built-in test gateway. No real payment is taken.",
  },
};
