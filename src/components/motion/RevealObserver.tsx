"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { canHover, flagOn, motionOn } from "@/lib/motion";

const REVEAL = "[data-reveal]:not([data-revealed])";
const LOOP = "[data-loop]";

/**
 * Marks a [data-reveal] element as revealed and, once its transition has run, as done so the reveal
 * lets go of the element's transition and will-change (src/styles/motion.css). The timer is the
 * fallback for a transitionend that never arrives.
 */
function reveal(el: HTMLElement) {
  el.setAttribute("data-revealed", "");

  const { transitionDuration, transitionDelay } = getComputedStyle(el);
  const seconds = (list: string) => list.split(",").map((value) => parseFloat(value) || 0);
  const delays = seconds(transitionDelay);
  const longest = Math.max(
    0,
    ...seconds(transitionDuration).map(
      (duration, i) => duration + (delays[i % delays.length] ?? 0),
    ),
  );

  let timer = 0;
  const finish = () => {
    el.removeEventListener("transitionend", onEnd);
    window.clearTimeout(timer);
    el.setAttribute("data-reveal-done", "");
  };
  const onEnd = (event: TransitionEvent) => {
    if (event.target === el) finish();
  };
  el.addEventListener("transitionend", onEnd);
  timer = window.setTimeout(finish, longest * 1000 + 150);
}

/**
 * The one client island of the motion system, mounted once in the root layout (animation-plan 2.4, M15, M16).
 *
 * Reveal: every [data-reveal] element is watched by one IntersectionObserver and revealed once, 10% above the
 * bottom edge of the screen; it is never hidden again. A clip-* reveal starts fully clipped, and a fully clipped
 * element never counts as intersecting, so it is watched through its parent instead. Elements already above the screen when first seen
 * (an anchor link, a restored scroll position) are revealed without animation. New nodes are picked up by a
 * MutationObserver and the page is scanned again after every route change.
 *
 * Loop gate: [data-loop] elements get data-in-view="true|false", and <html> gets data-tab-hidden while the tab
 * is hidden; motion.css pauses their animation in both cases, so nothing animates unseen.
 *
 * It also marks <html data-reveal-ready>, which tells the pre-paint script in MotionInit that this ran.
 */
export function RevealObserver() {
  const pathname = usePathname();
  const rescan = useRef<() => void>(() => {});

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-reveal-ready", "");

    // clip-* reveals, by the element that is actually watched (their parent)
    const clipped = new Map<Element, HTMLElement[]>();
    const watchReveal = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;
      const parent = el.parentElement;
      if (el.dataset.reveal?.startsWith("clip-") && parent) {
        const list = clipped.get(parent) ?? [];
        if (!list.includes(el)) list.push(el);
        clipped.set(parent, list);
        revealer.observe(parent);
      } else {
        revealer.observe(el);
      }
    };

    const revealer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target;
          const items: HTMLElement[] = [...(clipped.get(target) ?? [])];
          if (target instanceof HTMLElement && target.matches(REVEAL)) items.push(target);
          const visible = entry.isIntersecting;
          const above = !visible && entry.boundingClientRect.bottom <= 0;
          if (!visible && !above) continue;
          revealer.unobserve(target);
          clipped.delete(target);
          for (const el of items) {
            if (el.hasAttribute("data-revealed")) continue;
            if (visible) {
              reveal(el);
            } else {
              el.setAttribute("data-revealed", "");
              el.setAttribute("data-reveal-done", "");
            }
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );

    const looper = new IntersectionObserver((entries) => {
      for (const entry of entries)
        entry.target.setAttribute("data-in-view", String(entry.isIntersecting));
    });

    const watch = (scope: ParentNode) => {
      scope.querySelectorAll(REVEAL).forEach(watchReveal);
      scope.querySelectorAll(LOOP).forEach((el) => looper.observe(el));
    };
    rescan.current = () => watch(document);
    watch(document);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(REVEAL)) watchReveal(node);
          if (node.matches(LOOP)) looper.observe(node);
          watch(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const onVisibility = () => root.toggleAttribute("data-tab-hidden", document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    // magnetic buttons: loaded only when the setting is on, for a mouse, without reduced motion
    let stopMagnetic: (() => void) | undefined;
    let cancelled = false;
    if (flagOn("magnetic") && motionOn() && canHover()) {
      void import("./magnetic").then(({ attachMagnetic }) => {
        if (!cancelled) stopMagnetic = attachMagnetic();
      });
    }

    // parallax photos: same conditions
    let stopParallax: (() => void) | undefined;
    if (flagOn("parallax") && motionOn() && canHover()) {
      void import("./parallax").then(({ attachParallax }) => {
        if (!cancelled) stopParallax = attachParallax();
      });
    }

    return () => {
      cancelled = true;
      stopParallax?.();
      stopMagnetic?.();
      revealer.disconnect();
      looper.disconnect();
      mutations.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeAttribute("data-tab-hidden");
      rescan.current = () => {};
    };
  }, []);

  useEffect(() => {
    rescan.current();
  }, [pathname]);

  return null;
}
