import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "../../src/db/client";
import { runMigrations } from "../../src/db/migrate";
import { reviews, products } from "../../src/db/schema";
import type { Tables } from "../../src/data/tables";
import { seedCatalog } from "../../src/db/seed";
import { formatMoney } from "../../src/lib/money";
import { parseProductContent } from "../../src/lib/product-content";
import { priceRangeLabel } from "../../src/lib/price-format";
import { getBanners } from "../../src/server/content/banners";
import { getBundles } from "../../src/server/content/bundles";
import { reviewInputSchema, submitReview } from "../../src/server/catalog/reviews";
import {
  getCategoryCards,
  getProductBySlug,
  getProductsBySlugs,
} from "../../src/server/catalog/service";
import { resetTables, withTables } from "../helpers/tables";

let db: Db; // still used by submitReview (moves to the client in TF1-T08)
afterEach(resetTables);
beforeAll(() => {
  db = createDb(":memory:").db;
  runMigrations(db);
  seedCatalog(db);
});

describe("money and price labels", () => {
  it("formats compact and full amounts and rejects non-integer cents", () => {
    expect(formatMoney(9600)).toBe("$96");
    expect(formatMoney(9600, "full")).toBe("$96.00");
    expect(formatMoney(4850)).toBe("$48.50");
    expect(formatMoney(0)).toBe("$0");
    expect(() => formatMoney(10.5)).toThrow(/integer cents/);
  });

  it("labels price ranges like the Shop chips", () => {
    expect(priceRangeLabel(0, 5000)).toBe("Under $50");
    expect(priceRangeLabel(null, 5000)).toBe("Under $50");
    expect(priceRangeLabel(2000, 5000)).toBe("$20 - $50");
    expect(priceRangeLabel(10000, null)).toBe("$100+");
  });
});

describe("product content (PRD-005)", () => {
  it("parses the serum's structured content and tolerates bad data", () => {
    const content = getProductBySlug("the-renewal-serum")!.content!;
    expect(content.formula?.items).toHaveLength(4);
    expect(content.highlights?.items.map((i) => i.title)).toContain("5% Pure Niacinamide");
    expect(content.clinical?.stats[0]).toMatchObject({ value: "98%" });
    expect(getProductBySlug("facial-roller")!.content).toBeNull();
    expect(parseProductContent("not json")).toBeNull();
    expect(parseProductContent(JSON.stringify({ formula: { title: 1 } }))).toBeNull();
    expect(parseProductContent(null)).toBeNull();
  });
});

describe("home banners (ACN-001, HOM-006)", () => {
  it("returns seeded slots in display order", () => {
    expect(getBanners("home-hero")).toHaveLength(3); // the design shows slides 01/02/03
    expect(getBanners("home-trending")).toHaveLength(5);
    expect(getBanners("home-loved")).toHaveLength(4);
    expect(getBanners("home-fresh-items")).toHaveLength(3);
    expect(getBanners("home-marquee")).toHaveLength(4);
    expect(getBanners("home-categories").map((b) => b.title)).toEqual([
      "Skincare",
      "Eyes",
      "Lips",
      "Face",
    ]);
    expect(getBanners("home-features")).toHaveLength(4);
    expect(getBanners("home-testimonials")).toHaveLength(4);
    expect(getBanners("home-instagram")).toHaveLength(6);
    expect(getBanners("home-hero")[0]!.data).toMatchObject({ badge: { value: "20%" } });
    expect(getBanners("unknown-slot")).toEqual([]);
  });

  it("hides inactive banners and honours the start/end window", () => {
    const flash = getBanners("home-flash");
    expect(flash).toHaveLength(1);
    const end = flash[0]!.endsAt!.getTime();
    expect(end - Date.now()).toBeGreaterThan(2 * 86_400_000); // ~2d 8h 30m left at seed time

    const id = flash[0]!.id;
    // the bundled countdown is rolling (it always ends after "now"); a fixed end date does expire
    withTables((t) => {
      const b = t.banners.find((x) => x.id === id)!;
      b.endsInMs = null;
      b.endsAt = new Date(end).toISOString();
    });
    expect(getBanners("home-flash", new Date(end + 1000))).toEqual([]); // after the sale ends
    resetTables();
    const edit = (change: (b: Tables["banners"][number]) => void) =>
      withTables((t) => change(t.banners.find((b) => b.id === id)!));
    edit((b) => (b.startsAt = new Date(Date.now() + 3_600_000).toISOString()));
    expect(getBanners("home-flash")).toEqual([]); // not started yet
    edit((b) => (b.isActive = false));
    expect(getBanners("home-flash")).toEqual([]); // switched off
    resetTables();
    expect(getBanners("home-flash")).toHaveLength(1);
  });

  it("survives malformed extras", () => {
    const id = getBanners("home-hero")[0]!.id;
    withTables((t) => (t.banners.find((b) => b.id === id)!.data = "{broken"));
    expect(getBanners("home-hero")[0]!.data).toEqual({});
  });
});

