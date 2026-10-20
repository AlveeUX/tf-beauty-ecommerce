import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addToCart } from "../fixtures/flows";
import { ALL_ROUTES, TEMPLATE_ROUTES } from "./routes";

// TF3 responsive gates (docs/responsive-spec.md). Each spec runs once per width project (r1440 ... r320).
const widthOf = (page: Page) => page.viewportSize()!.width;

async function open(page: Page, route: string) {
  await page.goto(route, { waitUntil: "networkidle" });
}

test.describe("Responsive layout", () => {
  test("R-01 no page scrolls sideways", async ({ page }) => {
    test.setTimeout(300_000);
    const problems: string[] = [];
    for (const route of ALL_ROUTES) {
      await open(page, route);
      const over = await page.evaluate(() => {
        const doc = document.documentElement;
        const by = doc.scrollWidth - doc.clientWidth;
        if (by <= 0) return null;
        let worst = "";
        let right = 0;
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > doc.clientWidth + 1 && r.right > right) {
            right = r.right;
            worst = `${el.tagName.toLowerCase()}.${(String(el.className).split(" ")[0] ?? "").slice(0, 30)}`;
          }
        }
        return { by, worst };
      });
      if (over) problems.push(`${route}: +${over.by}px (${over.worst})`);
    }
    test.info().annotations.push({
      type: "routes checked",
      description: `${ALL_ROUTES.length} at ${widthOf(page)}px`,
    });
    expect(problems).toEqual([]);
  });

  test("R-03 controls are at least 44 x 44 px below 1024 px", async ({ page }) => {
    test.skip(widthOf(page) >= 1024, "touch sizes apply to phones and tablets");
    test.setTimeout(300_000);
    await addToCart(page, "the-renewal-serum", 1);
    const problems: string[] = [];
    for (const route of TEMPLATE_ROUTES) {
      await open(page, route);
      const small = await page.evaluate(() => {
        const visible = (r: DOMRect, cs: CSSStyleDeclaration) =>
          r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
        const out: string[] = [];
        const selector =
          'button, [role="button"], a[aria-label], input[type="checkbox"], input[type="radio"], select, summary';
        for (const el of document.querySelectorAll<HTMLElement>(selector)) {
          // a styled checkbox is operated through its label
          const target =
            el instanceof HTMLInputElement && el.closest("label") ? el.closest("label")! : el;
          const r = target.getBoundingClientRect();
          if (!visible(r, getComputedStyle(target))) continue;
          if (el.closest(".visually-hidden")) continue;
          if (r.width < 44 || r.height < 44) {
            const name = (el.getAttribute("aria-label") ?? el.textContent ?? "")
              .trim()
              .slice(0, 24);
            out.push(
              `${el.tagName.toLowerCase()} "${name}" ${Math.round(r.width)}x${Math.round(r.height)}`,
            );
          }
        }
        return out;
      });
      if (small.length)
        problems.push(`${route}: ${small.length} (${small.slice(0, 4).join("; ")})`);
    }
    expect(problems).toEqual([]);
  });

  test("R-04 no serious accessibility violations, colour contrast included", async ({ page }) => {
    test.setTimeout(480_000);
    await addToCart(page, "the-renewal-serum", 1);
    const problems: string[] = [];
    for (const route of TEMPLATE_ROUTES) {
      await open(page, route);
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      for (const v of blocking) {
        problems.push(
          `${route}: ${v.id} x${v.nodes.length} (${v.nodes[0]?.target.join(" ").slice(0, 60)})`,
        );
      }
    }
    expect(problems).toEqual([]);
  });
});
