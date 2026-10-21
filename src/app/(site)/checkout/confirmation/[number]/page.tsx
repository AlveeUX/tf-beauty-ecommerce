import { pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";
import { OrderConfirmation } from "@/components/orders/OrderConfirmation";
import { isOrderNumber } from "@/lib/orders";

export const metadata = pageMeta({
  title: "Order received",
  description: "Your order has been received.",
  path: "/checkout",
  noindex: true,
});

type Props = { params: Promise<{ number: string }> };

/** Order confirmation (CHK-007, proposed design). The order itself is read in the browser (demo mode). */
export default async function ConfirmationRoute({ params }: Props) {
  const { number } = await params;
  if (!isOrderNumber(number)) notFound();

  return (
    <>
      <PageHero
        title="Order received"
        crumbs={[{ label: "Checkout", href: "/checkout" }, { label: "Order received" }]}
      />
      <OrderConfirmation number={number} />
      <BenefitStrip />
    </>
  );
}
