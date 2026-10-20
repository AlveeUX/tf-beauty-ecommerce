"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import type { ProductBadge } from "@/lib/catalog-types";
import { useCompareAction, useWishlistAction } from "@/components/lists/useListActions";
import { formatMoney } from "@/lib/money";
import type { PdpLayout } from "@/lib/pdp-layouts";
import { ColorSwatches, type Swatch } from "./ColorSwatches";
import { Countdown } from "./Countdown";
import { PurchaseOptions, type PurchasePlan } from "./PurchaseOptions";
import { ShareModal } from "./ShareModal";
import { StickyAddToCart } from "./StickyAddToCart";
import { SizeGuideModal } from "./SizeGuideModal";
import extras from "./PurchaseExtras.module.css";
import styles from "./ProductInfo.module.css";

export type InfoVariant = {
  id: number;
  sku: string;
  sizeLabel: string;
  priceCents: number;
  compareAtCents: number | null;
  inStock: boolean;
  available: number;
};

type ProductInfoProps = {
  slug: string;
  name: string;
  badge: ProductBadge | null;
  shortDescription: string | null;
  rating: number;
  reviewCount: number;
  variants: InfoVariant[];
  defaultVariantId: number;
  categories: { slug: string; name: string }[];
  tags: string[];
  /** Which Figma layout is drawn (adds the colour chips, subscribe cards or sale countdown). */
  layout?: PdpLayout;
  colors?: Swatch[];
  /** End of the running sale in epoch ms, and the server clock when the page was built. */
  saleEndsAt?: number | null;
  serverNow: number;
  /** Shows the sticky add-to-cart bar on every screen (menu entry "Sticky add to card"); otherwise on phones only. */
  sticky?: boolean;
  /** First product picture, shown in the sticky bar. */
  image?: string;
};

const BADGE_TEXT: Record<ProductBadge, string> = {
  "best-seller": "Best seller",
  new: "New",
  trending: "Trending",
  hot: "Hot",
};

const TRUST = [
  { icon: "truck", title: "Ships fast", text: "Within 24 hours" },
  { icon: "refresh", title: "Free exchange", text: "30-Day shade guarantee" },
  { icon: "leaf", title: "Clean formula", text: "Talc & cruelty free" },
] as const;

/** "15ml" -> "15 ml", as the size selector shows it. */
const displaySize = (label: string) => label.replace(/^(\d+(?:\.\d+)?)(ml|g)/i, "$1 $2");

