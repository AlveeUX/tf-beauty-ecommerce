"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useList } from "@/lib/lists";

type Props = {
  kind: "wishlist" | "cart";
  badgeClassName: string | undefined;
  children: ReactNode;
};

/**
 * Header icon with a live count (STO-001). The cart icon opens the cart drawer (CRT-001) and still
 * links to /cart for visitors without scripts; the wishlist icon links to /wishlist.
 */
export function CounterLink({ kind, badgeClassName, children }: Props) {
  const cart = useCart();
  const wishlist = useList("wishlist");
  const count = kind === "cart" ? cart.cart.count : wishlist.slugs.length;
  const label = kind === "cart" ? "Cart" : "Wishlist";

  return (
    <Link
      href={kind === "cart" ? "/cart" : "/wishlist"}
      className="m-ring"
      aria-label={`${label}, ${count} ${count === 1 ? "item" : "items"}`}
      data-testid={`${kind}-link`}
      onClick={
        kind === "cart"
          ? (event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              cart.openDrawer();
            }
          : undefined
      }
    >
      {children}
      {count > 0 ? (
        <span className={badgeClassName} aria-hidden="true" data-testid={`${kind}-count`}>
          {count}
        </span>
      ) : null}
    </Link>
  );
}
