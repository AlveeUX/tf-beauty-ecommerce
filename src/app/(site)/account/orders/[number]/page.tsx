import { pageMeta } from "@/lib/seo";
import { OrderPage } from "@/components/account/AccountPages";

export const metadata = pageMeta({
  title: "Order",
  description: "The details and delivery status of one order.",
  path: "/account/orders",
  noindex: true,
});

type Props = { params: Promise<{ number: string }> };

export default async function OrderRoute({ params }: Props) {
  const { number } = await params;
  return <OrderPage number={number} />;
}
