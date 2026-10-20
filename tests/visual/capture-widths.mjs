// Screenshots of the same pages at the four test widths, for the TF3 review gates.
// Usage: node tests/visual/capture-widths.mjs <baseUrl> <outDir> [route ...]
// Writes <outDir>/<route-name>-<width>.png (first screen only at 390 and 768; full page at 1440 and 1024).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const [base, outDir, ...routes] = process.argv.slice(2);
if (!base || !outDir) {
  console.error("usage: node tests/visual/capture-widths.mjs <baseUrl> <outDir> [route ...]");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const ROUTES = routes.length
  ? routes
  : [
      "/",
      "/shop",
      "/shop?layout=list-left",
      "/product/the-renewal-serum",
      "/cart",
      "/checkout",
      "/blog/inside-the-formula-behind-beautiful-skin",
      "/contact",
      "/login",
    ];
const WIDTHS = [
  { width: 1440, height: 900, full: true },
  { width: 1024, height: 768, full: true },
  { width: 768, height: 1024, full: false },
  { width: 390, height: 844, full: false },
];

const browser = await chromium.launch();
for (const route of ROUTES) {
  for (const { width, height, full } of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width <= 768,
      hasTouch: width <= 768,
    });
    await context.addInitScript(() =>
      localStorage.setItem(
        "cosmia.newsletter-popup",
        JSON.stringify({ at: 4102444800000, subscribed: false }),
      ),
    );
    const page = await context.newPage();
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important}",
    });
    const name = route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    await page.screenshot({ path: path.join(outDir, `${name}-${width}.png`), fullPage: full });
    await context.close();
  }
}
await browser.close();
console.log(`saved ${ROUTES.length * WIDTHS.length} screenshots to ${outDir}`);
