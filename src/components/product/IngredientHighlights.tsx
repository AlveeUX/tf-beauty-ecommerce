import Image from "next/image";
import type { ProductContent } from "@/lib/product-content";
import styles from "./IngredientHighlights.module.css";

/** "Formulated for renewal": three key-ingredient cards. Figma 3:13279. */
export function IngredientHighlights({
  highlights,
}: {
  highlights: NonNullable<ProductContent["highlights"]>;
}) {
  if (highlights.items.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="highlights-title">
      <div className="container">
        <h2 id="highlights-title" className={styles.heading} data-reveal="fade-up">
          {highlights.title}
        </h2>
        <ul className={styles.grid} data-reveal-stagger>
          {highlights.items.map((item) => (
            <li key={item.title} data-reveal="fade-up">
              <div className={styles.image}>
                <Image src={item.image} alt="" fill sizes="(min-width: 1100px) 370px, 100vw" />
              </div>
              <p className={styles.eyebrow}>{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <p className={styles.text}>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
