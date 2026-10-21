export type MotionConfig = {
  /** "full", "subtle" (fades only) or "off" (nothing moves, nothing fades). */
  mode: "full" | "subtle" | "off";
  /** "static" matches the design; "sticky" keeps the header on screen; "smart" hides it while scrolling down. */
  header: "static" | "sticky" | "smart";
  parallax: boolean;
  magnetic: boolean;
  /** The Home journal stays on screen while its cards rise as you scroll (mouse, wide screens). */
  pinnedCards: boolean;
  tilt: boolean;
  carouselAutoplay: boolean;
  marquee: boolean;
  readingProgress: boolean;
  flyToCart: boolean;
  smoothScroll: boolean;
  customCursor: boolean;
  preloader: boolean;
  pageTransitions: boolean;
};

/**
 * Motion settings: the one file to edit to turn effects on or off (docs/animation-plan.md 2.3).
 * The root layout writes every key to <html> as a data-* attribute (`carouselAutoplay` becomes
 * `data-carousel-autoplay`). CSS reads the attributes, and the optional script modules are loaded
 * only when their flag is on.
 */
export const motionConfig: MotionConfig = {
  mode: "full",
  header: "static",
  parallax: true,
  magnetic: true,
  pinnedCards: true,
  tilt: false,
  carouselAutoplay: false,
  marquee: true,
  readingProgress: true,
  flyToCart: false,
  smoothScroll: false,
  customCursor: false,
  preloader: false,
  pageTransitions: false,
};

/** The config as attributes for <html>: { "data-motion": "full", "data-carousel-autoplay": "false", ... }. */
export function motionDataAttributes(config: MotionConfig = motionConfig): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    // `mode` is written as data-motion, the attribute the token overrides in tokens.css select on
    const name = key === "mode" ? "motion" : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    attributes[`data-${name}`] = String(value);
  }
  return attributes;
}
