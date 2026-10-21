// TF4-T07: Lighthouse on Home, Shop, a Product page and Checkout, on mobile and desktop.
//   npm run build && npm start -- -p 3300      (in another terminal; one heavy job at a time)
//   node tests/perf/lighthouse.mjs http://localhost:3300 [runs]
// Each page is measured `runs` times (default 3) and the median score is reported, because a single run moves by a few points.
// Lighthouse is run with npx, so it is not a dependency of the template. Results: tests/perf/results/*.json (not committed).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] ?? "http://localhost:3300").replace(/\/$/, "");
const RUNS = Number(process.argv[3] ?? 3);
const LIGHTHOUSE = "lighthouse@13.5.0";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = join("tests", "perf", "results");
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "product", path: "/product/the-renewal-serum" },
  { name: "checkout", path: "/checkout", cart: true },
];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
const TARGETS = { performance: 90, accessibility: 95, "best-practices": 95, seo: 95 };

/** A browser profile whose localStorage already holds a closed welcome popup and one product in the cart. */
async function seededProfile() {
  const dir = join(tmpdir(), "cosmia-lighthouse-profile");
  rmSync(dir, { recursive: true, force: true });
  const { chromium } = await import("@playwright/test");
  const context = await chromium.launchPersistentContext(dir, {
    executablePath: CHROME,
    headless: true,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/api/health`);
  const variants = await (await fetch(`${BASE}/api/variants?slug=the-renewal-serum`)).json();
  await page.evaluate(
    ([variantId]) => {
      localStorage.setItem("cosmia.demo.cart", JSON.stringify([{ variantId, quantity: 1 }]));
    },
    [variants.lines[0].variantId],
  );
  await context.close();
  return dir;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const profile = await seededProfile();
const rows = [];
for (const page of PAGES) {
  for (const device of ["mobile", "desktop"]) {
    const scores = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
    const metrics = { lcp: [], cls: [], tbt: [], bytes: [] };
    for (let run = 1; run <= RUNS; run++) {
      const file = join(OUT, `${page.name}-${device}-${run}.json`);
      const flags = [
        "--headless=new",
        "--no-sandbox",
        ...(page.cart ? [`--user-data-dir=${profile}`] : []),
      ];
      const args = [
        "--yes",
        LIGHTHOUSE,
        BASE + page.path,
        "--output=json",
        `--output-path=${file}`,
        "--quiet",
        `--only-categories=${CATEGORIES.join(",")}`,
        `--chrome-flags=${flags.join(" ")}`,
        ...(device === "desktop" ? ["--preset=desktop"] : []),
        ...(page.cart ? ["--disable-storage-reset"] : []),
      ];
      const result = spawnSync("npx", args, {
        encoding: "utf8",
        shell: process.platform === "win32",
        env: { ...process.env, CHROME_PATH: CHROME },
      });
      if (result.status !== 0) {
        console.error(`${page.name} ${device} run ${run} failed:\n${result.stderr.slice(-600)}`);
        continue;
      }
      const report = JSON.parse(readFileSync(file, "utf8"));
      for (const c of CATEGORIES)
        scores[c].push(Math.round((report.categories[c]?.score ?? 0) * 100));
      metrics.lcp.push(report.audits["largest-contentful-paint"].numericValue);
      metrics.cls.push(report.audits["cumulative-layout-shift"].numericValue);
      metrics.tbt.push(report.audits["total-blocking-time"].numericValue);
      metrics.bytes.push(report.audits["total-byte-weight"].numericValue);
    }
    if (scores.performance.length === 0) continue;
    const row = {
      page: page.name,
      device,
      runs: scores.performance.length,
      ...Object.fromEntries(CATEGORIES.map((c) => [c, median(scores[c])])),
      lcp: Math.round(median(metrics.lcp)),
      cls: Number(median(metrics.cls).toFixed(3)),
      tbt: Math.round(median(metrics.tbt)),
      kb: Math.round(median(metrics.bytes) / 1024),
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
}
console.log("\npage       device   perf  a11y  bp   seo   LCP ms  CLS    TBT ms  KB");
let below = 0;
for (const r of rows) {
  const miss = CATEGORIES.filter((c) => r[c] < TARGETS[c]);
  below += miss.length;
  console.log(
    `${r.page.padEnd(10)} ${r.device.padEnd(8)} ${String(r.performance).padStart(4)}  ${String(r.accessibility).padStart(4)}  ${String(r["best-practices"]).padStart(3)}  ${String(r.seo).padStart(4)}  ${String(r.lcp).padStart(6)}  ${String(r.cls).padEnd(5)}  ${String(r.tbt).padStart(6)}  ${r.kb}${miss.length ? "   below target: " + miss.join(", ") : ""}`,
  );
}
console.log(below === 0 ? "all targets met" : `${below} score(s) below target`);
process.exit(below === 0 ? 0 : 1);
