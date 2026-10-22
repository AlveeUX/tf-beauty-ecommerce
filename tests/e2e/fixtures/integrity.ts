import type { Page } from "@playwright/test";

/**
 * Layout integrity check for the responsive specs: what a visitor loses without the page scrolling sideways.
 * It reports
 *   POKE         an element drawn past the screen edge (fixed popups and drawers included), unless a box that
 *                fits the screen clips it on purpose (a carousel, the compare table)
 *   CLIPS-CHILD  a box with overflow hidden or clip that cuts the text of something inside it
 *   BOX-OVERFLOW text that spills out of the bottom of a box that does not clip it (a fixed height that is too
 *                small): by more than 3px, or 24px when the box trims its own text (text-box: trim-both)
 *   OVERLAP      two pieces of text drawn over each other
 *
 * Intentional exceptions, each checked by eye: the 404 numerals' drop shadow (`shadow`, `front`), the "UP TO 30%"
 * artwork (`upTo`), the fixed "Demo mode" bar and toasts (they float over the page), carousel tracks, marquees
 * and maps, and text that ends in an ellipsis (`text-overflow: ellipsis`).
 *
 * Scroll the page first so scroll-driven reveals have run, and call this with motion ON: a reduced-motion run
 * hides every motion-related problem.
 */
