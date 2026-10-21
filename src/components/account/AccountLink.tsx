"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useCurrentUser } from "@/lib/demo-store/account";

/** Header user icon: "My account" when signed in, the login page otherwise. */
export function AccountLink() {
  const { user } = useCurrentUser();
  return (
    <Link
      href={user ? "/account" : "/login"}
      className="m-ring"
      aria-label={user ? `My account (${user.username})` : "Log in or register"}
      data-testid="account-link"
    >
      <Icon name="user" size={18} />
    </Link>
  );
}
