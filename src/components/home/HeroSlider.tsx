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
 * 01/02/03 index are always shown, as in the design. A slide change fades the new background in over
 * the old one and plays the headline again; there is no autoplay.
 */
export function HeroSlider({ slides }: { slides: Banner[] }) {
  const [index, setIndex] = useState(0);
  // the slide being left stays underneath until the new background has faded in over it
  const [leaving, setLeaving] = useState<Banner | null>(null);
  // the card text fades on a slide change, but not on the first view (the card itself enters then)
  const [changed, setChanged] = useState(false);
  const count = slides.length;
  const slide = slides[index];
  if (!slide) return null;
  const badge = slide.data.badge as HeroBadge | undefined;
  const select = (next: number) => {
    if (next === index) return;
    setLeaving(slide);
    setChanged(true);
    setIndex(next);
  };
  const go = (delta: number) => select((index + delta + count) % count);
  const backgrounds = leaving && leaving.id !== slide.id ? [leaving, slide] : [slide];
  const swap = changed ? styles.swap : undefined;

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Featured collection"
    >
      {backgrounds.map((s) =>
        s.image ? (
          <Image
            key={s.id}
            src={s.image}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className={s.id === slide.id ? styles.bg : `${styles.bg} ${styles.bgStill}`}
            onAnimationEnd={s.id === slide.id ? () => setLeaving(null) : undefined}
          />
        ) : null,
      )}
      <div className={styles.shade} aria-hidden="true" />

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy} key={slide.id}>
          <p className={styles.eyebrow}>{slide.eyebrow}</p>
          <h1 className={styles.title} aria-label={slide.title}>
            <SplitText text={slide.title} />
          </h1>
        </div>

        <aside className={styles.card}>
          <h2 key={`h-${slide.id}`} className={swap}>
            {String(slide.data.cardTitle ?? "")}
          </h2>
          <p key={`p-${slide.id}`} className={swap}>
            {slide.subtitle}
          </p>
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
              onClick={() => select(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
