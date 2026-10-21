/**
 * Pinned cards (scroll-driven reveal). A section marked data-stack-cards stays on the screen while the visitor scrolls, and its
 * cards rise into place one after another as the page moves forward; scrolling back lowers them again, in reverse.
 *
 * Markup: <section data-stack-cards> containing one [data-stack-grid] (the block that stays on screen, it must be the section's only
 * content) and, inside it, one [data-stack-list] whose children are the cards.
 *
 * How it works: the section is made taller by the distance the visitor scrolls while it is pinned, the grid inside it is
 * position: sticky, and the scroll position is turned into a "progress" number. Each card owns a slice of that progress. The
 * progress that drives the cards is not the raw scroll position but a smoothed copy that follows it with a short delay, so
 * the cards glide instead of jerking with each notch of the mouse wheel. The smoothing has two stages (the second follows the
 * first), which gives the movement a soft start as well as a soft finish.
 *
 * It runs only for a mouse on a screen wider than 1100 px, with full motion; anywhere else (touch, narrow, reduced motion, "subtle" or
 * "off") nothing is changed and the cards are the plain stack, revealed as they scroll into view. One scroll listener, one animation
 * frame at a time, only while a pinned section is near the screen. Loaded on demand by RevealObserver, only when the "pinnedCards"
 * setting is on.
 */
const MIN_WIDTH = 1100; // the same breakpoint the layout uses: wider than this has the two-column Journal
const SMOOTHING_MS = 120; // time constant of each of the two smoothing stages; the cards settle about half a second after the scroll stops
const LEAD = 0.4; // screens of scroll before pinning during which the first card already starts to rise
const STEP = 0.55; // screens of scroll for one card to rise
const HOLD = 0.3; // screens of scroll that all cards stay in place, pinned, before the page moves on

type Stack = {
  section: HTMLElement;
  grid: HTMLElement;
  list: HTMLElement;
  top: number; // the grid's sticky offset
  lead: number;
  step: number;
  rise: number; // how far below its place a card starts
  mid: number; // first smoothing stage, in px of scroll
  smooth: number; // the smoothed progress that moves the cards, in px of scroll
  target: number; // the real progress, in px of scroll
  on: boolean;
  frame: number;
  last: number;
};

const ease = (q: number) => 1 - (1 - q) ** 3;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function attachScrollStack(): () => void {
  const stacks = new Map<HTMLElement, Stack>();
  let resizeTimer = 0;

  const cards = (s: Stack) => Array.from(s.list.children) as HTMLElement[];

  /** Put each card where the smoothed progress says. A card at its place has no inline style at all. */
  const paint = (s: Stack) => {
    cards(s).forEach((card, i) => {
      const q = clamp01(s.smooth / s.step - i);
      if (q >= 0.999) {
        card.style.translate = "";
        card.style.opacity = "";
        return;
      }
      const e = ease(q);
      card.style.translate = `0 ${((1 - e) * s.rise).toFixed(1)}px`;
      card.style.opacity = Math.min(1, e * 1.6).toFixed(3);
    });
  };

  /** Where the scroll position is on the pinned section's timeline, in px (0 = the first card starts to rise). */
  const read = (s: Stack) => s.top - s.section.getBoundingClientRect().top + s.lead;

  const tick = (s: Stack, now: number) => {
    const dt = Math.min(64, now - s.last);
    s.last = now;
    const k = 1 - Math.exp(-dt / SMOOTHING_MS);
    s.mid += (s.target - s.mid) * k;
    s.smooth += (s.mid - s.smooth) * k;
    if (Math.abs(s.target - s.smooth) < 0.1 && Math.abs(s.target - s.mid) < 0.1) {
      s.mid = s.target;
      s.smooth = s.target;
      s.frame = 0;
    } else {
      s.frame = requestAnimationFrame((t) => tick(s, t));
    }
    paint(s);
  };

  const follow = (s: Stack) => {
    s.target = read(s);
    if (!s.frame) {
      s.last = performance.now();
      s.frame = requestAnimationFrame((t) => tick(s, t));
    }
  };

  const wanted = () =>
    window.innerWidth > MIN_WIDTH &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const release = (s: Stack) => {
    cancelAnimationFrame(s.frame);
    s.frame = 0;
    s.on = false;
    s.section.removeAttribute("data-stack-on");
    s.section.style.height = "";
    s.section.style.removeProperty("--stack-top");
    cards(s).forEach((card) => {
      card.style.translate = "";
      card.style.opacity = "";
    });
  };

  /** Measure, size the section and place the cards. Safe to call again after a resize. */
  const engage = (s: Stack) => {
    const vh = window.innerHeight;
    s.section.setAttribute("data-stack-on", "");
    const items = cards(s);
    // the reveal on the cards would fight the scroll-driven movement: mark them as already revealed
    items.forEach((card) => {
      card.setAttribute("data-revealed", "");
      card.setAttribute("data-reveal-done", "");
    });
    const cardsHeight = s.list.offsetHeight;
    const cardsTop = s.list.getBoundingClientRect().top - s.grid.getBoundingClientRect().top;
    // keep the whole list on screen, centred when it fits, and by its top edge when the window is shorter than the list
    const listTop = Math.max(24, (vh - cardsHeight) / 2);
    s.top = listTop - cardsTop;
    s.lead = LEAD * vh;
    s.step = STEP * vh;
    s.rise = Math.min(560, 0.6 * vh);
    const pinned = items.length * s.step - s.lead + HOLD * vh;
    s.section.style.setProperty("--stack-top", `${s.top.toFixed(1)}px`);
    s.section.style.height = `${(s.grid.offsetHeight + Math.max(0, pinned)).toFixed(0)}px`;
    s.on = true;
    s.target = read(s);
    s.mid = s.target;
    s.smooth = s.target; // arriving in the middle of the section (reload, anchor) shows the right state at once
    paint(s);
  };

  const refresh = (s: Stack) => {
    if (wanted()) engage(s);
    else if (s.on) release(s);
  };

  const onScroll = () => {
    stacks.forEach((s) => {
      if (!s.section.isConnected) {
        release(s);
        stacks.delete(s.section);
      } else if (s.on) follow(s);
    });
  };

  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => stacks.forEach(refresh), 150);
  };

  // The grid's height changes when fonts arrive or the text wraps differently: size the section again.
  const sizes = new ResizeObserver(() => onResize());

  const add = (section: HTMLElement) => {
    if (stacks.has(section)) return;
    const grid = section.querySelector<HTMLElement>("[data-stack-grid]");
    const list = section.querySelector<HTMLElement>("[data-stack-list]");
    if (!grid || !list || list.children.length === 0) return;
    const s: Stack = {
      section,
      grid,
      list,
      top: 0,
      lead: 0,
      step: 1,
      rise: 0,
      mid: 0,
      smooth: 0,
      target: 0,
      on: false,
      frame: 0,
      last: 0,
    };
    stacks.set(section, s);
    sizes.observe(grid);
    refresh(s);
  };

  const scan = (scope: ParentNode) => {
    if (scope instanceof HTMLElement && scope.matches("[data-stack-cards]")) add(scope);
    scope.querySelectorAll<HTMLElement>("[data-stack-cards]").forEach(add);
  };
  scan(document);
  const added = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) scan(node);
      });
    }
  });
  added.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  return () => {
    added.disconnect();
    sizes.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.clearTimeout(resizeTimer);
    stacks.forEach(release);
    stacks.clear();
  };
}
