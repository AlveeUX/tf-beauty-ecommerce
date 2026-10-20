import type { Metadata } from "next";
import { AddressesManager } from "@/components/account/AddressesManager";

export const metadata: Metadata = { title: "My addresses" };

export default function AddressesRoute() {
  return <AddressesManager />;
}
