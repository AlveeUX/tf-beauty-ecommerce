"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SplitText } from "@/components/motion/SplitText";
import { Icon } from "@/components/ui/Icon";
import type { Banner } from "@/server/content/banners";
import styles from "./HeroSlider.module.css";

type HeroBadge = { top?: string; value?: string; bottom?: string };

/**
 * Home hero (Figma 3:2328..3:2423). Slides come from the "home-hero" banners; arrows and the
 * 01/02/03 index are always shown, as in the design.
 */
export function HeroSlider({ slides }: { slides: Banner[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const slide = slides[index];
  if (!slide) return null;
  const badge = slide.data.badge as HeroBadge | undefined;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Featured collection"
    >
      {slide.image ? (
        <Image
          src={slide.image}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className={styles.bg}
        />
      ) : null}
      <div className={styles.shade} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{slide.eyebrow}</p>
          <h1 className={styles.title} aria-label={slide.title}>
            <SplitText text={slide.title} />
          </h1>
        </div>

        <aside className={styles.card}>
          <h2>{String(slide.data.cardTitle ?? "")}</h2>
          <p>{slide.subtitle}</p>
          <Link href={slide.ctaHref ?? "/shop"} className={styles.cta}>
            <span>{slide.ctaLabel}</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
        </aside>

        <div className={styles.controls}>
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide">
            <Icon name="arrow-left" size={18} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next slide">
            <Icon name="arrow-right" size={18} />
          </button>
        </div>
      </div>

      {badge ? (
        <div className={`${styles.badge} m-shine`} aria-hidden="true">
          <Image src="/images/home/badge-fill.png" alt="" width={114} height={114} unoptimized />
          <span className={styles.badgeTop}>{badge.top}</span>
          <strong>{badge.value}</strong>
          <span className={styles.badgeBottom}>{badge.bottom}</span>
        </div>
      ) : null}

      <ol className={styles.index} aria-label="Slides">
        {slides.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              aria-label={`${String(i + 1).padStart(2, "0")}, go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
