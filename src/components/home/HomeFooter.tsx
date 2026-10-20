import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { HomeNewsletter } from "./HomeNewsletter";
import styles from "./HomeChrome.module.css";
import { site } from "@/config/site";

type Column = { title: string; links: { label: string; href: string; active?: boolean }[] };

/** Figma order: Shop now, Quick link, Get help, Socials (3:3311..3:3320). */
const COLUMNS: Column[] = [
  {
    title: "Shop now",
    links: [
      { label: "All Products", href: "/shop", active: true },
      { label: "Best Sellers", href: "/shop?badge=best-seller" },
      { label: "Skincare", href: "/shop?category=skincare" },
      { label: "Sets & Bundles", href: "/shop?collection=sets-bundles" },
      { label: "New Arrivals", href: "/shop?badge=new" },
      { label: "Categories", href: "/categories" },
    ],
  },
  {
    title: "Quick link",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Ingredients", href: "/blog" },
      { label: "Skin Journal", href: "/blog" },
      { label: "Reviews", href: "/shop" },
      { label: "FAQs", href: "/faqs" },
      { label: "Pricing", href: "/shop" },
    ],
  },
  {
    title: "Get help",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Shipping", href: "/policy/shipping" },
      { label: "Returns", href: "/policy/returns" },
      { label: "Track Order", href: "/track-order" },
      { label: "Privacies", href: "/policy/privacy" },
      { label: "Teams", href: "/policy/terms" },
    ],
  },
];

const SOCIALS = [
  { label: "Facebook", icon: "soc-facebook", network: "facebook", active: true },
  { label: "Instagram", icon: "soc-instagram", network: "instagram" },
  { label: "Twitter", icon: "soc-twitter", network: "twitter" },
  { label: "Linked-in", icon: "soc-linkedin", network: "linkedin" },
] as const;

/** Card logos, placed as in the design: [file, left in the 36px box, top in the 24px box]. */
const PAYMENTS = [
  { name: "Visa", file: "pay-visa", box: false },
  { name: "Mastercard", file: "pay-mc", box: true, x: 3.46, y: 2.9 },
  { name: "American Express", file: "pay-amex", box: true, x: 1.4, y: 5.3 },
  { name: "Discover", file: "pay-discover", box: true, x: 3.1, y: 5.9 },
  { name: "Bitcoin", file: "pay-bitcoin", box: true, x: 10.1, y: 3.4 },
  { name: "PayPal", file: "pay-paypal", box: true, x: 11.7, y: 4.5 },
] as const;

const ASSET = "/images/home/footer";

/** Home footer: dark, with a newsletter card and dashed grid lines. Figma 3:3232 (1920 x 803). */
export function HomeFooter({ portrait }: { portrait?: string | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <span className={`${styles.edge} ${styles.edgeLeft}`} aria-hidden="true" />
      <span className={`${styles.edge} ${styles.edgeRight}`} aria-hidden="true" />
      <span className={`${styles.rule} ${styles.ruleTop}`} aria-hidden="true" />
      <span className={`${styles.rule} ${styles.ruleBottom}`} aria-hidden="true" />

      <div className={styles.footInner}>
        <Image
          src={`${ASSET}/bcorp.svg`}
          alt="Certified B Corporation"
          width={72}
          height={121}
          unoptimized
          className={styles.bcorp}
        />

        <div className={styles.newsletter}>
          <div className={styles.portrait}>
            {portrait ? <Image src={portrait} alt="" fill sizes="171px" /> : null}
          </div>
          <p className={styles.pitch}>Get skincare tips, product drops and exclusive offers.</p>
          <HomeNewsletter />
        </div>

        <div className={styles.columns}>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className={l.active ? styles.footActive : undefined}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <nav aria-label="Socials">
            <h2>Socials</h2>
            <ul className={styles.socials}>
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={site.socials[s.network]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={"active" in s ? styles.footActive : undefined}
                  >
                    <Image
                      src={`${ASSET}/${s.icon}.svg`}
                      alt=""
                      width={28}
                      height={28}
                      unoptimized
                    />
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className={styles.copy}>
          © {year} <strong>{site.name}.</strong> All rights reserved.
        </p>

        <ul className={styles.payments} aria-label="Accepted payment methods">
          {PAYMENTS.map((p) => (
            <li key={p.name} data-box={p.box || undefined} title={p.name}>
              <Image
                src={`${ASSET}/${p.file}.svg`}
                alt={p.name}
                width={p.box ? 30 : 36}
                height={p.box ? 20 : 24}
                unoptimized
                style={p.box ? { left: p.x, top: p.y } : undefined}
              />
            </li>
          ))}
        </ul>

        <p className={styles.est}>
          <span>Est</span>
          <span>{site.foundedYear}</span>
          <span>{site.contact.city}</span>
          <Image src={`${ASSET}/dot.svg`} alt="" width={3} height={3} unoptimized />
          <Image src={`${ASSET}/dot.svg`} alt="" width={3} height={3} unoptimized />
        </p>
      </div>

      <a href="#top" className={styles.toTop} aria-label="Back to top">
        <Icon name="arrow-up" size={20} />
      </a>
    </footer>
  );
}
