import { pageMeta } from "@/lib/seo";
import { FreeShippingBar } from "@/components/cart/FreeShippingBar";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { ICON_NAMES, Icon } from "@/components/ui/Icon";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import { InteractiveDemos } from "@/components/ui-kit/InteractiveDemos";
import { TokenSwatch } from "@/components/ui-kit/TokenSwatch";
import styles from "@/components/ui-kit/UiKit.module.css";
import { site } from "@/config/site";

export const metadata = pageMeta({
  title: "UI kit",
  description: "Buttons, form fields, cards, colours and type of the template.",
  path: "/ui-kit",
  noindex: true,
});

const COLORS: [string, string][] = [
  ["--color-dark-01", "Primary text"],
  ["--color-dark-02", "Secondary text"],
  ["--color-dark-03", "Muted text"],
  ["--color-light-01", "Text on dark"],
  ["--color-bg-body", "Page background"],
  ["--color-bg-light-01", "Cards, footer"],
  ["--color-bg-light-02", "Progress tracks"],
  ["--color-bg-dark", "Dark sections"],
  ["--color-primary", "Buttons, badges, stars"],
  ["--color-secondary", "Links, active filters"],
  ["--color-accent-1", "Announcement bar"],
  ["--color-accent-2", "Verified"],
  ["--color-border-light", "Rules on light"],
  ["--color-border-dark", "Rules on dark"],
];

const TYPE_SIZES = [12, 14, 16, 20, 24, 56];

const SAMPLES: ProductCardData[] = [
  {
    slug: "glow-veil-highlighter",
    name: "Glow veil highlighter",
    label: "Highlighter · 8g",
    priceCents: 9600,
    compareAtCents: 11000,
    rating: 5,
    reviewCount: 30,
    badge: "new",
    image: "/images/products/glow-veil-highlighter.png",
  },
  {
    slug: "the-renewal-serum",
    name: "The renewal serum",
    label: "Serum · 30ml",
    priceCents: 4800,
    rating: 5,
    reviewCount: 184,
    badge: "best-seller",
    image: "/images/products/the-renewal-serum.png",
  },
  {
    slug: "luxe-matte-lipstick",
    name: "Luxe matte lipstick",
    label: "Lipstick · 3.5g",
    priceCents: 2100,
    compareAtCents: 2600,
    rating: 4,
    reviewCount: 97,
    badge: "hot",
    image: "/images/products/luxe-matte-lipstick.png",
    inStock: false,
  },
];

/**
 * UI kit: the shared building blocks of the template on one page, so a buyer can see what exists before
 * reusing it. Proposed page (not a Figma frame); it only uses the template's own components and tokens.
 */
export default function UiKitPage() {
  return (
    <>
      <PageHero title="UI kit" crumbs={[{ label: "UI kit" }]} />
      <div className={`container ${styles.page}`}>
        <p className={styles.intro} data-reveal="fade-up">
          Everything below is built from the components in <code>src/components</code> and the
          design tokens in <code>src/styles/tokens.css</code>. Brand name, contact details and shop
          rules come from <code>src/config/site.ts</code> ({site.name} here).
        </p>

        <section data-reveal="fade-up" className={styles.section} aria-labelledby="kit-colors">
          <h2 id="kit-colors">Colour tokens</h2>
          <ul className={styles.swatches}>
            {COLORS.map(([token, role]) => (
              <TokenSwatch key={token} token={token} role={role} />
            ))}
          </ul>
        </section>

        <section data-reveal="fade-up" className={styles.section} aria-labelledby="kit-type">
          <h2 id="kit-type">Typography</h2>
          <p className={styles.display}>Prata for headlines and the logo</p>
          <p className={styles.script}>Allura for accents</p>
          {TYPE_SIZES.map((size) => (
            <p key={size} style={{ fontSize: `${size / 16}rem` }} className={styles.typeRow}>
              Instrument Sans, {size}px: Thoughtful skincare for your everyday ritual
            </p>
          ))}
        </section>

        <section data-reveal="fade-up" className={styles.section} aria-labelledby="kit-buttons">
          <h2 id="kit-buttons">Buttons</h2>
          <div className={styles.row}>
            <Button icon="bell">Primary</Button>
            <Button variant="dark" icon="arrow-up-right">
              Dark
            </Button>
            <Button variant="outline">Outline</Button>
            <Button href="/shop" variant="dark">
              As a link
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section data-reveal="fade-up" className={styles.section} aria-labelledby="kit-prices">
          <h2 id="kit-prices">Rating, price and free shipping</h2>
          <div className={styles.row}>
            <Rating value={4.5} count={128} />
            <Price cents={4800} />
            <Price cents={4800} compareAtCents={6400} />
            <Price cents={4800} format="full" size="lg" />
          </div>
          <FreeShippingBar
            subtotalCents={4800}
            thresholdCents={site.commerce.freeShippingThresholdCents}
          />
          <FreeShippingBar
            variant="page"
            subtotalCents={12000}
            thresholdCents={site.commerce.freeShippingThresholdCents}
          />
        </section>

        <section data-reveal="fade-up" className={styles.section} aria-labelledby="kit-cards">
          <h2 id="kit-cards">Product cards</h2>
          <p className={styles.note}>
            New, best seller and hot badges, a struck-through price and the sold-out state.
          </p>
          <div className={styles.cards}>
            {SAMPLES.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        <InteractiveDemos />

        <section data-reveal="fade-up" className={styles.section} aria-labelledby="kit-icons">
          <h2 id="kit-icons">Icons ({ICON_NAMES.length})</h2>
          <ul className={styles.icons}>
            {ICON_NAMES.map((name) => (
              <li key={name} data-testid="ui-kit-icon">
                <Icon name={name} size={24} />
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <BenefitStrip />
    </>
  );
}
