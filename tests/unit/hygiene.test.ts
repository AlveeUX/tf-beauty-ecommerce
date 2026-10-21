import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// TF4-T03: what a reviewer greps for first. No debug output, no open to-dos and no mention of features this
// template no longer has (the database and the admin were removed in TF1). tests/visual holds standalone
// developer scripts that print on purpose, so it is not scanned.
const SCANNED = [
  "src",
  "tests/e2e",
  "tests/unit",
  "tests/integration",
  "tests/api",
  "tests/helpers",
];
const SOURCE = /\.(tsx?|css|json)$/;

function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return SOURCE.test(entry.name) ? [full] : [];
  });
}

const all = SCANNED.flatMap(files).filter((file) => !file.endsWith("hygiene.test.ts"));

function offenders(pattern: RegExp) {
  return all.filter((file) => pattern.test(fs.readFileSync(file, "utf8")));
}

describe("code hygiene", () => {
  it("scans the source tree", () => {
    expect(all.length).toBeGreaterThan(100);
  });

  it("has no console.log or console.debug", () => {
    expect(offenders(/console\.(log|debug|info)\(/)).toEqual([]);
  });

  it("has no TODO, FIXME, XXX or HACK markers", () => {
    expect(offenders(/\b(TODO|FIXME|XXX|HACK)\b/)).toEqual([]);
  });

  it("does not mention the removed database or admin", () => {
    // "Admin Reply" is the label of the store's answer to a review in the design, so it is allowed
    expect(offenders(/sqlite|drizzle|\bmigrat(e|ion)|admin dashboard|admin panel/i)).toEqual([]);
  });
});
