"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { JOURNAL_LINKS, PAGES_LINKS, SHOP_MEGA, type MenuLink } from "@/config/navigation";
import { site } from "@/config/site";
import { useCurrentUser } from "@/lib/demo-store/account";
import { useList } from "@/lib/lists";
import { MenuBadge } from "./MenuBadge";
import styles from "./MobileMenu.module.css";

type Props = {
  /** Category links, the same ones the desktop "Categories" dropdown shows. */
  categories: { label: string; href: string }[];
  className?: string;
};

/**
 * Menu button and drawer for tablets and phones (up to 1100 px). Proposed design (docs/responsive-spec.md 5.2):
 * a left drawer with accordions holding every entry of the desktop menus, plus search, account and wishlist.
 * Escape, the scrim and the close button close it; focus stays inside and returns to the button.
 */
export function MobileMenu({ categories, className }: Props) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const { user } = useCurrentUser();
  const wishlist = useList("wishlist");

  useEffect(() => {
    if (!open) return;
    const button = opener.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input, summary, [tabindex]:not([tabindex='-1'])",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      button?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  const links = (items: MenuLink[]) => (
    <ul className={styles.links}>
      {items.map((link) => (
        <li key={link.href + link.label}>
          <Link href={link.href} onClick={close}>
            {link.label}
            {link.badge ? <MenuBadge kind={link.badge} /> : null}
          </Link>
        </li>
      ))}
    </ul>
  );

  const drawer = (
    <div className={styles.overlay} data-testid="mobile-menu-overlay">
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close menu"
        tabIndex={-1}
        onClick={close}
      />
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        id="mobile-menu"
        data-testid="mobile-menu"
      >
        <header className={styles.head}>
          <h2 id="mobile-menu-title">Menu</h2>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Close menu"
            data-autofocus
          >
            <Icon name="x" size={20} />
          </button>
        </header>

        <form role="search" action="/search" className={styles.search} onSubmit={close}>
          <label className="visually-hidden" htmlFor="mobile-menu-search">
            Search our collection
          </label>
          <Icon name="search" size={18} />
          <input
            id="mobile-menu-search"
            name="q"
            type="search"
            placeholder="Search products"
            enterKeyHint="search"
          />
        </form>

        <nav aria-label="Menu" className={styles.nav}>
          <ul className={styles.top}>
            <li>
              <Link href="/" onClick={close} className={styles.topLink}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={close} className={styles.topLink}>
                About us
              </Link>
            </li>
            <li>
              <details className={styles.group} name="mobile-menu-group">
                <summary>
                  <span>Shop</span>
                  <Icon name="chevron-down" size={16} />
                </summary>
                <div className={styles.body}>
                  <Link href="/shop" onClick={close} className={styles.all}>
                    All products
                  </Link>
                  {SHOP_MEGA.columns.map((column) => (
                    <section key={column.title} aria-label={column.title}>
                      <h3>{column.title}</h3>
                      {links(column.links)}
                    </section>
                  ))}
                  <ul className={styles.promos}>
                    {SHOP_MEGA.promos.map((promo) => (
                      <li key={promo.label}>
                        <Link href={promo.href} onClick={close}>
                          <Image src={promo.image} alt={promo.alt} width={160} height={120} />
                          <span>{promo.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </li>
            {categories.length > 0 ? (
              <li>
                <details className={styles.group} name="mobile-menu-group">
                  <summary>
                    <span>Categories</span>
                    <Icon name="chevron-down" size={16} />
                  </summary>
                  <div className={styles.body}>
                    <Link href="/categories" onClick={close} className={styles.all}>
                      All categories
                    </Link>
                    {links(categories.map((c) => ({ label: c.label, href: c.href })))}
                  </div>
                </details>
              </li>
            ) : null}
            <li>
              <details className={styles.group} name="mobile-menu-group">
                <summary>
                  <span>Pages</span>
                  <Icon name="chevron-down" size={16} />
                </summary>
                <div className={styles.body}>{links(PAGES_LINKS)}</div>
              </details>
            </li>
            <li>
              <details className={styles.group} name="mobile-menu-group">
                <summary>
                  <span>Journal</span>
                  <Icon name="chevron-down" size={16} />
                </summary>
                <div className={styles.body}>{links(JOURNAL_LINKS)}</div>
              </details>
            </li>
          </ul>
        </nav>

        <ul className={styles.account} aria-label="Your account">
          <li>
            <Link href={user ? "/account" : "/login"} onClick={close}>
              <Icon name="user" size={18} />
              <span>{user ? `My account (${user.username})` : "Log in or register"}</span>
            </Link>
          </li>
          <li>
            <Link href="/wishlist" onClick={close}>
              <Icon name="heart" size={18} />
              <span>Wishlist{wishlist.slugs.length > 0 ? ` (${wishlist.slugs.length})` : ""}</span>
            </Link>
          </li>
          <li>
            <Link href="/compare" onClick={close}>
              <Icon name="compare-arrows" size={18} />
              <span>Compare</span>
            </Link>
          </li>
          <li>
            <Link href="/track-order" onClick={close}>
              <Icon name="shopping-bag" size={18} />
              <span>Track order</span>
            </Link>
          </li>
          <li>
            <Link href="/store-locator" onClick={close}>
              <Icon name="map-pin" size={18} />
              <span>Store locator</span>
            </Link>
          </li>
        </ul>
        <p className={styles.est}>
          {site.name} · Est {site.foundedYear} · {site.contact.city}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`${styles.root} ${className ?? ""}`}>
      <button
        ref={opener}
        type="button"
        className={styles.button}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-haspopup="dialog"
        data-testid="mobile-menu-button"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={22} />
      </button>
      {open ? createPortal(drawer, document.body) : null}
    </div>
  );
}
