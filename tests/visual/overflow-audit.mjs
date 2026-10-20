// Responsive baseline: for each route and viewport width, does the page scroll sideways, and by how much?
// Usage: node tests/visual/overflow-audit.mjs <baseUrl> [widths=1920,1440,1024,768,390]
// Prints a table (route x width: page overflow in px, or "ok") and the widest offender per failing cell.
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100", widthsArg = "1920,1440,1024,768,390"] =
  process.argv.slice(2);
const widths = widthsArg.split(",").map(Number);

const ROUTES = [
  "/",
  "/shop",
  "/shop?layout=list-left",
  "/shop?layout=top-filter",
  "/shop?layout=filter-drawer",
  "/product/the-renewal-serum",
  "/product/the-renewal-serum?layout=gallery-2-column",
  "/cart",
  "/checkout",
  "/wishlist",
  "/compare",
  "/categories",
  "/search?q=serum",
  "/blog",
  "/blog/inside-the-formula-behind-beautiful-skin",
  "/about",
  "/contact",
  "/faqs",
  "/store-locator",
  "/policy/privacy",
  "/login",
  "/register",
  "/track-order",
  "/demos",
  "/ui-kit",
  "/this-page-does-not-exist",
];

const browser = await chromium.launch();
const rows = [];
for (const route of ROUTES) {
  const cells = [];
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(() =>
      localStorage.setItem(
        "cosmia.newsletter-popup",
        JSON.stringify({ at: 4102444800000, subscribed: false }),
      ),
    );
    const page = await context.newPage();
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    const result = await page.evaluate(() => {
      const doc = document.documentElement;
      const over = Math.max(0, doc.scrollWidth - doc.clientWidth);
      let worst = null;
      if (over > 0) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > doc.clientWidth + 1 && (!worst || r.right > worst.right)) {
            worst = {
              right: Math.round(r.right),
              tag: el.tagName.toLowerCase(),
              cls: String(el.className).slice(0, 40),
            };
          }
        }
      }
      return { over, worst };
    });
    cells.push({ width, ...result });
    await context.close();
  }
  rows.push({ route, cells });
}
await browser.close();

console.log(["route".padEnd(52), ...widths.map((w) => String(w).padStart(7))].join(" "));
const failing = {};
for (const { route, cells } of rows) {
  console.log(
    [route.padEnd(52), ...cells.map((c) => (c.over ? `+${c.over}` : "ok").padStart(7))].join(" "),
  );
  for (const c of cells) if (c.over) failing[c.width] = (failing[c.width] ?? 0) + 1;
}
console.log("\nroutes that scroll sideways, by width:", JSON.stringify(failing));
