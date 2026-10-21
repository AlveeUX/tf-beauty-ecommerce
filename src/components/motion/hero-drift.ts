/**
 * Scroll drift of the Home hero (animation-plan AN4-T05, M17). As the page scrolls away from the hero, its copy,
 * card and controls drift up (at most 24 px) and fade, while the background moves the other way (at most 24 px).
 *
 * This only writes `--hero-p` on the hero (0 at the top, 1 once 60% of the hero has scrolled away) and marks it
 * `data-drift`; HeroSlider.module.css does the moving. It listens to scroll (passive, one animation frame per
 * scroll) only while the hero is on screen. Loaded on demand by HeroSlider, and only when parallax is switched
 * on, the visitor has a fine pointer and has not asked for reduced motion.
 */
export function attachHeroDrift(hero: HTMLElement): () => void {
  let frame = 0;
  let listening = false;

  const update = () => {
    frame = 0;
    const progress = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.6)));
    hero.style.setProperty("--hero-p", progress.toFixed(3));
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting && !listening) {
      listening = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      update();
    } else if (!entry?.isIntersecting && listening) {
      listening = false;
      window.removeEventListener("scroll", onScroll);
    }
  });

  hero.setAttribute("data-drift", "");
  observer.observe(hero);

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
    hero.removeAttribute("data-drift");
    hero.style.removeProperty("--hero-p");
  };
}
