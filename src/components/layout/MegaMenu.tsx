import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SHOP_MEGA, type MenuLink } from "@/config/navigation";
import { MenuBadge } from "./MenuBadge";
import styles from "./MegaMenu.module.css";
import { NavLink } from "./NavLink";

/**
 * Shop mega menu: three link columns and two promo cards in a full-width panel under the header.
 * Figma 3:1452. Opens on hover and on keyboard focus (CSS only); the page behind is dimmed.
 */
export function MegaMenu() {
  return (
    <div className={styles.mega} data-menu-panel data-testid="mega-menu">
      <div className={styles.inner}>
        <div className={styles.columns}>
          {SHOP_MEGA.columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className={styles.column}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((link) => (
                  <MegaItem key={link.label} link={link} />
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <ul className={styles.promos}>
          {SHOP_MEGA.promos.map((promo) => (
            <li key={promo.label}>
              <Link href={promo.href} className={styles.promo}>
                <span className={styles.photo}>
                  <Image src={promo.image} alt={promo.alt} fill sizes="330px" />
                </span>
                <span className={styles.promoLabel}>
                  {promo.label}
                  <Icon name="arrow-up-right" size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MegaItem({ link }: { link: MenuLink }) {
  return (
    <li>
      <NavLink
        href={link.href}
        match={link.match}
        className={`${styles.link} m-link`}
        activeClassName={styles.current}
      >
        {link.label}
        {link.badge ? <MenuBadge kind={link.badge} /> : null}
      </NavLink>
    </li>
  );
}
