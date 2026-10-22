"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flagOn, prefersReducedMotion, subscribeReducedMotion } from "@/lib/motion";
import styles from "./HomeSections.module.css";

/** Each photo stays this long before the next one fades in over it. */
const INTERVAL_MS = 3_000;
/** After a click on a dot the photo stays where the visitor put it for this long, then switching by itself resumes. */
const HOLD_MS = 10_000;

/**
 * The "Fresh drops" banner photo with its three dots (Figma 3:2752). The photos are stacked and the next one fades in over
 * the current one (the cross-fade and the slow settle are CSS, HomeSections.module.css, on the hero's timing tokens).
 * It changes by itself every INTERVAL_MS while the banner is at least half on screen and the page is visible; it does not run
 * for visitors who asked for less motion, when the mode is "off", or when `slidesAutoplay` (src/config/motion.ts) is off.
 */
export function FeatureSlides({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [holding, setHolding] = useState(false);
  const [idle, setIdle] = useState(true);
  const layer = useRef<HTMLDivElement>(null);
  const holdTimer = useRef(0);

  // false on the server and during hydration, so the markup matches
  const enabled = useSyncExternalStore(
    subscribeReducedMotion,
    () =>
      images.length > 1 &&
      flagOn("slidesAutoplay") &&
      document.documentElement.dataset.motion !== "off" &&
      !prefersReducedMotion(),
    () => false,
  );

  useEffect(() => {
    const banner = layer.current?.parentElement;
    if (!enabled || !banner) return;
    let onScreen = false;
    const update = () => setIdle(!onScreen || document.hidden);
    const seen = new IntersectionObserver(
      ([entry]) => {
        onScreen = Boolean(entry?.isIntersecting);
        update();
      },
      { threshold: 0.5 },
    );
    seen.observe(banner);
    document.addEventListener("visibilitychange", update);
    return () => {
      seen.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [enabled]);

  // one timer per photo: it starts again after every change, after a hold, and when the banner comes back on screen
  useEffect(() => {
    if (!enabled || idle || holding) return;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % images.length), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, idle, holding, active, images.length]);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const choose = (index: number) => {
    setActive(index);
    if (!enabled) return;
    setHolding(true);
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setHolding(false), HOLD_MS);
  };

  return (
    <>
      {/* the layer is the design's fill crop of the photo; parallax moves the whole layer */}
      <div ref={layer} className={styles.slides} data-parallax-px="40" data-parallax-axis="x">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="(max-width: 1100px) 100vw, 1021px"
            className={styles.slide}
            data-on={i === active || undefined}
          />
        ))}
      </div>
      {images.length > 1 ? (
        <div className={styles.dots} role="group" aria-label="Collection photos">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={styles.dot}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              onClick={() => choose(i)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
