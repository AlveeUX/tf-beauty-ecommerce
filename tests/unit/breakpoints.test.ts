import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// TF3-C12: the only widths a stylesheet may switch layout at are the three agreed in docs/responsive-spec.md
// (section 3): 1439 (laptop), 1100 (tablet) and 767 (phone). Anything else makes layouts change at unrelated widths.
const ALLOWED = new Set([1439, 1100, 767]);

// "(hover: hover) and (pointer: fine)" and "print": media features that are about the device, not the width
const CAPABILITY_ONLY =
  /^\s*(print|\(\s*(hover|pointer)\s*:\s*[a-z]+\s*\)(\s+and\s+\(\s*(hover|pointer)\s*:\s*[a-z]+\s*\))*)\s*$/;

function stylesheets(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return stylesheets(full);
    return entry.name.endsWith(".css") ? [full] : [];
  });
}

describe("responsive breakpoints", () => {
  const files = stylesheets(path.resolve("src"));

  it("scans the stylesheets", () => {
    expect(files.length).toBeGreaterThan(60);
  });

  it("uses only the three agreed max-width values and no min-width queries", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      for (const query of text.matchAll(/@media([^{]*)\{/g)) {
        const condition = query[1] ?? "";
        if (/prefers-/.test(condition)) continue; // reduced motion, colour scheme: not layout breakpoints
        // pointer capability (hover effects only on a mouse) and print are not layout breakpoints either; a query that
        // mixes one of them with a width is still checked below
        if (CAPABILITY_ONLY.test(condition)) continue;
        for (const feature of condition.matchAll(/\(\s*(min|max)-width:\s*([\d.]+)px\s*\)/g)) {
          const width = Number(feature[2]);
          if (feature[1] === "min" || !ALLOWED.has(width)) {
            offenders.push(`${path.relative("src", file)}: ${feature[0]}`);
          }
        }
        if (!/\(\s*max-width/.test(condition))
          offenders.push(`${path.relative("src", file)}: @media${condition.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
