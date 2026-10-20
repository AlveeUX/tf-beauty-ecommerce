import type { Metadata } from "next";
import { OrdersList } from "@/components/account/AccountPages";

export const metadata: Metadata = { title: "My orders" };

export default function OrdersRoute() {
  return <OrdersList />;
}
