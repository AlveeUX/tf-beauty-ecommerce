"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./Accordion.module.css";

export type AccordionItem = { id: string; q: string; a: string };

/**
 * FAQ accordion (Figma 3:27365): dashed rules, 20px question, a plus that turns into a minus when open.
 * Items open and close independently; `defaultOpen` lists the ids that start open (the design opens the first).
 */
export function Accordion({
  items,
  defaultOpen = [],
  forceOpen = false,
}: {
  items: AccordionItem[];
  defaultOpen?: string[];
  /** Open every item (used while a search is showing matches). */
  forceOpen?: boolean;
}) {
  const base = useId();
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen));
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul className={styles.list} data-testid="accordion">
      {items.map((item) => {
        const isOpen = forceOpen || open.has(item.id);
        const panel = `${base}-${item.id}`;
        return (
          <li
            key={item.id}
            className={styles.item}
            data-open={isOpen || undefined}
            data-testid="faq-item"
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => toggle(item.id)}
              >
                <span>{item.q}</span>
                <Icon name={isOpen ? "minus" : "plus"} size={20} />
              </button>
            </h3>
            <div id={panel} role="region" aria-label={item.q} className={styles.panel}>
              <div className={styles.inner}>
                <p>{item.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
