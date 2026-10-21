"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Banner } from "@/server/content/banners";
import styles from "./FlashSale.module.css";

const subscribe = (notify: () => void) => {
  const id = setInterval(notify, 1000);
  return () => clearInterval(id);
};
const nowSeconds = () => Math.floor(Date.now() / 1000);

/**
 * "Glow more, spend less" flash sale with a live countdown (HOM-006). Figma 3:2991.
 * `banner.endsAt` is the end time; the banner disappears once it has passed.
 */
export function FlashSale({ banner }: { banner: Banner | undefined }) {
  // null on the server and during hydration so the markup always matches; ticks once per second after.
  const now = useSyncExternalStore(subscribe, nowSeconds, () => null);
  if (!banner || !banner.endsAt) return null;

  const end = Math.floor(banner.endsAt.getTime() / 1000);
  const remaining = now === null ? null : Math.max(0, end - now);
  if (remaining === 0) return null; // sale is over

  const parts =
    remaining === null
      ? ["--", "--", "--", "--"]
      : [
          Math.floor(remaining / 86400),
          Math.floor((remaining % 86400) / 3600),
          Math.floor((remaining % 3600) / 60),
          remaining % 60,
        ].map((n) => String(n).padStart(2, "0"));
  const labels = ["Days", "Hours", "Mins", "Secs"];

  return (
    <section className={`container ${styles.wrap}`} aria-labelledby="flash-title">
      <div className={styles.banner}>
        {banner.image ? <Image src={banner.image} alt="" fill sizes="1320px" /> : null}
        <div className={styles.text}>
          <p className={styles.eyebrow}>{banner.eyebrow}</p>
          <h2 id="flash-title">{banner.title}</h2>
          <p className={styles.copy}>
            {banner.subtitle} <u>{String(banner.data.code ?? "")}.</u>
          </p>
        </div>
        <div className={styles.side}>
          <ul className={styles.timer} aria-label="Time remaining" data-testid="countdown">
            {parts.map((value, i) => (
              <li key={labels[i]}>
                <strong>{value}</strong>
                <span>{labels[i]}</span>
              </li>
            ))}
          </ul>
          <Link href={banner.ctaHref ?? "/shop"} className={`${styles.cta} m-btn`} data-magnetic>
            <span>{banner.ctaLabel}</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
