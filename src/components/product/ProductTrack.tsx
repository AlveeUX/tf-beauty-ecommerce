"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ProductSummary } from "@/lib/catalog-types";
import { ProductCard } from "./ProductCard";
import styles from "./ProductTrack.module.css";

type ProductTrackProps = {
  products: ProductSummary[];
  label: string;
  tone?: "default" | "light";
  /** Let the row run to the right edge of the viewport (Home "Trending now"). */
  bleed?: boolean;
  /** Cards fade in one after another as the row comes into view (Home). */
  reveal?: boolean;
};

/** Horizontally scrolling row of product cards with previous/next controls. */
export function ProductTrack({
  products,
  label,
  tone = "default",
  bleed = false,
  reveal = false,
}: ProductTrackProps) {
  const track = useRef<HTMLUListElement>(null);

  function scroll(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 676), behavior: "smooth" });
  }

  return (
    <div className={`${styles.frame} ${bleed ? styles.bleed : ""}`}>
      <ul
        ref={track}
        className={styles.track}
        data-testid="carousel-track"
        data-reveal-stagger={reveal || undefined}
      >
        {products.map((p) => (
          <li key={p.slug} data-reveal={reveal ? "fade" : undefined}>
            <ProductCard product={p} tone={tone} />
          </li>
        ))}
      </ul>
      {products.length > 4 ? (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev} m-ring`}
            aria-label={`Previous ${label}`}
            onClick={() => scroll(-1)}
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next} m-ring`}
            aria-label={`Next ${label}`}
            onClick={() => scroll(1)}
          >
            <Icon name="arrow-right" size={18} />
          </button>
        </>
      ) : null}
    </div>
  );
}
