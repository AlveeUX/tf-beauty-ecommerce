// Phone-width usability audit: can a visitor reach the navigation, are controls big enough, is text readable?
// Usage: node tests/visual/mobile-audit.mjs <baseUrl> [width=390]
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100", widthArg = "390"] = process.argv.slice(2);
const width = Number(widthArg);

const ROUTES = [
  "/",
  "/shop",
  "/product/the-renewal-serum",
  "/cart",
  "/checkout",
  "/wishlist",
  "/compare",
  "/blog",
  "/blog/inside-the-formula-behind-beautiful-skin",
  "/about",
  "/contact",
  "/faqs",
  "/store-locator",
  "/login",
  "/track-order",
];

const browser = await chromium.launch();
console.log(`width ${width}\n`);
console.log(
  "route".padEnd(48),
  "ctrls<44px".padStart(11),
  "text<14px".padStart(10),
  "header nav links visible".padStart(26),
);
for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true });
  await context.addInitScript(() =>
    localStorage.setItem(
      "cosmia.newsletter-popup",
      JSON.stringify({ at: 4102444800000, subscribed: false }),
    ),
  );
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const m = await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    const controls = [
      ...document.querySelectorAll(
        "a[href], button, input:not([type=hidden]), select, textarea, [role=button]",
      ),
    ].filter(visible);
    const small = controls.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width < 44 || r.height < 44;
    });
    let smallText = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || !node.parentElement || !visible(node.parentElement)) continue;
      if (Number.parseFloat(getComputedStyle(node.parentElement).fontSize) < 14) smallText++;
    }
    const navLinks = [...document.querySelectorAll("header a[href]")]
      .filter(visible)
      .filter((a) => a.textContent.trim().length > 2);
    return {
      controls: controls.length,
      small: small.length,
      smallText,
      navLinks: navLinks.length,
      navSample: navLinks
        .slice(0, 4)
        .map((a) => a.textContent.trim().slice(0, 14))
        .join(", "),
    };
  });
  console.log(
    route.padEnd(48),
    `${m.small}/${m.controls}`.padStart(11),
    String(m.smallText).padStart(10),
    `${m.navLinks} ${m.navSample ? `(${m.navSample})` : ""}`.padStart(26),
  );
  await context.close();
}
await browser.close();
