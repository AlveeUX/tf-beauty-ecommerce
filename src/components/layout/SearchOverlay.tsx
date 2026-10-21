"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import type { ProductSummary } from "@/lib/catalog-types";
import { formatMoney } from "@/lib/money";
import styles from "./SearchOverlay.module.css";

type Suggestions = { products: ProductSummary[]; categories: { slug: string; name: string }[] };

const POPULAR = [
  { label: "Skincare", href: "/shop?category=skincare" },
  { label: "Makeup", href: "/shop?category=makeup" },
  { label: "Body care", href: "/shop?q=body" },
  { label: "Best seller", href: "/shop?badge=best-seller" },
];

const BADGE_TEXT = {
  "best-seller": "Best seller",
  new: "New",
  trending: "Trending",
  hot: "Hot",
} as const;

/**
 * Search trigger (header icon) and the full-width search overlay. Figma 3:16254.
 * Typing fetches live suggestions from /api/search; Enter opens the full results page (/search?q=).
 * Without JavaScript the icon is a plain link to /search.
 */
export function SearchOverlay({
  trending,
  trigger = "icon",
}: {
  trending: ProductSummary[];
  /** "field" renders the Home header's "Search Product..." box instead of the icon. */
  trigger?: "icon" | "field";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<{ term: string; data: Suggestions } | null>(null);
  const [failed, setFailed] = useState(false);

  const trimmed = term.trim();
  const active = trimmed.length >= 2;
  // Only show suggestions that belong to the current term (avoids stale flashes while typing).
  const suggestions = active && result?.term === trimmed ? result.data : null;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        setResult({ term: trimmed, data: (await res.json()) as Suggestions });
        setFailed(false);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailed(true);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, trimmed]);

  // Click on the backdrop closes the dialog.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === el) el.close();
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

  function open() {
    dialog.current?.showModal();
    input.current?.focus();
  }

  function close() {
    dialog.current?.close();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!trimmed) return;
    close();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const showProducts = active ? (suggestions?.products ?? []) : trending;

  return (
    <>
      {trigger === "field" ? (
        <button
          type="button"
          className={styles.fieldTrigger}
          aria-haspopup="dialog"
          aria-label="Search Product..."
          data-testid="search-trigger"
          onClick={open}
        >
          <Icon name="search" size={18} />
          <span>Search Product...</span>
        </button>
      ) : (
        <Link
          href="/search"
          aria-label="Search"
          aria-haspopup="dialog"
          data-testid="search-trigger"
          onClick={(e) => {
            e.preventDefault();
            open();
          }}
        >
          <Icon name="search" size={18} />
        </Link>
      )}

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label="Search"
        data-testid="search-dialog"
      >
        <button type="button" className={styles.close} onClick={close} aria-label="Close search">
          <Icon name="x" size={24} strokeWidth={1.3} />
        </button>

        <div className={styles.panel}>
          <h2 className={styles.title}>Search our collection</h2>

          <form role="search" className={styles.field} onSubmit={submit} action="/search">
            <button type="submit" className={styles.submit} aria-label="Search">
              <Icon name="search" size={20} />
            </button>
            <label className="visually-hidden" htmlFor="site-search">
              Search products, ingredients and categories
            </label>
            <input
              ref={input}
              id="site-search"
              name="q"
              type="search"
              autoComplete="off"
              maxLength={80}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search product, ingredients, categories....."
            />
          </form>

          <div className={styles.popular}>
            <span>Popular:</span>
            <ul>
              {POPULAR.map((p, i) => (
                <li key={p.label}>
                  <Link href={p.href} onClick={close} data-active={i === 0 || undefined}>
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="container" style={{ padding: 0 }}>
            <h3 className={styles.heading}>
              {active ? `Results for “${trimmed}”` : "Trending Product"}
            </h3>

            {active && suggestions && suggestions.categories.length > 0 ? (
              <ul className={styles.categories}>
                {suggestions.categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/shop?category=${c.slug}`} onClick={close}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {failed ? (
              <p role="alert" className={styles.note}>
                Search is unavailable right now. Press Enter to search on the results page.
              </p>
            ) : null}

            {active && suggestions && showProducts.length === 0 ? (
              <p role="status" className={styles.note} data-testid="search-empty">
                No products match “{trimmed}”.
              </p>
            ) : null}

            <ul className={styles.grid} data-testid="search-results">
              {showProducts.slice(0, 4).map((p) => (
                <li key={p.slug}>
                  <article className={styles.card}>
                    <Link href={`/product/${p.slug}`} onClick={close} className={styles.media}>
                      <Image src={p.image} alt="" fill sizes="308px" />
                      {p.badge ? <span className={styles.badge}>{BADGE_TEXT[p.badge]}</span> : null}
                    </Link>
                    <div className={styles.row}>
                      <h4>
                        <Link href={`/product/${p.slug}`} onClick={close}>
                          {p.name}
                        </Link>
                      </h4>
                      <p>
                        {p.compareAtCents && p.compareAtCents > p.priceCents ? (
                          <s>{formatMoney(p.compareAtCents)}</s>
                        ) : null}
                        <strong>{formatMoney(p.priceCents)}</strong>
                      </p>
                    </div>
                    <p className={styles.label}>{p.label}</p>
                    <Rating value={p.rating} count={p.reviewCount} />
                  </article>
                </li>
              ))}
            </ul>

            {active && suggestions && showProducts.length > 0 ? (
              <p className={styles.all}>
                <Link href={`/search?q=${encodeURIComponent(trimmed)}`} onClick={close}>
                  View all results
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
