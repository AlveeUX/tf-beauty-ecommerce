import type { ProductSummary } from "@/lib/catalog-types";
import styles from "./ProductCarousel.module.css";
import { ProductTrack } from "./ProductTrack";

type ProductCarouselProps = {
  title: string;
  products: ProductSummary[];
  headingLevel?: 2 | 3;
};

/** Titled row of product cards ("More from collection", "Related products"). */
export function ProductCarousel({ title, products, headingLevel = 2 }: ProductCarouselProps) {
  if (products.length === 0) return null;
  const Heading = `h${headingLevel}` as const;
  return (
    <section className={styles.section} aria-label={title}>
      <Heading className={styles.heading} data-reveal="fade-up">
        {title}
      </Heading>
      <div className={styles.frame}>
        <ProductTrack products={products} label={title} reveal />
      </div>
    </section>
  );
}
