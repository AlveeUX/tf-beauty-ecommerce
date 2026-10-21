"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import { COMPARE_LIMIT } from "@/config/store";
import { useList } from "@/lib/lists";
import { formatMoney } from "@/lib/money";
import { useLookup } from "./useLookup";
import styles from "./ListPages.module.css";

/** Compare page (CMP-001): rating, SKU, size, price and stock side by side. Figma 3:21520, empty 3:21946. */
export function ComparePage() {
  const { slugs, remove } = useList("compare");
  const { add, busy } = useCart();
  const { status, items } = useLookup(slugs);

  if (slugs.length === 0) {
    return (
      <div className={`container ${styles.page}`} data-reveal="fade-up">
        <div className={styles.empty} data-testid="compare-empty">
          <span className={styles.heart} aria-hidden="true">
            <Icon name="compare-arrows" size={32} />
          </span>
          <h2>Nothing to compare yet</h2>
          <p>
            Add up to {COMPARE_LIMIT} products with the compare button to see them side by side.
          </p>
          <Link href="/shop" className={`${styles.dark} m-btn`}>
            <span>Continue shopping</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const rows: { label: string; cell: (p: (typeof items)[number]) => React.ReactNode }[] = [
    { label: "Rating", cell: (p) => <Rating value={p.rating} count={undefined} variant="card" /> },
    { label: "SKU", cell: (p) => `#${p.sku}` },
    { label: "Size", cell: (p) => p.sizeLabel.replace(/^(\d+(?:\.\d+)?)(ml|g)/i, "$1 $2") },
    { label: "Price", cell: (p) => formatMoney(p.priceCents, "full") },
    {
      label: "Stock",
      cell: (p) => (
        <span className={styles.stock} data-out={!p.inStock || undefined}>
          {p.inStock ? "In stock" : "Out of stock"}
        </span>
      ),
    },
  ];

  return (
    <div className={`container ${styles.page}`} data-reveal="fade-up">
      {status === "error" ? (
        <p role="alert" className={styles.error}>
          We could not load your compare list. Please refresh the page.
        </p>
      ) : null}
      <div className={styles.compareScroll}>
        <table className={styles.compare} data-testid="compare-table">
          <thead>
            <tr>
              <td />
              {items.map((p) => (
                <th key={p.slug} scope="col" data-testid="compare-col">
                  <div className={styles.compareHead}>
                    <button
                      type="button"
                      className={styles.badgeX}
                      aria-label={`Remove ${p.name} from compare`}
                      onClick={() => remove(p.slug)}
                    >
                      <Icon name="x" size={12} />
                    </button>
                    <Link
                      href={`/product/${p.slug}`}
                      className={styles.compareThumb}
                      aria-label={p.name}
                    >
                      {p.image ? <Image src={p.image} alt="" fill sizes="100px" /> : null}
                    </Link>
                    <p className={styles.compareName}>
                      <Link href={`/product/${p.slug}`}>{p.name}</Link>
                    </p>
                    <button
                      type="button"
                      className={styles.dark}
                      disabled={!p.inStock || busy}
                      onClick={() => void add({ slug: p.slug, name: p.name })}
                    >
                      <span>Add to cart</span>
                    </button>
                  </div>
                </th>
              ))}
              {slugs.length < COMPARE_LIMIT ? (
                <th scope="col">
                  <Link href="/shop" className={styles.addProduct}>
                    <span aria-hidden="true">+</span>
                    <p>Add Product</p>
                  </Link>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {items.map((p) => (
                  <td key={p.slug}>{row.cell(p)}</td>
                ))}
                {slugs.length < COMPARE_LIMIT ? <td /> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status === "loading" ? <p className={styles.loading}>Loading your compare list…</p> : null}
    </div>
  );
}
