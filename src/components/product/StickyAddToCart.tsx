"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/money";
import styles from "./StickyAddToCart.module.css";

type Props = {
  name: string;
  image?: string;
  priceCents: number;
  sizeLabel: string;
  disabled: boolean;
  onAdd: () => void;
  /** Phones only (docs/responsive-spec.md 6.3); above 767 px the bar is part of the "Sticky add to card" demo only. */
  phoneOnly?: boolean;
  /** id of the purchase row; the bar shows once that row has scrolled out of view. */
  watch: string;
};

/**
 * Sticky add-to-cart bar of the "Sticky add to card" menu entry (the design has no frame for it, so this is a
 * plain bar: picture, name, price and the Add to cart button). It slides in when the page's own buttons leave
 * the window and never covers them.
 */
export function StickyAddToCart({
  name,
  image,
  priceCents,
  sizeLabel,
  disabled,
  onAdd,
  watch,
  phoneOnly,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

  // the bar never covers the footer
  useEffect(() => {
    // the page footer, not the footers of the cart drawer and the wishlist dialog
    const footer = [...document.querySelectorAll("footer")].find(
      (el) => !el.closest("[role=dialog], [data-testid=cart-drawer]"),
    );
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setFooterInView(entry!.isIntersecting));
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const row = document.getElementById(watch);
    if (!row) return;
    // shown only when the row is gone upwards (scrolled past), not while it is still below the window
    const update = () => setVisible(row.getBoundingClientRect().bottom < 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [watch]);

  const shown = visible && !footerInView;
  return (
    <div
      className={`${styles.bar} ${phoneOnly ? styles.phoneOnly : ""}`}
      data-visible={shown || undefined}
      data-testid="sticky-bar"
      aria-hidden={!shown}
      inert={!shown}
    >
      <div className={`container ${styles.inner}`}>
        {image ? (
          <span className={styles.thumb}>
            <Image src={image} alt="" fill sizes="56px" />
          </span>
        ) : null}
        <p className={styles.name}>{name}</p>
        <p className={styles.price}>
          {formatMoney(priceCents, "full")} <span>/ {sizeLabel}</span>
        </p>
        <button
          type="button"
          className={`${styles.add} m-btn`}
          disabled={disabled}
          onClick={onAdd}
          data-testid="sticky-add"
        >
          Add to cart
          <Icon name="shopping-bag" size={15} />
        </button>
      </div>
    </div>
  );
}
