import Link from "next/link";
import { formatDateLong } from "@/lib/dates";
import type { Policy, PolicyBlock } from "@/content/policies";
import { PolicyToc } from "./PolicyToc";
import styles from "./PolicyPage.module.css";

function Block({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case "p":
      return <p className={block.muted ? styles.muted : undefined}>{block.text}</p>;
    case "subhead":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "note":
      return (
        <div role="note" className={styles.note}>
          <strong>{block.label}</strong> {block.text}
        </div>
      );
    case "table":
      return (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{block.headers[0]}</th>
              <th scope="col">{block.headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map(([a, b]) => (
              <tr key={a}>
                <td>{a}</td>
                <td>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

/** Policy and privacy template. Figma 3:24059: 405 px sticky contents list, 855 px text column. */
export function PolicyPage({ policy }: { policy: Policy }) {
  return (
    <div className={`container ${styles.page}`}>
      <aside className={styles.side}>
        <PolicyToc
          items={[
            ...policy.sections.map(({ id, toc }) => ({ id, toc })),
            { id: "contact", toc: "Contact us" },
          ]}
        />
      </aside>
      <article className={styles.article}>
        <p className={styles.updated}>
          Last updated: <strong>{formatDateLong(policy.updated)}</strong>
        </p>
        <p className={styles.intro}>{policy.intro}</p>
        {policy.sections.map((section) => (
          <section key={section.id} id={section.id} className={styles.section}>
            <h2>{section.title}</h2>
            <div className={styles.body}>
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          </section>
        ))}
        <div id="contact" className={styles.contact} data-testid="policy-contact">
          <p>{policy.contact.heading}</p>
          <p>
            {policy.contact.lead}{" "}
            <Link href={`mailto:${policy.contact.email}`}>{policy.contact.email}</Link>
          </p>
        </div>
      </article>
    </div>
  );
}
