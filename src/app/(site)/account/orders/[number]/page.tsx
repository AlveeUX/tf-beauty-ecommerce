import type { Metadata } from "next";
import { OrderPage } from "@/components/account/AccountPages";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

type Props = { params: Promise<{ number: string }> };

export default async function OrderRoute({ params }: Props) {
  const { number } = await params;
  return <OrderPage number={number} />;
}