export async function revealPage(page: Page): Promise<void> {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  // let every entrance animation finish (a looping one, such as the marquee, never does and is not waited for),
  // or two pieces of text caught mid-flight would look like an overlap
  await page.evaluate(async () => {
    const finite = () =>
      document.getAnimations().filter((a) => {
        const t = a.effect?.getComputedTiming();
        return t !== undefined && Number.isFinite(t.endTime as number) && a.playState === "running";
      });
    const deadline = Date.now() + 6000;
    while (finite().length > 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });
  await page.waitForTimeout(300);
}

export async function findLayoutFaults(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const faults: string[] = [];
    const skipName =
      /track|marquee|slider|carousel|ticker|scroller|slides|strip|map|sr-only|visually/i;
    const intentional = /(^|[_\s])(shadow|front|upTo)($|[_\s])/;

    const csCache = new Map<Element, CSSStyleDeclaration>();
    const gcs = (el: Element) => {
      let v = csCache.get(el);
      if (!v) {
        v = getComputedStyle(el);
        csCache.set(el, v);
      }
      return v;
    };
    const visCache = new Map<Element, boolean>();
    const visible = (el: Element): boolean => {
      const known = visCache.get(el);
      if (known !== undefined) return known;
      let ok = true;
      const cs = gcs(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) {
        ok = false;
      } else {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) ok = false;
        else if (
          el.parentElement &&
          el.parentElement !== document.body &&
          !visible(el.parentElement)
        )
          ok = false;
      }
      visCache.set(el, ok);
      return ok;
    };
    const name = (el: Element) => {
      const c = typeof el.className === "string" ? (el.className.split(/\s+/)[0] ?? "") : "";
      return `${el.tagName.toLowerCase()}${c ? "." + c.slice(c.indexOf("_") + 1) : ""}`;
    };
    const text = (el: Element) => (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    const ownText = (el: Element) =>
      [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 1);
    const clips = (cs: CSSStyleDeclaration) =>
      /(hidden|clip)/.test(cs.overflowX) || /(hidden|clip)/.test(cs.overflowY);
    const floating = (el: Element) =>
      !!el.closest('[data-testid="demo-notice"], [data-testid="toast-region"]');

    const all = [...document.body.querySelectorAll("*")];
    for (const el of all) {
      if (!visible(el)) continue;
      const cs = gcs(el);
      const r = el.getBoundingClientRect();

      if (r.right > vw + 2 || r.left < -2) {
        let clippedOnPurpose = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (/(hidden|clip|auto|scroll)/.test(gcs(p).overflowX)) {
            const pr = p.getBoundingClientRect();
            if (pr.left >= -1 && pr.right <= vw + 1) {
              clippedOnPurpose = true;
              break;
            }
          }
        }
        if (!clippedOnPurpose && !intentional.test(String(el.className)) && !floating(el))
          faults.push(
            `POKE ${name(el)} [${Math.round(r.left)}..${Math.round(r.right)}] "${text(el)}"`,
          );
      }

      if (clips(cs) && !skipName.test(String(el.className)) && !floating(el)) {
        for (const d of el.querySelectorAll("*")) {
          if (!ownText(d) || !visible(d) || gcs(d).position === "fixed") continue;
          if (intentional.test(String(d.className))) continue;
          let inCarousel = false;
          for (let p: Element | null = d.parentElement; p && p !== el; p = p.parentElement) {
            if (skipName.test(String(p.className))) {
              inCarousel = true;
              break;
            }
          }
          if (inCarousel) continue;
          const dr = d.getBoundingClientRect();
          const below = dr.bottom - r.bottom;
          const right = dr.right - r.right;
          const left = r.left - dr.left;
          const above = r.top - dr.top;
          const ellipsisCut = cs.textOverflow === "ellipsis" && below <= 2 && above <= 2;
          if (!ellipsisCut && (below > 2 || right > 2 || left > 2 || above > 2)) {
            faults.push(`CLIPS-CHILD ${name(el)} cuts ${name(d)} "${text(d)}"`);
            break;
          }
        }
      }

      if (
        el.children.length > 0 &&
        r.height >= 20 &&
        !clips(cs) &&
        !/(auto|scroll)/.test(cs.overflowY) &&
        !skipName.test(String(el.className))
      ) {
        for (const d of el.querySelectorAll("*")) {
          if (!ownText(d) || !visible(d) || gcs(d).position === "fixed") continue;
          const dr = d.getBoundingClientRect();
          // text that is trimmed to its cap height (text-box: trim-both) on the box or on anything between the
          // box and the text lets descenders, underlines and ascenders spill up to ~24px
          let trimmed = false;
          for (let p: Element | null = d; p && p !== el.parentElement; p = p.parentElement) {
            if (
              /trim/.test(
                (gcs(p) as CSSStyleDeclaration & { textBoxTrim?: string }).textBoxTrim ?? "",
              )
            ) {
              trimmed = true;
              break;
            }
          }
          if (
            dr.bottom - r.bottom > (trimmed ? 24 : 3) &&
            dr.top < r.bottom + 400 &&
            !floating(d)
          ) {
            faults.push(
              `BOX-OVERFLOW ${name(el)} (${Math.round(r.height)}px tall) spills ${name(d)} "${text(d)}" by ${Math.round(dr.bottom - r.bottom)}px`,
            );
            break;
          }
        }
      }
    }

    const leaves = all.filter(
      (e) =>
        ownText(e) &&
        visible(e) &&
        gcs(e).position !== "fixed" &&
        !floating(e) &&
        !intentional.test(String(e.className)),
    );
    // the real extent of the text: its width from the text range, and, for text that trims its box to the cap
    // height, its height from the element's box (a range would include the invisible line-height around it)
    const boxes = leaves.map((e) => {
      const range = document.createRange();
      range.selectNodeContents(e);
      const rr = range.getBoundingClientRect();
      const er = e.getBoundingClientRect();
      const trimmed = /trim/.test(
        (gcs(e) as CSSStyleDeclaration & { textBoxTrim?: string }).textBoxTrim ?? "",
      );
      return {
        e,
        r: {
          left: rr.left,
          right: rr.right,
          top: trimmed ? Math.max(rr.top, er.top) : rr.top,
          bottom: trimmed ? Math.min(rr.bottom, er.bottom) : rr.bottom,
          width: rr.width,
          height: trimmed ? Math.min(rr.bottom, er.bottom) - Math.max(rr.top, er.top) : rr.height,
        },
      };
    });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!;
        const b = boxes[j]!;
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (w > 4 && h > 3) {
          const small = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
          if ((w * h) / small > 0.25)
            faults.push(`OVERLAP ${name(a.e)} "${text(a.e)}" x ${name(b.e)} "${text(b.e)}"`);
        }
      }
    }
    return [...new Set(faults)].slice(0, 25);
  });
}
