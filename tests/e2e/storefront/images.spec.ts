import { expect, test } from "@playwright/test";

// E2E-IMG-01 (TF5, I2): the pages that carry the most pictures load every one of them.
const PAGES = [
  "/",
  "/shop",
  "/product/the-renewal-serum",
  "/blog",
  "/about",
  "/categories",
  "/cart",
];

test.describe("Images", () => {
  for (const path of PAGES) {
    test(`E2E-IMG-01 ${path} has no broken picture`, async ({ page }) => {
      const failed: string[] = [];
      page.on("response", (r) => {
        if (/\/images\/|_next\/image/.test(r.url()) && r.status() >= 400) failed.push(r.url());
      });
      await page.goto(path);
      // scroll to the bottom in steps so lazy pictures load
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
      });
      await page.waitForLoadState("networkidle");
      const broken = await page.$$eval("img", (imgs) =>
        imgs
          .filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc !== "")
          .map((i) => i.currentSrc),
      );
      expect(failed).toEqual([]);
      expect(broken).toEqual([]);
    });
  }
});
