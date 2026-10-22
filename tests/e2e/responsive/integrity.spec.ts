import { expect, test, type Page } from "@playwright/test";
import { findLayoutFaults, revealPage } from "../fixtures/integrity";
import { ALL_ROUTES, TEMPLATE_ROUTES } from "./routes";

// TF3-FIX1: the faults a phone visitor sees on the live site that the other responsive specs could not: text cut
// by a fixed-height box, text printed over text, content pushed off screen, and the first-visit welcome popup.
// The rest of the suite runs with reduced motion and with the popup already closed, which hides all of these,
// so this file turns motion ON and (for the popup) starts from an empty browser.
test.use({ reducedMotion: "no-preference" });

const widthOf = (page: Page) => page.viewportSize()!.width;

test.describe("Layout integrity", () => {
  test.beforeEach(({ page }) => {
    test.skip(
      widthOf(page) > 1100,
      "phones and tablets; the desktop layout is the design as built",
    );
  });

  test("R-06 no text is clipped, overlapped or pushed off screen on any route", async ({
    page,
  }) => {
    test.setTimeout(900_000);
    const problems: string[] = [];
    for (const route of ALL_ROUTES) {
      await page.goto(route, { waitUntil: "networkidle" });
      await revealPage(page);
      const faults = await findLayoutFaults(page);
      if (faults.length) problems.push(`${route}: ${faults.slice(0, 4).join("  |  ")}`);
    }
    test.info().annotations.push({
      type: "routes checked",
      description: `${ALL_ROUTES.length} at ${widthOf(page)}px`,
    });
    expect(problems).toEqual([]);
  });

  // The three breakpoints are 1439, 1100 and 767, so a 430 px phone, a 600 px tablet and a 767 px landscape
  // phone all get the phone layout of a 390 px screen and must hold together as it stretches.
  test("R-06 the phone layout holds between 430 and 767 px", async ({ page }) => {
    test.skip(widthOf(page) !== 390, "one run covers the in-between widths");
    test.setTimeout(900_000);
    const problems: string[] = [];
    for (const width of [430, 540, 600, 700, 767]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of TEMPLATE_ROUTES) {
        await page.goto(route, { waitUntil: "networkidle" });
        await revealPage(page);
        const faults = await findLayoutFaults(page);
        if (faults.length) problems.push(`${route} @${width}: ${faults.slice(0, 3).join("  |  ")}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("R-06 the Home header keeps the tagline under the wordmark, and the logo centred on phones", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const logo = page.locator('header a[aria-label$=", home"]');
    const wordmark = logo.locator("span").first();
    const tagline = logo.locator("span").nth(1);
    const w = (await wordmark.boundingBox())!;
    const t = (await tagline.boundingBox())!;
    expect(t.y, "tagline starts below the wordmark").toBeGreaterThanOrEqual(w.y + w.height - 1);
    if (widthOf(page) <= 767) {
      const l = (await logo.boundingBox())!;
      expect(
        Math.abs(l.x + l.width / 2 - widthOf(page) / 2),
        "logo centre vs screen centre",
      ).toBeLessThan(12);
    }
  });
});

test.describe("Welcome popup, first visit", () => {
  // an empty browser: no "closed it already" memory, so the popup appears after its delay
  test.use({ storageState: { cookies: [], origins: [] } });

  test("R-06 the popup fits the screen and its close button can be tapped", async ({ page }) => {
    for (const route of ["/", "/shop", "/about"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      const dialog = page.getByTestId("newsletter-popup");
      await expect(dialog, route).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(800); // the entrance animation settles
      const vp = page.viewportSize()!;
      const inside = (b: { x: number; y: number; width: number; height: number }) => {
        expect(b.x).toBeGreaterThanOrEqual(-0.5);
        expect(b.y).toBeGreaterThanOrEqual(-0.5);
        expect(b.x + b.width).toBeLessThanOrEqual(vp.width + 0.5);
        expect(b.y + b.height).toBeLessThanOrEqual(vp.height + 0.5);
      };
      inside((await dialog.boundingBox())!);
      const close = page.getByRole("button", { name: "Close" });
      const cb = (await close.boundingBox())!;
      inside(cb);
      if (vp.width <= 1100) {
        expect(cb.width, "close target width").toBeGreaterThanOrEqual(44);
        expect(cb.height, "close target height").toBeGreaterThanOrEqual(44);
      }
      inside((await page.getByTestId("popup-email").boundingBox())!);
      inside((await page.getByTestId("popup-submit").boundingBox())!);
      await close.click();
      await expect(dialog, route).toBeHidden();
      // closing is remembered for a week; forget it so the next route shows the popup again
      await page.evaluate(() => localStorage.removeItem("cosmia.newsletter-popup"));
    }
  });
});
