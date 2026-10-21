import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NewsletterForm } from "./NewsletterForm";
import styles from "./Footer.module.css";
import { site } from "@/config/site";
import { SocialsStrip } from "@/components/ui/SocialsStrip";
import { FooterGroup } from "./FooterGroup";

type FooterLink = { label: string; href: string; active?: boolean };

const SHOP_NOW: FooterLink[] = [
  { label: "All Products", href: "/shop", active: true },
  { label: "Best Sellers", href: "/shop?badge=best-seller" },
  { label: "Skincare", href: "/category/skincare" },
  { label: "Sets & Bundles", href: "/shop?collection=sets-bundles" },
  { label: "New Arrivals", href: "/shop?badge=new" },
  { label: "Categories", href: "/categories" },
  { label: "Offers", href: "/shop?availability=on-sale" },
];
const QUICK_LINK: FooterLink[] = [
  { label: "Our Story", href: "/about" },
  { label: "Ingredients", href: "/blog" },
  { label: "Skin Journal", href: "/blog" },
  { label: "Reviews", href: "/shop" },
  { label: "FAQs", href: "/faqs" },
  { label: "Pricing", href: "/shop" },
  { label: "Docs", href: "/policy/terms" },
];
const GET_HELP: FooterLink[] = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping", href: "/policy/shipping" },
  { label: "Returns", href: "/policy/returns" },
  { label: "Track Order", href: "/track-order" },
  { label: "Privacies", href: "/policy/privacy" },
  { label: "Teams", href: "/policy/terms" },
  { label: "Online", href: "/store-locator" },
];

/** Site footer. Figma 3:5861. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.newsletter}>
          <p className={styles.pitch}>Get skincare tips, product drops and exclusive offers.</p>
          <NewsletterForm />
          <Image
            className={styles.payments}
            src="/images/ui/payments.svg"
            alt="Accepted payment methods: Visa, Mastercard, American Express, Discover, Bitcoin, PayPal"
            width={264}
            height={24}
            unoptimized
          />
        </div>
        <FooterColumn title="Shop now" links={SHOP_NOW} />
        <FooterColumn title="Quick link" links={QUICK_LINK} />
        <FooterColumn title="Get help" links={GET_HELP} />
      </div>

      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copy}>
            © {year} <strong>{site.name}.</strong> All rights reserved.
          </p>
          <Link href="/" className={styles.logo} aria-label={`${site.name} ${site.tagline}, home`}>
            <span className={styles.wordmark}>{site.name}</span>{" "}
            <span className={styles.tagline}>{site.tagline}</span>
          </Link>
          <SocialsStrip mode="profile" className={styles.socials} />
        </div>
        <a href="#top" className={`${styles.toTop} m-ring`} aria-label="Back to top">
          <Icon name="arrow-up" size={20} />
        </a>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <FooterGroup title={title} className={styles.column} headingClassName={styles.heading}>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={link.active ? styles.active : "m-link"}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </FooterGroup>
  );
}
