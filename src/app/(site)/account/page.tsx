import { pageMeta } from "@/lib/seo";
import { AccountDashboard } from "@/components/account/AccountPages";

export const metadata = pageMeta({
  title: "My account",
  description: "Your orders, addresses and account details.",
  path: "/account",
  noindex: true,
});

export default function AccountRoute() {
  return <AccountDashboard />;
}
