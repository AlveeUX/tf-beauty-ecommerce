import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CounterLink } from "@/components/layout/CounterLink";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { MenuBadge } from "@/components/layout/MenuBadge";
import { NavLink } from "@/components/layout/NavLink";
import { JOURNAL_LINKS, PAGES_LINKS, type MenuLink } from "@/config/navigation";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { AccountLink } from "@/components/account/AccountLink";
import { Icon } from "@/components/ui/Icon";
import type { NavLink as HeaderLink } from "@/components/layout/Header";
import type { ProductSummary } from "@/lib/catalog-types";
import styles from "./HomeChrome.module.css";
import { site } from "@/config/site";
import { freeShippingAnnouncement } from "@/lib/shipping-copy";
import { MobileMenu } from "@/components/layout/MobileMenu";

type HomeHeaderProps = {
  categories: HeaderLink[];
  trending: ProductSummary[];
  announcements?: string[];
};

/** Home header: dark and translucent, laid over the hero. Figma 3:2336 (Home Morden cosmetics). */
export function HomeHeader({
  categories,
  trending,
  announcements = [freeShippingAnnouncement()],
}: HomeHeaderProps) {
  const nav: {
    label: string;
    href: string;
    children?: MenuLink[];
    mega?: boolean;
    active?: boolean;
  }[] = [
    { label: "Home", href: "/", active: true },
    { label: "Shop", href: "/shop", mega: true },
    { label: "Categories", href: "/categories", children: categories },
    { label: "Pages", href: "/about", children: PAGES_LINKS },
    { label: "Journal", href: "/blog", children: JOURNAL_LINKS },
  ];

  return (
    <header className={styles.header}>
      <AnnouncementBar
        tone="dark"
        messages={announcements}
        left={
          <>
            <i aria-hidden="true" />
            <span>Limited edition studio release</span>
          </>
        }
      />
      <div className={styles.main}>
        <MobileMenu categories={categories} className={styles.menuSlot} />
        <Link href="/" className={styles.logo} aria-label={`${site.name} ${site.tagline}, home`}>
          <span className={styles.wordmark}>{site.name}</span>{" "}
          <span className={styles.tagline}>{site.tagline}</span>
        </Link>

        <nav aria-label="Primary" className={styles.nav}>
          <ul>
            {nav.map((item) => (
              <li key={item.label} className={styles.navItem} data-mega={item.mega || undefined}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${item.active ? styles.active : "m-link"}`}
                  aria-current={item.active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  {item.children || item.mega ? <Icon name="chevron-down" size={14} /> : null}
                </Link>
                {item.mega ? <MegaMenu /> : null}
                {item.children && item.children.length > 0 ? (
                  <ul className={styles.dropdown} data-menu-panel>
                    {item.children.map((child) => (
                      <li key={child.href + child.label}>
                        <NavLink
                          href={child.href}
                          match={child.match}
                          className={styles.dropLink}
                          activeClassName={styles.current}
                        >
                          {child.label}
                          {child.badge ? <MenuBadge kind={child.badge} /> : null}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.tools}>
          <SearchOverlay trending={trending} trigger="field" />
          <ul className={styles.icons}>
            <li className={styles.phoneHide}>
              <AccountLink />
            </li>
            <li className={styles.phoneHide}>
              <CounterLink kind="wishlist" badgeClassName={styles.badge}>
                <Icon name="heart" size={18} />
              </CounterLink>
            </li>
            <li>
              <CounterLink kind="cart" badgeClassName={styles.badge}>
                <Icon name="shopping-bag" size={18} />
              </CounterLink>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
