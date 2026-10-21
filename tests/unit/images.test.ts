import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

// TF5 (D-067): the committed pictures are generated placeholders, and every picture the code names exists.
const ROOT = process.cwd();
const PUBLIC = join(ROOT, "public");
const manifest: { path: string; width: number; height: number }[] = JSON.parse(
  readFileSync(join(ROOT, "assets/placeholders.json"), "utf8"),
);
const mode = process.env.NEXT_PUBLIC_DEMO_IMAGES || "placeholder";

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

describe("images", () => {
  it("every picture in the manifest exists at its listed size", async () => {
    for (const item of manifest) {
      const meta = await sharp(join(PUBLIC, "images", item.path)).metadata();
      expect([item.path, meta.width, meta.height]).toEqual([item.path, item.width, item.height]);
    }
  });

  it("public/images holds no photo that is not in the manifest", () => {
    const listed = new Set(manifest.map((m) => m.path));
    const photos = walk(join(PUBLIC, "images"))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .map((f) => f.slice(join(PUBLIC, "images").length + 1).replaceAll("\\", "/"));
    expect(photos.filter((p) => !listed.has(p))).toEqual([]);
  });

  it.skipIf(mode !== "placeholder")("the placeholder set is small (no real photos shipped)", () => {
    const bytes = manifest.reduce(
      (sum, m) => sum + readFileSync(join(PUBLIC, "images", m.path)).length,
      0,
    );
    expect(bytes).toBeLessThan(3 * 1024 * 1024);
  });

  it("every /images path named in the code or the data file exists", () => {
    const files = [...walk(join(ROOT, "src"))].filter((f) => /\.(tsx?|css|json)$/.test(f));
    const missing = new Set<string>();
    for (const file of files) {
      for (const match of readFileSync(file, "utf8").matchAll(
        /\/images\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|svg|webp)/g,
      )) {
        if (!existsSync(join(PUBLIC, match[0]))) missing.add(match[0]);
      }
    }
    expect([...missing]).toEqual([]);
  });
});
