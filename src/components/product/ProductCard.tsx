import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/money";
import { Rating } from "@/components/ui/Rating";
import { AddButton, CompareToggle, QuickAdd, QuickViewLink, WishlistToggle } from "./CardActions";
import type { ProductBadge, ProductSummary } from "@/lib/catalog-types";
import styles from "./ProductCard.module.css";

/** "Serum · 30ml" -> the unit stays lowercase, as in the design's uppercase labels. */
function withUnit(text: string) {
  const m = /^(.*\d)([a-z]+)$/.exec(text);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span className={styles.unit}>{m[2]}</span>
    </>
  );
}
export type ProductCardData = ProductSummary;

const BADGE_TEXT: Record<ProductBadge, string> = {
  "best-seller": "Best seller",
  new: "New",
  trending: "Trending",
  hot: "Hot",
};

type ProductCardProps = {
  product: ProductCardData;
  /** Above-the-fold images load eagerly. */
  priority?: boolean;
  sizes?: string;
  /** "light" is the card on the beige Home band (Figma 3:2295); default is the Shop card. */
  tone?: "default" | "light";
  /** "cta" shows name + price on one row and a full-width Add to cart bar (Home "Most loved").
   *  "row" is the wide list card of the list layouts (Figma 3:38190): image left, text and Shop Now right. */
  layout?: "default" | "cta" | "row";
  /** Replaces the badge text (Home "Most loved" tags such as "#Best seller"). */
  badgeLabel?: string;
};

/**
 * Product card. Figma 3:5157 (308 x 509: 308 x 359 image, 150 body on BG-Light-01).
 * Hover actions: quick view popup, compare, wishlist and add to cart.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1100px) 308px, 50vw",
  tone = "default",
  layout = "default",
  badgeLabel,
}: ProductCardProps) {
  const href = `/product/${product.slug}`;
  const soldOut = product.inStock === false;
  // the label's repeating shine starts 0 to 4 steps late, by product, so the labels of a row do not all flash together
  // (the same on the server and the client)
  const shinePhase = {
    "--shine-phase": [...product.slug].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 5,
  } as CSSProperties;
  return (
    <article
      className={`${styles.card} ${tone === "light" ? styles.light : ""} ${layout === "cta" ? styles.cta : ""} ${layout === "row" ? styles.row : ""}`}
      data-testid="product-card"
      data-hover-image={product.hoverImage ? "" : undefined}
    >
      <div className={styles.media}>
        <Link href={href} className={styles.imageLink} aria-label={product.name} tabIndex={-1}>
          <Image
            src={product.image}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className={styles.image}
          />
          {product.hoverImage ? (
            // a mouse only: hidden (and never fetched) on touch screens, see ProductCard.module.css
            <Image
              src={product.hoverImage}
              alt=""
              fill
              sizes={sizes}
              loading="lazy"
              className={`${styles.image} ${styles.hoverImage}`}
            />
          ) : null}
        </Link>
        {badgeLabel ? (
          <span className={`${styles.badge} m-shine`} style={shinePhase}>
            {badgeLabel}
          </span>
        ) : product.badge ? (
          <span className={`${styles.badge} m-shine`} style={shinePhase}>
            {BADGE_TEXT[product.badge]}
          </span>
        ) : null}
        {soldOut ? <span className={styles.soldOut}>Out of stock</span> : null}
        <ul className={styles.actions}>
          <li>
            <QuickViewLink slug={product.slug} name={product.name} />
          </li>
          <li>
            <CompareToggle slug={product.slug} name={product.name} />
          </li>
          <li>
            <WishlistToggle slug={product.slug} name={product.name} />
          </li>
          <li>
            <QuickAdd slug={product.slug} name={product.name} disabled={soldOut} />
          </li>
        </ul>
      </div>
      <div className={styles.body}>
        {layout === "row" ? (
          <>
            <Rating value={product.rating} count={product.reviewCount} variant="card" />
            <h3 className={styles.stdName}>
              <Link href={href} className="m-link">
                {product.name}
              </Link>
            </h3>
            <p className={styles.stdLabel}>{withUnit(product.label)}</p>
            <p className={styles.rowText}>{product.description}</p>
            <div className={styles.rowFoot}>
              <Link href={href} className={styles.shopNow}>
                <span>Shop now</span>
                <Icon name="arrow-right" size={18} />
              </Link>
              <p className={styles.stdPrice} data-testid="card-price">
                <span>{formatMoney(product.priceCents, "compact")}</span>
                {product.compareAtCents != null && product.compareAtCents > product.priceCents ? (
                  <>
                    <span className="visually-hidden">Was</span>
                    <s>{formatMoney(product.compareAtCents, "compact")}</s>
                  </>
                ) : null}
              </p>
            </div>
          </>
        ) : layout === "cta" ? (
          <>
            <h3 className={styles.ctaName}>
              <Link href={href} className="m-link">
                {product.name}
              </Link>
            </h3>
            <p className={styles.ctaPrice}>{formatMoney(product.priceCents, "compact")}</p>
            <p className={styles.ctaLabel}>{withUnit(product.label)}</p>
            <div className={styles.ctaRating}>
              <Rating value={product.rating} count={product.reviewCount} variant="card" />
            </div>
            <AddButton slugs={[product.slug]} className={styles.addBar} disabled={soldOut}>
              <Icon name="shopping-bag" size={15} />
              <span>Add to cart</span>
            </AddButton>
          </>
        ) : (
          <>
            <Rating value={product.rating} count={product.reviewCount} variant="card" />
            <h3 className={styles.stdName}>
              <Link href={href} className="m-link">
                {product.name}
              </Link>
            </h3>
            <p className={styles.stdLabel}>{withUnit(product.label)}</p>
            <p className={styles.stdPrice} data-testid="card-price">
              <span>{formatMoney(product.priceCents, "compact")}</span>
              {product.compareAtCents != null && product.compareAtCents > product.priceCents ? (
                <>
                  <span className="visually-hidden">Was</span>
                  <s>{formatMoney(product.compareAtCents, "compact")}</s>
                </>
              ) : null}
            </p>
          </>
        )}
      </div>
    </article>
  );
}
