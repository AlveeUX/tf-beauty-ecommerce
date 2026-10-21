// TF4-T06: validate the HTML the server sends for every page and layout variant.
//   npm run build && npm start -- -p 3300      (in another terminal)
//   node tests/html/validate-html.mjs http://localhost:3300             server HTML, as a crawler or an online validator sees it
//   node tests/html/validate-html.mjs http://localhost:3300 --rendered  the page after the scripts ran, with a filled cart
// The validator is run with npx so it is not a dependency of the template.
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] ?? "http://localhost:3300").replace(/\/$/, "");
const RENDERED = process.argv.includes("--rendered");
const VALIDATOR = "html-validate@11.17.0";

const KEY_ROUTES = [
  "/",
  "/shop",
  "/product/the-renewal-serum",
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
  "/policy/shipping",
  "/login",
  "/register",
  "/forgot-password",
  "/account",
  "/track-order",
  "/demos",
  "/ui-kit",
  "/this-page-does-not-exist",
];

let browser;
let context;

async function openBrowser() {
  const { chromium } = await import("@playwright/test");
  browser = await chromium.launch();
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // a visitor who closed the welcome popup and has a product in the cart and the wishlist, so those views have content
  const page = await context.newPage();
  await page.goto(`${BASE}/api/health`);
  const variants = await (await fetch(`${BASE}/api/variants?slug=the-renewal-serum`)).json();
  await page.evaluate(
    ([variantId]) => {
      localStorage.setItem(
        "cosmia.newsletter-popup",
        JSON.stringify({ at: 4102444800000, subscribed: false }),
      );
      localStorage.setItem("cosmia.demo.cart", JSON.stringify([{ variantId, quantity: 2 }]));
      localStorage.setItem("cosmia.wishlist.v1", JSON.stringify(["the-renewal-serum"]));
    },
    [variants.lines[0].variantId],
  );
  await page.close();
}

async function html(path) {
  if (!RENDERED) {
    const response = await fetch(BASE + path);
    return { status: response.status, body: await response.text() };
  }
  const page = await context.newPage();
  const response = await page.goto(BASE + path, { waitUntil: "networkidle" });
  const body = await page.content();
  // a page that sent the visitor on (account pages when signed out) is checked as the page it ended on
  const landed = new URL(page.url()).pathname;
  await page.close();
  return { status: response?.status() ?? 0, body, redirected: landed !== path.split("?")[0] };
}

if (RENDERED) await openBrowser();

// every layout variant is linked from the demo hub
const hub = await html("/demos");
const variants = [...hub.body.matchAll(/href="(\/[^"#]*)"/g)]
  .map((m) => m[1].replaceAll("&amp;", "&"))
  .filter((href) => !/\.[a-z0-9]+(\?|$)/i.test(href)); // pages only: not icons, images or feeds
const routes = [...new Set([...KEY_ROUTES, ...variants])];

const dir = join(tmpdir(), "cosmia-html-validate");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const files = [];
const names = new Map();
const redirected = [];
for (const [index, route] of routes.entries()) {
  const { body, redirected: sentOn } = await html(route);
  // the browser keeps the old page's <title> next to the new one after such a client-side redirect (a Next.js quirk);
  // the page the visitor lands on is validated under its own address, and the server HTML of this one in the plain run
  if (sentOn) {
    redirected.push(route);
    continue;
  }
  const file = join(
    dir,
    `${String(index).padStart(3, "0")}${route.replace(/[^a-z0-9]+/gi, "_")}.html`,
  );
  writeFileSync(file, body);
  files.push(file);
  names.set(file, route);
}
await browser?.close();
console.log(
  `${routes.length - redirected.length} pages ${RENDERED ? "rendered" : "fetched"} from ${BASE}` +
    (redirected.length ? `; skipped, they redirect: ${redirected.join(", ")}` : ""),
);

const result = spawnSync(
  "npx",
  ["--yes", VALIDATOR, "--config", "tests/html/htmlvalidate.json", "--formatter", "json", ...files],
  { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, shell: process.platform === "win32" },
);
const report = JSON.parse(result.stdout || "[]");
let errors = 0;
const byRule = new Map();
for (const file of report) {
  for (const message of file.messages) {
    errors += 1;
    const key = message.ruleId ?? "parse";
    const entry = byRule.get(key) ?? {
      count: 0,
      pages: new Set(),
      sample: message.message,
      selector: message.selector,
    };
    entry.count += 1;
    entry.pages.add(names.get(file.filePath) ?? file.filePath);
    byRule.set(key, entry);
  }
}
for (const [rule, { count, pages, sample, selector }] of [...byRule].sort(
  (a, b) => b[1].count - a[1].count,
)) {
  console.log(
    `${String(count).padStart(5)}  ${rule}  (${pages.size} pages)  ${selector ?? ""}: ${sample}`,
  );
  console.log(`       ${[...pages].slice(0, 3).join("  ")}`);
}
console.log(errors === 0 ? "0 errors" : `${errors} errors`);
process.exit(errors === 0 ? 0 : 1);
