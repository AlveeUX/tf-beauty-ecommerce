// Colour-contrast audit: which foreground/background pairs fail WCAG AA, where, and what is the smallest change that passes?
// Usage: node tests/visual/contrast-audit.mjs <baseUrl> [width=1440]
// Groups every axe "color-contrast" finding by (text colour, background colour, text size) and, for each group,
// proposes the nearest same-hue colour for the text that reaches the required ratio.
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100", widthArg = "1440"] = process.argv.slice(2);
const width = Number(widthArg);

const ROUTES = [
  "/",
  "/shop",
  "/shop?layout=list-left",
  "/shop?layout=top-filter",
  "/shop?layout=filter-drawer",
  "/product/the-renewal-serum",
  "/product/the-renewal-serum?layout=on-sale-countdown",
  "/product/barrier-repair-cream?layout=on-sale-countdown",
  "/product/glass-glow-primer",
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
  "/forgot-password",
  "/track-order",
  "/demos",
  "/ui-kit",
  "/this-page-does-not-exist",
];

const hex = (n) => n.toString(16).padStart(2, "0");
const parse = (s) => {
  const m = /^#?([0-9a-f]{6})/i.exec(s.trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const toHex = ([r, g, b]) => `#${hex(r)}${hex(g)}${hex(b)}`;
const lum = ([r, g, b]) => {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
function toHsl([r, g, b]) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function fromHsl([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}
/** Same hue and saturation, lightness moved away from the background until the ratio is met. */
function fixText(fg, bg, need) {
  const [h, s, l] = toHsl(fg);
  const darker = lum(bg) > 0.18;
  for (let step = 0; step <= 100; step++) {
    const nl = darker ? Math.max(0, l - step / 200) : Math.min(1, l + step / 200);
    const out = fromHsl([h, s, nl]);
    if (ratio(out, bg) >= need) return toHex(out);
  }
  return darker ? "#000000" : "#ffffff";
}

const browser = await chromium.launch();
const groups = new Map();
for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addInitScript(() =>
    localStorage.setItem(
      "cosmia.newsletter-popup",
      JSON.stringify({ at: 4102444800000, subscribed: false }),
    ),
  );
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  for (const violation of results.violations) {
    for (const node of violation.nodes) {
      const data = node.any[0]?.data;
      if (!data || !data.fgColor || !data.bgColor) continue;
      const key = `${data.fgColor}|${data.bgColor}|${data.expectedContrastRatio}`;
      const g = groups.get(key) ?? {
        fg: data.fgColor,
        bg: data.bgColor,
        need: Number.parseFloat(data.expectedContrastRatio),
        got: data.contrastRatio,
        size: `${data.fontSize} ${data.fontWeight}`,
        nodes: 0,
        routes: new Set(),
        sample: node.target.join(" ").slice(0, 70),
      };
      g.nodes++;
      g.routes.add(route);
      groups.set(key, g);
    }
  }
  await context.close();
}
await browser.close();

const rows = [...groups.values()].sort((a, b) => b.nodes - a.nodes);
console.log(
  `width ${width}: ${rows.reduce((n, g) => n + g.nodes, 0)} failing text nodes in ${rows.length} colour pairs\n`,
);
console.log(
  "text      on        ratio  need   nodes routes  size            suggested text colour   sample",
);
for (const g of rows) {
  const fg = parse(g.fg);
  const bg = parse(g.bg);
  const suggestion =
    fg && bg
      ? `${fixText(fg, bg, g.need)} (${ratio(parse(fixText(fg, bg, g.need)), bg).toFixed(2)})`
      : "n/a";
  console.log(
    [
      g.fg.padEnd(9),
      g.bg.padEnd(9),
      String(g.got).padEnd(6),
      String(g.need).padEnd(6),
      String(g.nodes).padStart(5),
      String(g.routes.size).padStart(6),
      "  ",
      g.size.padEnd(15),
      suggestion.padEnd(22),
      g.sample,
    ].join(" "),
  );
}
