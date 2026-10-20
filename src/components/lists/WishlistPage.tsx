"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import { useList } from "@/lib/lists";
import { formatMoney } from "@/lib/money";
import { useLookup } from "./useLookup";
import styles from "./ListPages.module.css";
import { SOCIAL_LABEL, shareHref } from "@/lib/share";
import { usePageUrl } from "@/lib/use-page-url";

/** Wishlist page (WSH-001): table with stock status and Add to cart. Figma 3:20784, empty 3:21193. */
export function WishlistPage() {
  const { slugs, remove } = useList("wishlist");
  const pageUrl = usePageUrl();
  const { add, busy } = useCart();
  const { status, items } = useLookup(slugs);

  if (slugs.length === 0) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.empty} data-testid="wishlist-empty">
          <span className={styles.heart} aria-hidden="true">
            <Icon name="heart" size={32} />
          </span>
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any product to save it here for later.</p>
          <Link href="/shop" className={styles.dark}>
            <span>Continue shopping</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      {status === "error" ? (
        <p role="alert" className={styles.error}>
          We could not load your wishlist. Please refresh the page.
        </p>
      ) : null}
      <table className={styles.table} data-testid="wishlist-table">
        <thead>
          <tr>
            <th scope="col" className={styles.thProduct}>
              Product
            </th>
            <th scope="col">Price</th>
            <th scope="col">Stock status</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.slug} data-testid="wishlist-row">
              <td>
                <div className={styles.product}>
                  <button
                    type="button"
                    className={styles.x}
                    aria-label={`Remove ${p.name} from wishlist`}
                    onClick={() => remove(p.slug)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/cart/close.svg" alt="" width={11} height={11} />
                  </button>
                  <Link href={`/product/${p.slug}`} className={styles.thumb} aria-label={p.name}>
                    {p.image ? <Image src={p.image} alt="" fill sizes="90px" /> : null}
                  </Link>
                  <p className={styles.name}>
                    <Link href={`/product/${p.slug}`}>{p.name}</Link>
                  </p>
                </div>
              </td>
              <td>
                <p className={styles.price}>
                  {p.compareAtCents && p.compareAtCents > p.priceCents ? (
                    <s>{formatMoney(p.compareAtCents)}</s>
                  ) : null}
                  <span>{formatMoney(p.priceCents)}</span>
                </p>
              </td>
              <td>
                <p className={styles.stock} data-out={!p.inStock || undefined}>
                  {p.inStock ? "In stock" : "Out of stock"}
                </p>
              </td>
              <td className={styles.tdEnd}>
                <button
                  type="button"
                  className={styles.dark}
                  disabled={!p.inStock || busy}
                  onClick={() => void add({ slug: p.slug, name: p.name })}
                >
                  <span>Add to cart</span>
                  <Icon name="shopping-bag" size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {status === "loading" ? <p className={styles.loading}>Loading your wishlist…</p> : null}

      <p className={styles.share}>
        <span>Share on:</span>
        {(["facebook", "instagram", "twitter", "linkedin"] as const).map((s) => (
          <a
            key={s}
            href={shareHref(s, pageUrl)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${SOCIAL_LABEL[s]}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/home/footer/soc-${s}.svg`} alt="" width={28} height={28} />
          </a>
        ))}
      </p>
    </div>
  );
}
