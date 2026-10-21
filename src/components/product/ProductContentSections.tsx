import { Icon, type IconName } from "@/components/ui/Icon";
import type { ProductContent } from "@/lib/product-content";
import styles from "./ProductContentSections.module.css";

type Props = {
  content: ProductContent | null;
  /** Plain ingredient list shown when the product has no structured content. */
  ingredients: string | null;
};

/** "Inside the formula": collapsible sections for benefits, usage, ingredients and clinical results. Figma 3:13084. */
export function ProductContentSections({ content, ingredients }: Props) {
  const formula = content?.formula;
  const usage = content?.usage;
  const clinical = content?.clinical;
  const ingredientBlock =
    content?.ingredients ??
    (ingredients ? { title: "Full ingredient transparency", freeOf: "", inci: ingredients } : null);

  if (!formula && !usage && !clinical && !ingredientBlock) return null;

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading} data-reveal="fade-up">
        Inside the formula
      </h2>

      {formula ? (
        <Section icon="droplet" title={formula.title}>
          <p className={styles.intro}>{formula.intro}</p>
          <ul className={styles.benefits}>
            {formula.items.map((item) => (
              <li key={item.title}>
                <Icon name={ICON_MAP[item.icon]} size={32} strokeWidth={1.3} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {usage ? (
        <Section icon="brush" title={usage.title}>
          <p className={styles.intro}>{usage.intro}</p>
          <div className={styles.usage}>
            <div>
              <h3>{usage.prepTitle}</h3>
              <ul>
                {usage.prep.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{usage.finishTitle}</h3>
              <ul>
                {usage.finish.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      ) : null}

      {ingredientBlock ? (
        <Section icon="flask" title={ingredientBlock.title}>
          {ingredientBlock.freeOf ? (
            <p className={styles.freeOf}>
              <strong>Free of:</strong> {ingredientBlock.freeOf}
            </p>
          ) : null}
          <p className={styles.inci}>{ingredientBlock.inci}</p>
        </Section>
      ) : null}

      {clinical ? (
        <Section icon="badge-check" title={clinical.title}>
          <ul className={styles.stats}>
            {clinical.stats.map((stat) => (
              <li key={stat.label}>
                <strong>{stat.value}</strong>
                <h3>{stat.label}</h3>
                <p>{stat.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

const ICON_MAP: Record<NonNullable<ProductContent["formula"]>["items"][number]["icon"], IconName> =
  {
    rotate: "rotate",
    ban: "ban",
    calendar: "calendar",
    sun: "sun",
    droplet: "droplet",
    brush: "brush",
    flask: "flask",
    "badge-check": "badge-check",
  };

function Section({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className={styles.section} open data-reveal="fade-up">
      <summary>
        <span className={styles.summaryTitle}>
          <Icon name={icon} size={20} strokeWidth={1.4} />
          {title}
        </span>
        <Icon name="chevron-up" size={18} />
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
