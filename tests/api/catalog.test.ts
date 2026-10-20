import { describe, expect, it } from "vitest";

const products = await import("../../src/app/api/catalog/products/route");
const product = await import("../../src/app/api/catalog/products/[slug]/route");
const categories = await import("../../src/app/api/catalog/categories/route");
const search = await import("../../src/app/api/search/route");

const get = (path: string) => new Request(`http://localhost${path}`);

describe("GET /api/catalog/products", () => {
  it("lists products with pagination metadata", async () => {
    const res = await products.GET(get("/api/catalog/products?sort=price-asc&pageSize=5"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ total: 36, page: 1, pageSize: 5, pageCount: 8, from: 1, to: 5 });
    expect(body.items).toHaveLength(5);
    expect(body.items[0].priceCents).toBe(1000);
  });

  it("includes facets on request", async () => {
    const body = await (
      await products.GET(get("/api/catalog/products?category=skincare&facets=1"))
    ).json();
    expect(body.total).toBe(16);
    expect(body.facets.categories.map((c: { slug: string }) => c.slug)).toContain("makeup");
  });

  it("answers 400 with the standard error shape for invalid parameters", async () => {
    const res = await products.GET(get("/api/catalog/products?sort=bogus&page=0"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      code: "invalid_query",
      message: "One or more query parameters are invalid.",
      fields: ['sort: invalid value "bogus"', 'page: invalid value "0"'],
    });
  });
});

describe("GET /api/catalog/products/[slug]", () => {
  const call = (slug: string) =>
    product.GET(get(`/api/catalog/products/${slug}`), { params: Promise.resolve({ slug }) });

  it("returns the product, approved reviews and related products", async () => {
    const res = await call("the-renewal-serum");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.name).toBe("The renewal serum");
    expect(body.reviews).toHaveLength(3);
    expect(body.related).toHaveLength(4);
  });

  it("answers 404 for unknown slugs", async () => {
    const res = await call("nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: "not_found" });
  });
});

describe("GET /api/catalog/categories and /api/search", () => {
  it("returns the category tree", async () => {
    const body = await (await categories.GET()).json();
    expect(body.categories.map((c: { slug: string }) => c.slug)).toContain("skincare");
  });

  it("returns suggestions, and 400 for a missing or oversized term", async () => {
    const ok = await (await search.GET(get("/api/search?q=serum"))).json();
    expect(ok.products.map((p: { slug: string }) => p.slug)).toContain("the-renewal-serum");
    expect((await search.GET(get("/api/search"))).status).toBe(400);
    expect((await search.GET(get(`/api/search?q=${"a".repeat(81)}`))).status).toBe(400);
  });
});
