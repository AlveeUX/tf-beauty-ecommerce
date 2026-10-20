import Image from "next/image";
import styles from "./BenefitStrip.module.css";
import { site } from "@/config/site";
import { freeShippingFrom } from "@/lib/shipping-copy";

export type Benefit = { icon: string; title: string; text: string };

/** Placeholder copy from the design; managed from the admin in P9 (ACN-003). */
const DEFAULT_BENEFITS: Benefit[] = [
  {
    icon: "/images/ui/benefit-free-shipping.svg",
    title: "Free Shipping",
    text: `Enjoy free shipping on orders over ${freeShippingFrom()}, carefully packed and delivered to you.`,
  },
  {
    icon: "/images/ui/benefit-easy-returns.svg",
    title: "Easy Returns",
    text: `Not the right fit? Enjoy easy returns within ${site.commerce.returnWindowDays} days on eligible, unopened products.`,
  },
  {
    icon: "/images/ui/benefit-secure-checkout.svg",
    title: "Secure Checkout",
    text: "Shop with confidence through our safe and secure checkout, designed to protect.",
  },
  {
    icon: "/images/ui/benefit-support.svg",
    title: "Beauty Support",
    text: "Need help choosing a product? Our support team is here to answer your questions.",
  },
];

/** Dark four-up strip shown above the footer on inner pages. Figma 3:4859. */
export function BenefitStrip({ benefits = DEFAULT_BENEFITS }: { benefits?: Benefit[] }) {
  return (
    <section className={styles.strip} aria-label="Why shop with us">
      <ul className={`container ${styles.grid}`}>
        {benefits.map((b) => (
          <li key={b.title} className={styles.card}>
            <Image src={b.icon} alt="" width={64} height={64} unoptimized />
            <h2>{b.title}</h2>
            <p>{b.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
