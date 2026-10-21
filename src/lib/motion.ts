/*
 * Motion helpers for the few effects that need script (magnetic buttons, parallax, tilt, counters).
 * All of them are safe to call on the server: they report "no motion" there.
 */

/** True when the visitor asked their system for less motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** True for a mouse or trackpad. Hover effects and pointer effects run only there, never on touch. */
export function canHover(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/**
 * True when scripted motion may run: the site mode is "full" (src/config/motion.ts) and the visitor has
 * not asked for reduced motion. "subtle" and "off" are fades-only and nothing, so they return false.
 */
export function motionOn(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.motion === "full" && !prefersReducedMotion();
}
