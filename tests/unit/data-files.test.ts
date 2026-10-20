import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DATA_FILES, type DataFileName } from "../../src/data/schema";

const dir = path.resolve("src/data");
const read = (name: string): Record<string, unknown>[] =>
  JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
const names = Object.keys(DATA_FILES) as DataFileName[];

describe("src/data JSON files", () => {
  it("has a schema for every JSON file and a file for every schema", () => {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .sort();
    expect(files).toEqual([...names].sort());
  });

  it.each(names)("%s passes its schema", (name) => {
    const rows = read(name);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) DATA_FILES[name].parse(row);
  });

  it("has unique ids, slugs and SKUs", () => {
    for (const [file, key] of [
      ["categories", "id"],
      ["categories", "slug"],
      ["products", "id"],
      ["products", "slug"],
      ["variants", "id"],
      ["variants", "sku"],
      ["blog_posts", "slug"],
      ["colors", "slug"],
    ] as const) {
      const values = read(file).map((r) => r[key]);
      expect(new Set(values).size, `${file}.${key}`).toBe(values.length);
    }
  });

  it("resolves every reference", () => {
    const ids = (file: string) => new Set(read(file).map((r) => r.id));
    const products = ids("products");
    const variants = ids("variants");
    const categories = ids("categories");
    const colors = ids("colors");
    const posts = ids("blog_posts");
    const collections = ids("collections");
    const comments = ids("blog_comments");
    const refs: [string, string, Set<unknown>, boolean?][] = [
      ["product_images", "productId", products],
      ["variants", "productId", products],
      ["inventory", "variantId", variants],
      ["product_categories", "productId", products],
      ["product_categories", "categoryId", categories],
      ["product_colors", "productId", products],
      ["product_colors", "colorId", colors],
      ["product_tags", "productId", products],
      ["collection_products", "productId", products],
      ["collection_products", "collectionId", collections],
      ["reviews", "productId", products],
      ["blog_comments", "postId", posts],
      ["blog_comments", "parentId", comments, true],
      ["categories", "parentId", categories, true],
    ];
    for (const [file, key, target, nullable] of refs) {
      for (const row of read(file)) {
        const v = row[key];
        if (nullable && v === null) continue;
        expect(target.has(v), `${file}.${key}=${String(v)}`).toBe(true);
      }
    }
  });

  it("gives every product one default variant", () => {
    const defaults = new Map<unknown, number>();
    for (const v of read("variants")) {
      if (v.isDefault) defaults.set(v.productId, (defaults.get(v.productId) ?? 0) + 1);
    }
    for (const p of read("products")) expect(defaults.get(p.id), String(p.slug)).toBe(1);
  });
});
