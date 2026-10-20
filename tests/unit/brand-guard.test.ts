import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "../../src/config/site";

// TF2-T01: the brand and the demo contact details are set in src/config/site.ts and nowhere else, so that
// changing that one file rebrands the template. Content files in src/data hold product and blog text and are exempt.
const ROOT = path.resolve("src");
const EXEMPT = [path.join(ROOT, "config", "site.ts"), path.join(ROOT, "data")];
// browser storage keys keep their prefix (changing it would drop buyers' saved carts on update)
const STORAGE_KEY = /cosmia[.:](demo|wishlist|compare|newsletter|review)/gi;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (EXEMPT.includes(full)) return [];
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : [];
  });
}

const hardCoded = [
  { what: "the brand name", pattern: /cosmia/i },
  { what: "the tagline", pattern: /Skincare (&|&amp;) Cosmetics/ },
  { what: "the demo street address", pattern: /Oakridge/ },
  { what: "the demo phone number", pattern: /544-7828/ },
];

describe("site settings are the only place for the brand and contact details", () => {
  const files = sourceFiles(ROOT);

  it("scans the source tree", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(hardCoded)("no file hard-codes $what", ({ pattern }) => {
    const offenders = files.flatMap((file) => {
      const text = fs.readFileSync(file, "utf8").replace(STORAGE_KEY, "");
      return pattern.test(text) ? [path.relative(ROOT, file)] : [];
    });
    expect(offenders).toEqual([]);
  });

  it("site.ts itself is complete and well formed", () => {
    expect(site.name.length).toBeGreaterThan(0);
    expect(site.commerce.freeShippingThresholdCents).toBeGreaterThan(
      site.commerce.shippingFlatRateCents,
    );
    expect(Number.isInteger(site.commerce.freeShippingThresholdCents)).toBe(true);
    expect(Number.isInteger(site.commerce.shippingFlatRateCents)).toBe(true);
    for (const email of Object.values(site.contact.emails))
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(site.contact.phone.href).toMatch(/^tel:\+\d+$/);
    for (const url of Object.values(site.socials)) expect(url).toMatch(/^https:\/\//);
    expect(new Set(site.commerce.countries).size).toBe(site.commerce.countries.length);
  });
});
