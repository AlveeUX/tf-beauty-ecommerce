import { pageMeta } from "@/lib/seo";
import { AddressesManager } from "@/components/account/AddressesManager";

export const metadata = pageMeta({
  title: "My addresses",
  description: "Your saved delivery and billing addresses.",
  path: "/account/addresses",
  noindex: true,
});

export default function AddressesRoute() {
  return <AddressesManager />;
}
