// Side-by-side check of two running copies of the storefront (TF1 exit gate: the template looks like main).
// Usage: node tests/visual/compare-main.mjs <mainBase> <branchBase> <outDir>
//   e.g. node tests/visual/compare-main.mjs http://localhost:3400 http://localhost:3300 out
// Prints, per route, the page heights and how many pixels differ noticeably (any channel off by > 24).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const [mainBase, branchBase, outDir = "visual-compare"] = process.argv.slice(2);
if (!mainBase || !branchBase) {
  console.error("usage: node tests/visual/compare-main.mjs <mainBase> <branchBase> <outDir>");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const SLUG = "the-renewal-serum";
const ROUTES = [
  ["home", "/"],
  ["shop", "/shop"],
  ["shop-list-left", "/shop?layout=list-left"],
  ["pdp", `/product/${SLUG}`],
  ["pdp-inner-zoom", `/product/${SLUG}?layout=inner-zoom`],
  ["blog", "/blog"],
  ["login", "/login"],
  ["track-order", "/track-order"],
  ["cart-empty", "/cart"],
  ["cart-filled", "/cart", true],
  ["checkout-filled", "/checkout", true],
];
const POPUP_KEY = "cosmia.newsletter-popup";

/** Put one product in the cart: main keeps it on the server (cookie), the branch in localStorage. */
async function fillCart(page, base, isMain) {
  if (isMain) {
    await page.request.post(`${base}/api/cart/items`, { data: { slug: SLUG, quantity: 1 } });
    return;
  }
  const res = await page.request.get(`${base}/api/variants?slug=${SLUG}`);
  const { variantId } = (await res.json()).lines[0];
  await page.goto(`${base}/api/health`);
  await page.evaluate(
    ([id]) =>
      localStorage.setItem("cosmia.demo.cart", JSON.stringify([{ variantId: id, quantity: 1 }])),
    [variantId],
  );
}

async function shoot(browser, base, isMain, route, withCart) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  await page.goto(`${base}/api/health`);
  await page.evaluate(
    ([k]) => localStorage.setItem(k, JSON.stringify({ at: 4102444800000, subscribed: false })),
    [POPUP_KEY],
  );
  if (withCart) await fillCart(page, base, isMain);
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: "*,*::before,*::after{animation:none!important;transition:none!important}",
  });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  const buffer = await page.screenshot({ fullPage: true });
  await context.close();
  return buffer;
}

const browser = await chromium.launch();
console.log(
  "route".padEnd(18),
  "main h".padStart(7),
  "branch h".padStart(9),
  "differing px".padStart(14),
);
for (const [name, route, withCart] of ROUTES) {
  const a = await shoot(browser, mainBase, true, route, withCart);
  const b = await shoot(browser, branchBase, false, route, withCart);
  fs.writeFileSync(path.join(outDir, `${name}-main.png`), a);
  fs.writeFileSync(path.join(outDir, `${name}-branch.png`), b);
  const [ma, mb] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  const width = Math.min(ma.width, mb.width);
  const height = Math.min(ma.height, mb.height);
  const crop = (buf) =>
    sharp(buf).extract({ left: 0, top: 0, width, height }).removeAlpha().raw().toBuffer();
  const [ra, rb] = await Promise.all([crop(a), crop(b)]);
  let differing = 0;
  for (let i = 0; i < ra.length; i += 3) {
    if (
      Math.abs(ra[i] - rb[i]) > 24 ||
      Math.abs(ra[i + 1] - rb[i + 1]) > 24 ||
      Math.abs(ra[i + 2] - rb[i + 2]) > 24
    ) {
      differing++;
    }
  }
  const pct = ((differing / (width * height)) * 100).toFixed(3);
  console.log(
    name.padEnd(18),
    String(ma.height).padStart(7),
    String(mb.height).padStart(9),
    `${differing} (${pct}%)`.padStart(14),
  );
}
await browser.close();
