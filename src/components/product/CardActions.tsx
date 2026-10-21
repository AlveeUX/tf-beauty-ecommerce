"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useListsUi } from "@/components/lists/ListsUi";
import { Icon } from "@/components/ui/Icon";
import { useCompareAction, useWishlistAction } from "@/components/lists/useListActions";

type Props = { slug: string; name: string };

/** Eye on a product card: opens the quick view (Figma 3:1366); without JavaScript it is a plain link to the page. */
export function QuickViewLink({ slug, name }: Props) {
  const { showQuickView } = useListsUi();
  return (
    <Link
      href={`/product/${slug}`}
      aria-label={`Quick view ${name}`}
      className="m-ring"
      data-testid="card-quickview"
      onClick={(event) => {
        // keep "open in new tab" and the like working
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
          return;
        event.preventDefault();
        showQuickView(slug);
      }}
    >
      <Icon name="eye" size={16} />
    </Link>
  );
}

/** Heart on a product card: toggles the guest wishlist (WSH-001). */
export function WishlistToggle({ slug, name }: Props) {
  const { active, toggle } = useWishlistAction(slug, name);
  // the heart pops after a click, not when the page loads with the product already in the wishlist
  const [pops, setPops] = useState(0);
  return (
    <button
      type="button"
      aria-label={active ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      aria-pressed={active}
      className="m-ring"
      data-testid="card-wishlist"
      onClick={() => {
        toggle();
        setPops((n) => n + 1);
      }}
    >
      <span key={pops} className={pops ? "m-pop" : "m-pop-slot"}>
        <Icon name="heart" size={16} filled={active} />
      </span>
    </button>
  );
}

/** Compare arrows on a product card: adds to the compare list (limit in config, CMP-001). */
export function CompareToggle({ slug, name }: Props) {
  const { active, add } = useCompareAction(slug, name);
  return (
    <button
      type="button"
      aria-label={active ? `${name} is in your compare list` : `Compare ${name}`}
      aria-pressed={active}
      className="m-ring"
      data-testid="card-compare"
      onClick={add}
    >
      <Icon name="compare-arrows" size={16} />
    </button>
  );
}

/** Bag on a product card: adds the default variant and opens the drawer (CRT-001). */
export function QuickAdd({ slug, name, disabled }: Props & { disabled?: boolean }) {
  const { add, busy } = useCart();
  return (
    <button
      type="button"
      aria-label={`Add ${name} to cart`}
      disabled={disabled || busy}
      className="m-ring"
      data-testid="card-add"
      onClick={() => void add({ slug, name })}
    >
      <Icon name="shopping-bag" size={16} />
    </button>
  );
}

/** Text button used by Home (Add to cart / bundle): adds one or several products. */
export function AddButton({
  slugs,
  className,
  children,
  disabled,
  ariaLabel,
  tone,
}: {
  slugs: string[];
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
  tone?: string;
}) {
  const { add, addMany, busy } = useCart();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      data-tone={tone}
      disabled={disabled || busy || slugs.length === 0}
      onClick={() => void (slugs.length === 1 ? add({ slug: slugs[0] }) : addMany(slugs))}
    >
      {children}
    </button>
  );
}
