import type { Metadata } from "next";
import Link from "next/link";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";
import { Icon } from "@/components/ui/Icon";
import styles from "@/components/demos/Demos.module.css";
import { DEMO_GROUPS } from "@/content/demos";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Demos",
  description: `Every layout and page of the ${site.name} template in one place.`,
};

/**
 * Demo hub: one link for every layout variant and key page. Proposed page (not a Figma frame): plain cards
 * on the page background, using the template's tokens. It is the entry point of the live preview.
 */
export default function DemosPage() {
  return (
    <>
      <PageHero title="Demos" crumbs={[{ label: "Demos" }]} />
      <div className={`container ${styles.page}`}>
        <p className={styles.intro}>
          Every layout and page of the {site.name} template, one click each. Shop, product and blog
          layouts are chosen with the <code>layout</code> parameter in the address.
        </p>
        {DEMO_GROUPS.map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`demos-${group.id}`}>
            <header>
              <h2 id={`demos-${group.id}`}>
                {group.title} <span className={styles.count}>({group.items.length})</span>
              </h2>
              <p>{group.intro}</p>
            </header>
            <ul className={styles.grid}>
              {group.items.map((demo) => (
                <li key={demo.id}>
                  <Link href={demo.href} className={styles.card} data-testid="demo-link">
                    <span className={styles.title}>{demo.title}</span>
                    <span className={styles.text}>{demo.description}</span>
                    <span className={styles.path}>
                      <code>{demo.href}</code>
                      <Icon name="arrow-up-right" size={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <BenefitStrip />
    </>
  );
}
