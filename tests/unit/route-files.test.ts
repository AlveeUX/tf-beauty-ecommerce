import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function filesNamed(dir: string, name: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesNamed(full, name);
    return entry.name === name ? [path.relative("src/app", full)] : [];
  });
}

describe("route files", () => {
  it("has no loading.tsx under (site)", () => {
    // A loading screen is streamed before the page resolves, so a missing product, post or policy
    // would answer HTTP 200 instead of 404 (a "soft 404") and param-only navigations render the page twice.
    // Home has one; add others only for routes that never call notFound(), and re-run the 404 specs.
    expect(filesNamed(path.resolve("src/app/(site)"), "loading.tsx")).toEqual([]);
  });

  it("has an error boundary for the site, Home and the root", () => {
    for (const file of ["(site)/error.tsx", "(home)/error.tsx", "global-error.tsx"]) {
      expect(fs.existsSync(path.join("src/app", file)), file).toBe(true);
    }
  });
});
