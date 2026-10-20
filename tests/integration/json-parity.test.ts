import { beforeAll, describe, expect, it } from "vitest";
import { createJsonProvider } from "../../src/data/json-provider";
import type { DataProvider } from "../../src/data/provider";
import { tables } from "../../src/data/tables";
import { createDb, type Db } from "../../src/db/client";
import { runMigrations } from "../../src/db/migrate";
import { seedCatalog } from "../../src/db/seed";
import { getBanners } from "../../src/server/content/banners";
import * as blog from "../../src/server/blog/queries";
import { lookupProducts } from "../../src/server/catalog/lookup";
import { getQuickView } from "../../src/server/catalog/quick-view";
import { DEFAULT_QUERY, parseCatalogQuery } from "../../src/server/catalog/query";
import * as catalog from "../../src/server/catalog/service";

// TF1-T03 evidence: the JSON provider must return exactly what the SQL services return for the same seed.
// Deleted in T09 together with the SQL services.
let db: Db;
let json: DataProvider;
// Dates are the one thing that cannot match exactly: the SQL seed stamps rows with the clock at seed time,
// the JSON holds the moment it was exported. Two Dates compare equal here; the rolling deadlines have their
// own test below.
expect.addEqualityTesters([(a, b) => (a instanceof Date && b instanceof Date ? true : undefined)]);
const q = (params: Record<string, string | string[]>) => parseCatalogQuery(params).query;

beforeAll(() => {
  db = createDb(":memory:").db;
  runMigrations(db);
  seedCatalog(db);
  json = createJsonProvider(tables);
});

const QUERIES: Record<string, string | string[]>[] = [
  {},
  { sort: "price-asc" },
  { sort: "price-desc" },
  { sort: "newest" },
  { sort: "rating" },
  { page: "2" },
  { page: "99" },
  { q: "serum" },
  { q: "rose lip" },
  { q: "vitamin c" },
  { q: "100%" },
  { q: "zzzz" },
  { categories: "skincare" },
  { categories: "cleansers,masks" },
  { categories: "makeup", sort: "price-asc" },
  { categories: "nope" },
  { price: "20-50" },
  { price: "0-10" },
  { size: "mini" },
  { size: "mini,jumbo" },
  { color: "peach" },
  { color: "rose,crimson", categories: "makeup" },
  { rating: "4" },
  { rating: "4.5", sort: "rating" },
  { availability: "in-stock" },
  { availability: "on-sale" },
  { availability: "in-stock,on-sale", categories: "skincare" },
  { badge: "new" },
  { badge: "best-seller", sort: "newest" },
  { collection: "best-sellers" },
  { collection: "nope" },
  { q: "oil", categories: "skincare", price: "10-60", sort: "price-desc", page: "1" },
];

