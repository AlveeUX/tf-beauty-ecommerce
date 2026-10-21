import { pageMeta } from "@/lib/seo";
import { OrdersList } from "@/components/account/AccountPages";

export const metadata = pageMeta({
  title: "My orders",
  description: "Your orders and their delivery status.",
  path: "/account/orders",
  noindex: true,
});

export default function OrdersRoute() {
  return <OrdersList />;
}
