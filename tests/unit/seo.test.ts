import { describe, expect, it } from "vitest";
import { pageMeta, snippet } from "../../src/lib/seo";
import { site } from "../../src/config/site";

describe("pageMeta", () => {
  it("names the page, repeats the share tags and sets the canonical address", () => {
    const meta = pageMeta({ title: "Shop", description: "All products.", path: "/shop" });
    expect(meta.title).toBe("Shop");
    expect(meta.alternates?.canonical).toBe("/shop");
    expect(meta.openGraph).toMatchObject({
      title: `Shop | ${site.name}`,
      description: "All products.",
      url: "/shop",
    });
    expect(meta.twitter).toMatchObject({ title: `Shop | ${site.name}` });
    expect(meta.robots).toBeUndefined();
  });

  it("uses an absolute title for the Home page", () => {
    const meta = pageMeta({
      title: "Brand | Tagline",
      description: "x",
      path: "/",
      absoluteTitle: true,
    });
    expect(meta.title).toEqual({ absolute: "Brand | Tagline" });
    expect(meta.openGraph).toMatchObject({ title: "Brand | Tagline" });
  });

  it("keeps personal pages out of search results", () => {
    const meta = pageMeta({ title: "Cart", description: "x", path: "/cart", noindex: true });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("snippet", () => {
  it("leaves short text alone and collapses whitespace", () => {
    expect(snippet("  a   short\n text ")).toBe("a short text");
  });

  it("cuts long text at a word boundary within the limit", () => {
    const long = "word ".repeat(80);
    const cut = snippet(long, 160);
    expect(cut.length).toBeLessThanOrEqual(160);
    expect(cut.endsWith("…")).toBe(true);
    expect(cut).not.toMatch(/wor…$/);
  });
});
