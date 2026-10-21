"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import type { Banner } from "@/server/content/banners";
import styles from "./Testimonials.module.css";

type Crop = { width: number; height: number; left: number; top: number };

/** "Made personal": customer photo cards in a scrolling row. Figma 3:3112 / 3:3028 / 3:3084 / 3:3059. */
export function Testimonials({ items }: { items: Banner[] }) {
  const track = useRef<HTMLUListElement>(null);
  if (items.length === 0) return null;

  function scroll(direction: 1 | -1) {
    track.current?.scrollBy({ left: direction * 450, behavior: "smooth" });
  }

  return (
    <div className={styles.frame}>
      <ul ref={track} className={styles.track} data-testid="testimonials">
        {items.map((t) => {
          const rating = Number(t.data.rating ?? 5);
          const crop = t.data.crop as Crop | undefined;
          return (
            <li key={t.id}>
              <article className={styles.card}>
                <div className={styles.photo}>
                  {t.image && crop ? (
                    // a fill crop taken from the design: the photo is larger than the frame
                    <Image
                      src={t.image}
                      alt=""
                      width={900}
                      height={1117}
                      sizes="440px"
                      style={{
                        position: "absolute",
                        maxWidth: "none",
                        width: `${crop.width}%`,
                        height: `${crop.height}%`,
                        left: `${crop.left}%`,
                        top: `${crop.top}%`,
                      }}
                    />
                  ) : t.image ? (
                    <Image src={t.image} alt="" fill sizes="420px" />
                  ) : null}
                </div>
                <div className={styles.shade} aria-hidden="true" />
                <p className={styles.handle}>
                  <span>{String(t.data.handle ?? "").toUpperCase()}</span>
                </p>
                <p className={styles.verified}>
                  <Icon name="check-circle" size={12} />
                  <span>Verified</span>
                </p>
                <div className={styles.rating}>
                  <Rating value={rating} count={undefined} variant="card" />
                  <span>[{String(t.data.tagline ?? "")}]</span>
                </div>
                <h3>{t.title}</h3>
                <blockquote>
                  <p>&ldquo;{t.subtitle}&rdquo;</p>
                </blockquote>
                <Link href={t.ctaHref ?? "/shop"} className={styles.shop}>
                  <span>Shop now</span>
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
      {items.length > 3 ? (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev} m-ring`}
            aria-label="Previous stories"
            onClick={() => scroll(-1)}
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next} m-ring`}
            aria-label="Next stories"
            onClick={() => scroll(1)}
          >
            <Icon name="arrow-right" size={18} />
          </button>
        </>
      ) : null}
    </div>
  );
}
