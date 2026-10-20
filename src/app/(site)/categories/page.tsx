import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";
import { Icon } from "@/components/ui/Icon";
import { getCategoryCards } from "@/server/catalog/service";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

/** Categories index (CAT-008, Figma 3:28043): every active category that has products and an image. */
export default function CategoriesPage() {
  const cards = getCategoryCards();
  return (
    <>
      <PageHero title="Categories" />
      <section className={`container ${styles.section}`} aria-labelledby="categories-title">
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Beauty essentials</p>
          <h2 id="categories-title">Everything your beauty routine needs.</h2>
          <p>
            Explore thoughtfully selected skincare, makeup, haircare, tools, and fragrance designed
            for effortless everyday beauty.
          </p>
        </header>

        {cards.length === 0 ? (
          <p role="status" className={styles.empty}>
            No categories are available yet.
          </p>
        ) : (
          <ul className={styles.grid} data-testid="category-grid">
            {cards.map((c, i) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className={styles.card}>
                  <Image src={c.image} alt="" fill sizes="(min-width: 1100px) 308px, 50vw" />
                  <span className={styles.count}>{String(c.count).padStart(2, "0")} products</span>
                  <span className={styles.go} aria-hidden="true">
                    <Icon name="arrow-up-right" size={14} />
                  </span>
                  <span className={styles.label}>
                    <strong>
                      {String(i + 1).padStart(2, "0")} • {c.name}
                    </strong>
                    {c.description ? <span>{c.description}</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <BenefitStrip />
    </>
  );
}
