/**
 * Magnetic call-to-action buttons (animation-plan M17). While the pointer is within 70 px of a [data-magnet]
 * element, the element leans toward it by at most 6 px, and it settles back when the pointer moves away or leaves
 * the window. The CSS (motion.css, .m-btn) smooths the movement with a transition on `translate`.
 *
 * (Not [data-magnetic]: that name is the setting written on <html>, and matching it moved the whole page.)
 * One pointermove listener for the whole page, one animation frame per move. Mouse only. Loaded on demand by
 * RevealObserver, and only when the setting is on, the visitor has a fine pointer and has not asked for reduced motion.
 */
const REACH = 70;
const MAX = 6;

export function attachMagnetic(): () => void {
  let frame = 0;
  let point: { x: number; y: number } | null = null;
  const leaning = new Set<HTMLElement>();

  const release = (el: HTMLElement) => {
    el.style.translate = "";
    leaning.delete(el);
  };

  const update = () => {
    frame = 0;
    document.querySelectorAll<HTMLElement>("[data-magnet]").forEach((el) => {
      if (!point) return release(el);
      const box = el.getBoundingClientRect();
      const outsideX = Math.max(box.left - point.x, 0, point.x - box.right);
      const outsideY = Math.max(box.top - point.y, 0, point.y - box.bottom);
      if (Math.hypot(outsideX, outsideY) > REACH) return release(el);
      const dx = point.x - (box.left + box.width / 2);
      const dy = point.y - (box.top + box.height / 2);
      const x = Math.max(-MAX, Math.min(MAX, dx * 0.12));
      const y = Math.max(-MAX, Math.min(MAX, dy * 0.2));
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      leaning.add(el);
    });
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    point = { x: event.clientX, y: event.clientY };
    schedule();
  };
  const onLeave = () => {
    point = null;
    schedule();
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  return () => {
    document.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    cancelAnimationFrame(frame);
    leaning.forEach(release);
  };
}