describe("bundles (HOM-007)", () => {
  it("builds four tabs of three published products with a 20% discount", () => {
    const bundles = getBundles();
    expect(bundles.map((b) => b.label)).toEqual([
      "Barely there",
      "Fresh glow",
      "Soft glam",
      "Statement",
    ]);
    for (const b of bundles) {
      expect(b.products).toHaveLength(3);
      expect(b.discountPercent).toBe(20);
    }
  });

  it("drops a bundle when one of its products is unpublished", () => {
    withTables((t) => (t.products.find((p) => p.slug === "dew-drop-spray")!.status = "draft"));
    expect(getBundles().map((b) => b.label)).not.toContain("Barely there");
    resetTables();
    expect(getBundles()).toHaveLength(4);
  });
});

describe("getProductsBySlugs and category cards (CAT-008)", () => {
  it("keeps the requested order and skips unknown slugs", () => {
    const list = getProductsBySlugs(["flush-cream-blush", "nope", "the-renewal-serum"]);
    expect(list.map((p) => p.slug)).toEqual(["flush-cream-blush", "the-renewal-serum"]);
    expect(getProductsBySlugs([])).toEqual([]);
  });

  it("lists the 12 categories that have an image and products", () => {
    const cards = getCategoryCards();
    expect(cards).toHaveLength(12);
    expect(cards[0]).toMatchObject({ slug: "skincare", count: 16 });
    expect(cards.map((c) => c.slug)).not.toContain("nails"); // empty, no image
    expect(cards.map((c) => c.slug)).not.toContain("makeup"); // no image
    for (const c of cards) expect(c.image).toMatch(/^\/images\/categories\/.+\.jpg$/);
  });
});

describe("review submission (PRD-006, BR-11)", () => {
  const valid = {
    headline: "Worth every penny",
    rating: 5,
    comment: "Absorbs fast and leaves a soft finish all day.",
    recommend: true,
    name: "Test Shopper",
    email: "Shopper@Example.com",
  };

  it("validates every field", () => {
    expect(reviewInputSchema.safeParse(valid).success).toBe(true);
    const bad = reviewInputSchema.safeParse({
      ...valid,
      headline: "x",
      rating: 0,
      comment: "short",
      name: "a",
      email: "nope",
    });
    expect(bad.success).toBe(false);
    if (!bad.success)
      expect(bad.error.issues.map((i) => i.path[0])).toEqual([
        "headline",
        "rating",
        "comment",
        "name",
        "email",
      ]);
    expect(reviewInputSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ ...valid, rating: 4.5 }).success).toBe(false);
  });

  it("stores a pending, unverified review that is not shown publicly", () => {
    const input = reviewInputSchema.parse(valid);
    const result = submitReview(db, "the-renewal-serum", input);
    expect(result.ok).toBe(true);
    const row = db.select().from(reviews).where(eq(reviews.authorName, "Test Shopper")).get()!;
    expect(row).toMatchObject({
      status: "pending",
      isVerified: false,
      authorEmail: "shopper@example.com",
    });
    const detail = getProductBySlug("the-renewal-serum")!;
    expect(
      db.select().from(reviews).where(eq(reviews.productId, detail.id)).all().length,
    ).toBeGreaterThan(3);
  });

  it("rejects a second review from the same email on the same product, but not on another product", () => {
    const input = reviewInputSchema.parse(valid);
    expect(submitReview(db, "the-renewal-serum", input)).toEqual({ ok: false, code: "duplicate" });
    expect(
      submitReview(
        db,
        "the-renewal-serum",
        reviewInputSchema.parse({ ...valid, email: "SHOPPER@example.com" }),
      ),
    ).toEqual({
      ok: false,
      code: "duplicate",
    });
    expect(submitReview(db, "facial-roller", input).ok).toBe(true);
  });

  it("answers not_found for unknown or unpublished products", () => {
    const input = reviewInputSchema.parse({ ...valid, email: "other@example.com" });
    expect(submitReview(db, "nope", input)).toEqual({ ok: false, code: "not_found" });
    db.update(products).set({ status: "draft" }).where(eq(products.slug, "hydra-mist-toner")).run();
    expect(submitReview(db, "hydra-mist-toner", input)).toEqual({ ok: false, code: "not_found" });
  });
});
