"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./FooterGroup.module.css";

type Props = {
  title: string;
  /** Class of the `<nav>` (each footer styles its columns itself). */
  className?: string;
  /** Class of both headings, so the footer's heading style applies to either. */
  headingClassName?: string;
  children: ReactNode;
};

/**
 * One footer link column. Above 767 px it is the plain column of the design; on phones the heading becomes a
 * 44 px button that opens and closes the list (docs/responsive-spec.md 5.3). Both headings are in the markup and
 * CSS shows one of them, so the desktop heading stays a plain heading.
 */
export function FooterGroup({ title, className, headingClassName, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <nav aria-label={title} className={className} data-open={open || undefined}>
      <h2 className={`${headingClassName ?? ""} ${styles.desktop}`}>{title}</h2>
      <h2 className={`${headingClassName ?? ""} ${styles.phone}`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{title}</span>
          <Icon name="chevron-down" size={16} />
        </button>
      </h2>
      <div id={panelId} className={styles.panel}>
        {children}
      </div>
    </nav>
  );
}
