import Link from "next/link";
import { AccountLink } from "@/components/account/AccountLink";
import { Icon } from "@/components/ui/Icon";
import type { ProductSummary } from "@/lib/catalog-types";
import { JOURNAL_LINKS, PAGES_LINKS, type MenuLink } from "@/config/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { CounterLink } from "./CounterLink";
import { MegaMenu } from "./MegaMenu";
import { MenuBadge } from "./MenuBadge";
import { NavLink } from "./NavLink";
import { SearchOverlay } from "./SearchOverlay";
import styles from "./Header.module.css";
import { site } from "@/config/site";
import { freeShippingAnnouncement } from "@/lib/shipping-copy";

export type NavLink = { label: string; href: string };
type NavItem = NavLink & { children?: MenuLink[]; mega?: boolean };

type HeaderProps = {
  announcements?: string[];
  categories?: NavLink[];
  /** Products shown in the search overlay before the visitor types. */
  trending?: ProductSummary[];
};

const DEFAULT_ANNOUNCEMENTS = [freeShippingAnnouncement()];

/** Primary header. Figma 3:5777 (main row) + 3:5794 (announcement bar). */
export function Header({
  announcements = DEFAULT_ANNOUNCEMENTS,
  categories = [],
  trending = [],
}: HeaderProps) {
  const left: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "About us", href: "/about" },
    { label: "Shop", href: "/shop", mega: true },
    { label: "Categories", href: "/categories", children: categories },
  ];
  const right: NavItem[] = [
    { label: "Pages", href: "/about", children: PAGES_LINKS },
    { label: "Journal", href: "/blog", children: JOURNAL_LINKS },
  ];

  return (
    <header className={styles.header}>
      <AnnouncementBar messages={announcements} />
      <div className={styles.main}>
        <nav aria-label="Primary" className={styles.navLeft}>
          <NavList items={left} />
        </nav>

        <Link href="/" className={styles.logo} aria-label={`${site.name} ${site.tagline}, home`}>
          <span className={styles.wordmark}>{site.name}</span>{" "}
          <span className={styles.tagline}>{site.tagline}</span>
        </Link>

        <nav aria-label="Secondary" className={styles.navRight}>
          <NavList items={right} />
          <span className={styles.divider} aria-hidden="true" />
          <ul className={styles.icons}>
            <li>
              <SearchOverlay trending={trending} />
            </li>
            <li>
              <AccountLink />
            </li>
            <li>
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
        </nav>
      </div>
    </header>
  );
}

function NavList({ items }: { items: NavItem[] }) {
  return (
    <ul className={styles.navList}>
      {items.map((item) => (
        <li key={item.label} className={styles.navItem} data-mega={item.mega || undefined}>
          <Link href={item.href} className={styles.navLink}>
            {item.label}
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
  );
}
