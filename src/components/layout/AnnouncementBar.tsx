"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "./AnnouncementBar.module.css";
import { site } from "@/config/site";

type AnnouncementBarProps = {
  /** Rotating promo messages (managed from the admin in P9). */
  messages: string[];
  est?: string;
  /** Replaces the "Est · year · city" line (the Home header shows a release note instead). */
  left?: React.ReactNode;
  /** "dark" is the Home variant: translucent dark red over the hero. */
  tone?: "default" | "dark";
};

/** Top bar: est. line, rotating promo message, store locator and language/currency. Figma 3:5794. */
export function AnnouncementBar({
  messages,
  est = `Est·${site.foundedYear}·${site.contact.city}`,
  left,
  tone = "default",
}: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);
  const count = messages.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const [estLabel, estYear, estCity] = est.split("·");

  return (
    <div className={`${styles.bar} ${tone === "dark" ? styles.dark : ""}`}>
      <div className={styles.inner}>
        {left ? (
          <p className={styles.est}>{left}</p>
        ) : (
          <p className={styles.est}>
            <span>{estLabel}</span>
            <i aria-hidden="true" />
            <span>{estYear}</span>
            <i aria-hidden="true" />
            <span>{estCity}</span>
          </p>
        )}

        <div className={styles.promo} aria-live="polite">
          {count > 1 ? (
            <button type="button" onClick={() => go(-1)} aria-label="Previous announcement">
              <Icon name="chevron-left" size={16} />
            </button>
          ) : null}
          <p>{messages[index]}</p>
          {count > 1 ? (
            <button type="button" onClick={() => go(1)} aria-label="Next announcement">
              <Icon name="chevron-right" size={16} />
            </button>
          ) : null}
        </div>

        <div className={styles.utility}>
          <Link href="/store-locator" className={styles.locator}>
            <Icon name="map-pin" size={14} />
            <span>Store locator</span>
          </Link>
          <i aria-hidden="true" />
          {/* Language/currency are visual only in the MVP (PRD OQ-25). */}
          <span className={styles.select}>
            EN <Icon name="chevron-down" size={14} />
          </span>
          <i aria-hidden="true" />
          <span className={styles.select}>
            USD <Icon name="chevron-down" size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
