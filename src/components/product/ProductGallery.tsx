"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { GalleryMode, ZoomMode } from "@/lib/pdp-layouts";
import styles from "./ProductGallery.module.css";

type GalleryImage = { url: string; alt: string };

type Props = {
  images: GalleryImage[];
  name: string;
  /** How the images are laid out (Figma frames "Thumbnail right/left", "Gallery 1/2 column"). */
  mode?: GalleryMode;
  /** Hover zoom on the main image (Figma frames "Inner zoom" 3:17692 and "External zoom" 3:18997). */
  zoom?: ZoomMode;
};

type Hover = { x: number; y: number; w: number; h: number };

const LENS = 174; // lens diameter in the zoom frames
const INNER_FACTOR = 2;
const EXTERNAL_FACTOR = 2.4;

/**
 * Product image gallery. Figma 3:12734 (default, 645 wide) and the layout frames of the product group.
 * Zoom is a mouse-only enhancement: touch and keyboard users still get the full-screen viewer.
 */
export function ProductGallery({ images, name, mode = "below", zoom = "none" }: Props) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState<Hover | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const count = images.length;
  const current = images[index] ?? images[0];

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const close = (e: MouseEvent) => {
      if (e.target === el) el.close(); // click on the backdrop
    };
    el.addEventListener("click", close);
    return () => el.removeEventListener("click", close);
  }, []);

  if (!current) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const openViewer = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };

  const grid = mode === "grid-1" || mode === "grid-2";
  // the frames show 3 stacked images (1 column) or a 2 x 2 grid; the viewer reaches the rest
  const shown = mode === "grid-2" ? images.slice(0, 4) : images.slice(0, 3);
  const beside = mode === "thumbs-start" || mode === "thumbs-end";

  function track(event: PointerEvent<HTMLDivElement>) {
    if (zoom === "none" || event.pointerType !== "mouse") return;
    const r = event.currentTarget.getBoundingClientRect();
    setHover({ x: event.clientX - r.left, y: event.clientY - r.top, w: r.width, h: r.height });
  }

  const picture = (sizes: string, priority = false) => (
    <Image
      src={current.url}
      alt={priority ? current.alt || name : ""}
      fill
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      sizes={sizes}
      className={styles.image}
    />
  );

  /** A copy of the main image scaled around the pointer, clipped by its container. */
  const magnified = (factor: number, boxW: number, boxH: number, clamp: boolean) => {
    if (!hover) return null;
    let tx = boxW / 2 - hover.x * factor;
    let ty = boxH / 2 - hover.y * factor;
    if (clamp) {
      tx = Math.min(0, Math.max(boxW - hover.w * factor, tx));
      ty = Math.min(0, Math.max(boxH - hover.h * factor, ty));
    }
    return (
      <div
        className={styles.magnified}
        style={{
          width: hover.w,
          height: hover.h,
          transform: `translate(${tx}px, ${ty}px) scale(${factor})`,
        }}
      >
        {picture("(min-width: 1100px) 1400px, 100vw")}
      </div>
    );
  };

  const arrows =
    count > 1 && !grid ? (
      <>
        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          aria-label="Previous image"
          onClick={() => go(-1)}
        >
          <Icon name="arrow-left" size={18} />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          aria-label="Next image"
          onClick={() => go(1)}
        >
          <Icon name="arrow-right" size={18} />
        </button>
      </>
    ) : null;

  const thumbs =
    count > 1 && !grid ? (
      <ul className={styles.thumbs} aria-label="Product images">
        {images.map((img, i) => (
          <li key={img.url}>
            <button
              type="button"
              aria-label={`Show image ${i + 1} of ${count}`}
              aria-current={i === index}
              className={styles.thumb}
              onClick={() => setIndex(i)}
            >
              <Image src={img.url} alt="" fill sizes="80px" className={styles.thumbImage} />
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div
      className={[styles.gallery, styles[mode]].filter(Boolean).join(" ")}
      data-testid="product-gallery"
      data-mode={mode}
      data-zoom={zoom}
    >
      {grid ? (
        <ul className={styles.grid} data-testid="gallery-grid">
          {shown.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                className={styles.cell}
                aria-label={`View image ${i + 1} of ${count} full screen`}
                onClick={() => openViewer(i)}
              >
                <Image
                  src={img.url}
                  alt={img.alt || name}
                  fill
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : undefined}
                  sizes={mode === "grid-2" ? "315px" : "(min-width: 1100px) 645px, 100vw"}
                  className={styles.image}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.stage}>
          <div
            className={styles.main}
            data-testid="gallery-main"
            onPointerMove={track}
            onPointerEnter={track}
            onPointerLeave={() => setHover(null)}
            onClick={(event) => {
              // touch screens have no hover zoom: tapping the picture opens the full-screen viewer instead
              const onButton = (event.target as HTMLElement).closest("button");
              if (
                zoom !== "none" &&
                !onButton &&
                window.matchMedia("(max-width: 1100px)").matches
              ) {
                openViewer(index);
              }
            }}
          >
            {picture(
              beside ? "(min-width: 1100px) 550px, 100vw" : "(min-width: 1100px) 645px, 100vw",
              true,
            )}
            {zoom !== "none" && hover ? (
              <span
                className={`${styles.lens} ${zoom === "external" ? styles.lensGhost : ""}`}
                data-testid="zoom-lens"
                aria-hidden="true"
                style={{ left: hover.x - LENS / 2, top: hover.y - LENS / 2 }}
              >
                {zoom === "inner" ? (
                  <span className={styles.lensView}>
                    {magnified(INNER_FACTOR, LENS, LENS, false)}
                  </span>
                ) : null}
                <span className={styles.cross} />
              </span>
            ) : null}
            <button
              type="button"
              className={styles.expand}
              aria-label="View image full screen"
              onClick={() => openViewer(index)}
            >
              <Icon name="maximize" size={18} />
            </button>
            {arrows}
          </div>
          {zoom === "external" && hover ? (
            <div
              className={styles.pane}
              data-testid="zoom-pane"
              aria-hidden="true"
              style={{ height: hover.h }}
            >
              {magnified(EXTERNAL_FACTOR, 644, hover.h, true)}
            </div>
          ) : null}
          {thumbs}
        </div>
      )}

      {grid && count > shown.length ? (
        <button
          type="button"
          className={styles.expand}
          aria-label="View image full screen"
          onClick={() => openViewer(0)}
        >
          <Icon name="maximize" size={18} />
        </button>
      ) : null}

      <dialog ref={dialog} className={styles.lightbox} aria-label={`${name} image`}>
        <form method="dialog">
          <button type="submit" className={styles.close} aria-label="Close">
            <Icon name="x" size={20} />
          </button>
        </form>
        <div className={styles.lightboxImage}>
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            sizes="90vw"
            className={styles.contain}
          />
        </div>
        {count > 1 ? (
          <div className={styles.lightboxNav}>
            <button type="button" aria-label="Previous image" onClick={() => go(-1)}>
              <Icon name="arrow-left" size={18} />
            </button>
            <button type="button" aria-label="Next image" onClick={() => go(1)}>
              <Icon name="arrow-right" size={18} />
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
