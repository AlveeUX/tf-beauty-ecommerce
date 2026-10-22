/*
 * Motion helpers for the few effects that need script (magnetic buttons, parallax, tilt, counters).
 * All of them are safe to call on the server: they report "no motion" there.
 */

import type { MotionConfig } from "@/config/motion";

/** True when the visitor asked their system for less motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** For useSyncExternalStore: re-reads whether the visitor asked for less motion (the system setting can change while the page is open). */
export function subscribeReducedMotion(notify: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/** True for a mouse or trackpad. Hover effects and pointer effects run only there, never on touch. */
export function canHover(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/** True when a yes/no setting of src/config/motion.ts (written to <html> as a data attribute) is on. */
export function flagOn(name: Exclude<keyof MotionConfig, "mode" | "header">): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset[name] === "true";
}

/**
 * True when scripted motion may run: the site mode is "full" (src/config/motion.ts) and the visitor has
 * not asked for reduced motion. "subtle" and "off" are fades-only and nothing, so they return false.
 */
export function motionOn(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.motion === "full" && !prefersReducedMotion();
}
