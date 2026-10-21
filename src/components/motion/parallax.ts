/**
 * Parallax (animation-plan M17). An element with data-parallax-px="<max px>" slides slowly against the scroll while it
 * is on screen: by at most that many pixels either way, along y (default) or along x (data-parallax-axis="x").
 * Its offset follows where the element's parent sits in the viewport, so a photo drifts a little behind the page.
 * The image must be larger than its frame by at least that much on the moving axis, or the frame would show a gap.
 *
 * (Not [data-parallax]: that name is the setting written on <html>, and matching it moved the whole page.)
 * One scroll listener (passive, one animation frame per scroll) that runs only while a parallax element is visible;
 * elements added later are picked up. Loaded on demand by RevealObserver, only when the "parallax" setting is on,
 * the visitor has a fine pointer and has not asked for reduced motion.
 */
export function attachParallax(): () => void {
  const visible = new Set<HTMLElement>();
  let frame = 0;
  let listening = false;

  const update = () => {
    frame = 0;
    const half = window.innerHeight / 2;
    visible.forEach((el) => {
      const max = Number(el.dataset.parallaxPx) || 0;
      const box = (el.parentElement ?? el).getBoundingClientRect();
      const progress = Math.max(
        -1,
        Math.min(1, (box.top + box.height / 2 - half) / (half + box.height / 2)),
      );
      const offset = (-progress * max).toFixed(1);
      el.style.translate = el.dataset.parallaxAxis === "x" ? `${offset}px 0` : `0 ${offset}px`;
    });
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const seen = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (entry.isIntersecting) visible.add(el);
      else visible.delete(el);
    }
    if (visible.size && !listening) {
      listening = true;
      window.addEventListener("scroll", onScroll, { passive: true });
    } else if (!visible.size && listening) {
      listening = false;
      window.removeEventListener("scroll", onScroll);
    }
    update();
  });

  const watch = (scope: ParentNode) =>
    scope.querySelectorAll<HTMLElement>("[data-parallax-px]").forEach((el) => seen.observe(el));
  watch(document);
  const added = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches("[data-parallax-px]")) seen.observe(node);
        watch(node);
      });
    }
  });
  added.observe(document.body, { childList: true, subtree: true });

  return () => {
    seen.disconnect();
    added.disconnect();
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
    visible.forEach((el) => (el.style.translate = ""));
    visible.clear();
  };
}