describe("JSON provider matches the SQL services", () => {
  it.each(QUERIES.map((p) => [JSON.stringify(p), p] as const))("listProducts %s", (_n, params) => {
    expect(json.listProducts(q(params))).toEqual(catalog.listProducts(db, q(params)));
  });

  it.each(QUERIES.map((p) => [JSON.stringify(p), p] as const))("getFacets %s", (_n, params) => {
    expect(json.getFacets(q(params))).toEqual(catalog.getFacets(db, q(params)));
  });

  it("returns the same product detail, quick view and lookup for every product", () => {
    const slugs = tables.products.map((p) => p.slug);
    expect(slugs.length).toBe(36);
    for (const slug of [...slugs, "nope"]) {
      expect(json.getProductBySlug(slug), slug).toEqual(catalog.getProductBySlug(db, slug));
      expect(json.getQuickView(slug), slug).toEqual(getQuickView(db, slug));
    }
    expect(json.lookupProducts([...slugs, "nope"].reverse())).toEqual(
      lookupProducts(db, [...slugs, "nope"].reverse()),
    );
    expect(json.getProductsBySlugs(["the-renewal-serum", "nope", slugs[3]!])).toEqual(
      catalog.getProductsBySlugs(db, ["the-renewal-serum", "nope", slugs[3]!]),
    );
  });

  it("returns the same reviews and related products", () => {
    for (const p of tables.products) {
      expect(json.getApprovedReviews(p.id), p.slug).toEqual(catalog.getApprovedReviews(db, p.id));
      expect(json.getRelatedProducts(p.id), p.slug).toEqual(catalog.getRelatedProducts(db, p.id));
    }
    expect(json.getRelatedProducts(1, 12)).toEqual(catalog.getRelatedProducts(db, 1, 12));
  });

  it("returns the same navigation, collections and suggestions", () => {
    expect(json.getCategoryTree()).toEqual(catalog.getCategoryTree(db));
    expect(json.getCategoryTree({ includeEmpty: true })).toEqual(
      catalog.getCategoryTree(db, { includeEmpty: true }),
    );
    expect(json.getCategoryCards()).toEqual(catalog.getCategoryCards(db));
    for (const c of tables.collections) {
      expect(json.getCollectionProducts(c.slug)).toEqual(catalog.getCollectionProducts(db, c.slug));
      expect(json.getCollectionProducts(c.slug, 2)).toEqual(
        catalog.getCollectionProducts(db, c.slug, 2),
      );
    }
    for (const term of ["se", "serum", "lip", "skin", "x", "", "  rose  ", "100%"]) {
      expect(json.searchSuggestions(term), term).toEqual(catalog.searchSuggestions(db, term));
    }
  });

  it("returns the same banners", () => {
    const slots = [...new Set(tables.banners.map((b) => b.slot)), "nope"];
    for (const slot of slots) {
      expect(json.getBanners(slot), slot).toEqual(getBanners(db, slot));
    }
    const future = new Date("2099-01-01T00:00:00Z");
    // home-flash is a rolling countdown by design (always ends after read time), so it is excluded here
    for (const slot of slots.filter((x) => x !== "home-flash")) {
      expect(json.getBanners(slot, future), slot).toEqual(getBanners(db, slot, future));
    }
  });

  it("returns the same blog data", () => {
    const filters = [
      {},
      { category: "skincare" },
      { category: "SKINCARE" },
      { tag: "serum" },
      { q: "skin" },
      { q: "100%" },
    ];
    for (const f of filters) {
      for (const [page, size] of [
        [1, 6],
        [2, 5],
        [9, 4],
      ] as const) {
        expect(json.listPosts(f, page, size), JSON.stringify(f)).toEqual(
          blog.listPosts(db, f, page, size),
        );
      }
    }
    expect(json.sidebarData()).toEqual(blog.sidebarData(db));
    for (const p of tables.blogPosts) {
      expect(json.getPost(p.slug), p.slug).toEqual(blog.getPost(db, p.slug));
      expect(json.neighbours(p.slug), p.slug).toEqual(blog.neighbours(db, p.slug));
      expect(json.sidebarData(p.slug), p.slug).toEqual(blog.sidebarData(db, p.slug));
      const id = json.postIdFor(p.slug);
      expect(id).toBe(blog.postIdFor(db, p.slug));
      expect(json.approvedComments(id!)).toEqual(blog.approvedComments(db, id!));
    }
    expect(json.getPost("nope")).toBeNull();
    expect(json.postIdFor("nope")).toBeNull();
  });

  it("derives the rolling deadlines from the read time", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    const [flash] = json.getBanners("home-flash", now);
    expect(flash!.endsAt!.getTime() - now.getTime()).toBe(
      ((2 * 24 + 8) * 3600 + 30 * 60 + 16) * 1000,
    );
    const onSale = tables.products.filter((p) => p.saleEndsInMs !== null);
    expect(onSale.length).toBeGreaterThan(0);
    for (const p of onSale) {
      const detail = json.getProductBySlug(p.slug)!;
      const left = detail.saleEndsAt!.getTime() - Date.now();
      expect(left).toBeGreaterThan(19.9 * 86_400_000);
      expect(left).toBeLessThanOrEqual(20 * 86_400_000);
    }
  });

  it("uses the default query when none is given", () => {
    expect(json.listProducts(DEFAULT_QUERY).total).toBe(
      catalog.listProducts(db, DEFAULT_QUERY).total,
    );
  });
});
