import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/AccountPages";

export const metadata: Metadata = { title: "My account" };

export default function AccountRoute() {
  return <AccountDashboard />;
}
