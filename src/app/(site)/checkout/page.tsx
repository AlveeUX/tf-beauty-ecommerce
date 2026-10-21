import { pageMeta } from "@/lib/seo";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { DemoNotice } from "@/components/feedback/DemoNotice";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";
import { enabledPaymentMethods } from "@/config/store";

export const metadata = pageMeta({
  title: "Checkout",
  description: "Enter your details and place your order.",
  path: "/checkout",
  noindex: true,
});

/**
 * Figma 3:22268. Guests and signed-in customers both check out (OQ-09); a signed-in customer's default
 * address is pre-filled by the form.
 */
export default function CheckoutRoute() {
  return (
    <>
      <PageHero title="Checkout" />
      <CheckoutPage methods={enabledPaymentMethods()} />
      <DemoNotice />
      <BenefitStrip />
    </>
  );
}
