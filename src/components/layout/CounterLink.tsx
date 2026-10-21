"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useHydrated } from "@/lib/demo-store/storage";
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

  // The count pops when it changes after the page has settled (never for the number loaded from storage on arrival)
  const hydrated = useHydrated();
  const settled = hydrated && (kind !== "cart" || cart.ready);
  const last = useRef<number | null>(null);
  const [bumps, setBumps] = useState(0);
  useEffect(() => {
    if (!settled) return;
    if (last.current !== null && last.current !== count) setBumps((n) => n + 1);
    last.current = count;
  }, [count, settled]);

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
        <span
          key={bumps}
          className={bumps > 0 ? `${badgeClassName ?? ""} m-bump` : badgeClassName}
          aria-hidden="true"
          data-testid={`${kind}-count`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
