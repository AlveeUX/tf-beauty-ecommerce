"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/demo-store/account";
import styles from "./Account.module.css";

const LINKS = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
] as const;

/** Account sub-navigation (proposed design, USR-004) with logout (USR-005). */
export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    signOut();
    router.push("/login");
  }

  return (
    <nav className={styles.nav} aria-label="Account">
      <ul>
        {LINKS.map((link) => {
          const active =
            link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={logout} data-testid="logout">
            Log out
          </button>
        </li>
      </ul>
    </nav>
  );
}