/** Product summary and purchase panel. Figma 3:12769 (575 wide). Cart/wishlist/compare are wired in P5. */
export function ProductInfo(props: ProductInfoProps) {
  const { name, badge, shortDescription, rating, reviewCount, variants, categories, tags } = props;
  const [variantId, setVariantId] = useState(props.defaultVariantId);
  const [qty, setQty] = useState(1);
  const [modal, setModal] = useState<"size-guide" | "share" | null>(null);
  const layout = props.layout ?? "details-default";
  const colors = props.colors ?? [];
  const [color, setColor] = useState(colors[0]?.slug ?? "");
  const [plan, setPlan] = useState<PurchasePlan>("once");
  const router = useRouter();
  const { add, busy } = useCart();
  const wishlist = useWishlistAction(props.slug, name);
  const compare = useCompareAction(props.slug, name);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  if (!variant) return null;
  const maxQty = Math.max(1, variant.available);
  const onSale = Boolean(variant.compareAtCents && variant.compareAtCents > variant.priceCents);
  const savePercent = variant.compareAtCents
    ? Math.round(((variant.compareAtCents - variant.priceCents) / variant.compareAtCents) * 100)
    : 0;
  const saleLayout = layout === "on-sale-countdown";
  const subscribeOnly = layout === "subscribe-and-save" && plan === "subscribe";
  const canBuy = variant.inStock && !busy && !subscribeOnly;

  function selectVariant(id: number) {
    setVariantId(id);
    setQty(1);
  }

  return (
    <div className={styles.info}>
      <div className={styles.status}>
        {badge ? <span className={styles.badge}>{BADGE_TEXT[badge]}</span> : null}
        <span className={styles.stock} data-testid="stock-status">
          {variant.inStock ? "In Stock" : "Out of stock"}
        </span>
      </div>

      <h1 className={styles.title}>{name}</h1>
      {shortDescription ? <p className={styles.description}>{shortDescription}</p> : null}

      <div className={styles.ratingRow}>
        <Rating value={rating} />
        <span>{rating.toFixed(1)}</span>
        <span>[{reviewCount} Review]</span>
        <span className={styles.verified}>
          <Icon name="check-circle" size={12} />
          Verified
        </span>
      </div>

      <p className={styles.price} data-testid="price">
        {saleLayout && onSale ? (
          <s className={styles.compare}>{formatMoney(variant.compareAtCents ?? 0, "full")}</s>
        ) : null}
        <span className={styles.amount}>{formatMoney(variant.priceCents, "full")}</span>
        {!saleLayout && onSale ? (
          <s className={styles.compare}>{formatMoney(variant.compareAtCents ?? 0, "full")}</s>
        ) : null}
        <span className={styles.unit}>/ {variant.sizeLabel}</span>
        {saleLayout && onSale ? (
          <span className={styles.saveBadge} data-testid="save-badge">
            SAVE {savePercent}%
          </span>
        ) : null}
      </p>

      {saleLayout && props.saleEndsAt && onSale ? (
        <Countdown endsAt={props.saleEndsAt} serverNow={props.serverNow} />
      ) : null}

      {variants.length > 1 ? (
        <div className={styles.sizes} role="radiogroup" aria-label="Size">
          <span className={styles.sizeLabel}>Size:</span>
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === variantId}
              aria-disabled={!v.inStock}
              data-soldout={!v.inStock || undefined}
              className={styles.size}
              onClick={() => v.inStock && selectVariant(v.id)}
            >
              {displaySize(v.sizeLabel)}
            </button>
          ))}
          <button
            type="button"
            className={styles.sizeGuide}
            onClick={() => setModal("size-guide")}
            aria-haspopup="dialog"
            data-testid="size-guide-link"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/share/size-guide.svg" alt="" width={15} height={15} />
            <span>Size guide</span>
          </button>
        </div>
      ) : null}

      {layout === "product-color" && colors.length > 0 ? (
        <ColorSwatches colors={colors} value={color} onChange={setColor} />
      ) : null}

      {layout === "subscribe-and-save" ? (
        <>
          <PurchaseOptions priceCents={variant.priceCents} plan={plan} onChange={setPlan} />
          {subscribeOnly ? (
            <p className={extras.note} role="status" data-testid="subscribe-note">
              Subscriptions are not available yet. Choose &ldquo;One-Time Purchase&rdquo; to order
              this product.
            </p>
          ) : null}
        </>
      ) : null}

      <div className={styles.buy} id="buy-row">
        <div className={styles.qty} data-testid="quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Icon name="minus" size={20} />
          </button>
          <output aria-live="polite">{String(qty).padStart(2, "0")}</output>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={qty >= maxQty}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
        <button
          type="button"
          className={styles.add}
          disabled={!canBuy}
          data-testid="add-to-cart"
          onClick={() => void add({ variantId: variant.id, name }, qty)}
        >
          Add to cart
          <Icon name="shopping-bag" size={15} />
        </button>
        <button
          type="button"
          className={styles.buyNow}
          disabled={!canBuy}
          data-testid="buy-now"
          onClick={async () => {
            // "Buy now" adds the item and goes straight to checkout
            if (await add({ variantId: variant.id, name }, qty, { openDrawer: false })) {
              router.push("/checkout");
            }
          }}
        >
          Buy now
          <Icon name="arrow-up-right" size={18} />
        </button>
      </div>

      <ul className={styles.actions}>
        <li>
          <button
            type="button"
            data-testid="compare"
            aria-pressed={compare.active}
            onClick={compare.add}
          >
            <Icon name="shuffle" size={16} />
            {compare.active ? "In compare" : "Compare product"}
          </button>
        </li>
        <li>
          <button
            type="button"
            data-testid="wishlist"
            aria-pressed={wishlist.active}
            onClick={wishlist.toggle}
          >
            <Icon name="heart" size={16} filled={wishlist.active} />
            {wishlist.active ? "In wishlist" : "Add to wishlist"}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => setModal("share")}
            aria-haspopup="dialog"
            data-testid="share"
          >
            <Icon name="share" size={16} />
            Share
          </button>
        </li>
      </ul>

      <ul className={styles.trust}>
        {TRUST.map((t) => (
          <li key={t.title}>
            <Icon name={t.icon} size={16} />
            <strong>{t.title}</strong>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>

      <dl className={styles.meta}>
        <div>
          <dt>SKU:</dt>
          <dd data-testid="sku">#{variant.sku}</dd>
        </div>
        {tags.length > 0 ? (
          <div>
            <dt>Tags:</dt>
            <dd>{tags.join(", ")}</dd>
          </div>
        ) : null}
        {categories.length > 0 ? (
          <div>
            <dt>Categories:</dt>
            <dd>
              {categories.map((c, i) => (
                <span key={c.slug}>
                  {i > 0 ? ", " : ""}
                  <Link href={`/shop?category=${c.slug}`}>{c.name}</Link>
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className={styles.secure}>
        <p>Guaranteed safe &amp; secure checkout</p>
        <Image
          src="/images/ui/payments.svg"
          alt="Accepted payment methods"
          width={264}
          height={24}
          unoptimized
        />
      </div>
      <StickyAddToCart
        phoneOnly={!props.sticky}
        name={name}
        image={props.image}
        priceCents={variant.priceCents}
        sizeLabel={variant.sizeLabel}
        disabled={!canBuy}
        watch="buy-row"
        onAdd={() => void add({ variantId: variant.id, name }, qty)}
      />
      {modal === "size-guide" ? <SizeGuideModal onClose={() => setModal(null)} /> : null}
      {modal === "share" ? (
        <ShareModal slug={props.slug} name={name} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}
