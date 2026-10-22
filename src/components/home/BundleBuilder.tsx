"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Icon } from "@/components/ui/Icon";
import type { ProductSummary } from "@/lib/catalog-types";
import { formatMoney } from "@/lib/money";
import { flagOn, prefersReducedMotion, subscribeReducedMotion } from "@/lib/motion";
import styles from "./BundleBuilder.module.css";

type BundleItem = ProductSummary & { imageCrop?: { height: number; top: number } };
export type Bundle = { label: string; products: BundleItem[]; discountPercent: number };

/** After a click on a tab the tabs stay where the visitor put them for this long, then switching by itself resumes. */
const HOLD_MS = 10_000;

/** "Barely There" -> the unit stays lowercase inside the uppercase label, as in the design. */
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

/**
 * "Explore bundle" tabs with three items and a bundle total (HOM-007, Figma 3:3364).
 * Bundle price = sum of the items minus the discount; the bundle adds all its items to the cart.
 */
export function BundleBuilder({ bundles }: { bundles: Bundle[] }) {
  const [active, setActive] = useState(0);
  const { addMany, busy } = useCart();

  // Switching by itself: the black rule under the active tab fills over 3 s (CSS, BundleBuilder.module.css) and the next tab opens
  // when it is full. A click on a tab holds it for HOLD_MS. It waits while the tabs are off screen or the page is in a hidden tab,
  // and does not run for visitors who asked for less motion or when the setting (src/config/motion.ts) is off.
  // false on the server and during hydration, so the markup matches
  const enabled = useSyncExternalStore(
    subscribeReducedMotion,
    () =>
      bundles.length > 1 &&
      flagOn("tabsAutoplay") &&
      document.documentElement.dataset.motion !== "off" &&
      !prefersReducedMotion(),
    () => false,
  );
  const [holding, setHolding] = useState(false);
  const [idle, setIdle] = useState(true);
  const tabs = useRef<HTMLDivElement>(null);
  const holdTimer = useRef(0);

  useEffect(() => {
    const el = tabs.current;
    if (!enabled || !el) return;
    let onScreen = false;
    const update = () => setIdle(!onScreen || document.hidden);
    const seen = new IntersectionObserver(
      ([entry]) => {
        onScreen = Boolean(entry?.isIntersecting);
        update();
      },
      { threshold: 0.5 },
    );
    seen.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      seen.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled]);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const choose = (index: number) => {
    setActive(index);
    if (!enabled) return;
    setHolding(true);
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setHolding(false), HOLD_MS);
  };

  const bundle = bundles[active];
  if (!bundle) return null;

  const subtotal = bundle.products.reduce((sum, p) => sum + p.priceCents, 0);
  const saving = Math.round((subtotal * bundle.discountPercent) / 100);
  const total = subtotal - saving;

  return (
    <div className={styles.bundle}>
      <div
        ref={tabs}
        role="tablist"
        aria-label="Bundles"
        className={styles.tabs}
        data-auto={enabled ? (holding ? "hold" : "run") : undefined}
        data-idle={idle || undefined}
        onAnimationEnd={(event) => {
          // the rule under the active tab has filled: open the next tab
          if (
            enabled &&
            !holding &&
            event.pseudoElement === "::after" &&
            event.animationName.includes("tabFill")
          ) {
            setActive((current) => (current + 1) % bundles.length);
          }
        }}
      >
        {bundles.map((b, i) => (
          <button
            key={b.label}
            type="button"
            role="tab"
            id={`bundle-tab-${i}`}
            aria-selected={i === active}
            aria-controls="bundle-panel"
            onClick={() => choose(i)}
          >
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      <div id="bundle-panel" role="tabpanel" aria-labelledby={`bundle-tab-${active}`}>
        <ul className={styles.items} data-reveal-stagger>
          {bundle.products.map((p, i) => (
            <li key={p.slug + i} data-reveal="fade-up">
              <Link href={`/product/${p.slug}`} className={styles.item}>
                <span className={styles.thumb}>
                  {p.imageCrop ? (
                    <Image
                      src={p.image}
                      alt=""
                      width={520}
                      height={645}
                      sizes="130px"
                      style={{
                        position: "absolute",
                        maxWidth: "none",
                        width: "100%",
                        height: `${p.imageCrop.height}%`,
                        top: `${p.imageCrop.top}%`,
                      }}
                    />
                  ) : (
                    <Image src={p.image} alt="" fill sizes="130px" />
                  )}
                </span>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}.</span>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.label}>{withUnit(p.label)}</span>
                <span className={styles.price}>{formatMoney(p.priceCents)}</span>
              </Link>
              {i < bundle.products.length - 1 ? (
                <span className={styles.plus} aria-hidden="true" data-reveal="scale" />
              ) : null}
            </li>
          ))}
        </ul>

        <div className={styles.total}>
          <p className={styles.sum} data-testid="bundle-total">
            <strong>{formatMoney(total, "full")}</strong>
            <s>{formatMoney(subtotal, "full")}</s>
            <em>
              <span>You save {formatMoney(saving)}</span>
            </em>
          </p>
          <p className={styles.note}>Includes curated shades customizable in bag prior.</p>
          <button
            type="button"
            className={`${styles.add} m-btn`}
            data-magnet
            disabled={busy}
            onClick={() => void addMany(bundle.products.map((p) => p.slug))}
          >
            <Icon name="shopping-bag" size={15} />
            <span>Add the bundle to cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
