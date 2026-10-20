import { afterEach, describe, expect, it } from "vitest";
import { getProvider, setProvider, type DataProvider } from "../../src/data";
import { getPost } from "../../src/server/blog/queries";
import { DEFAULT_QUERY } from "../../src/server/catalog/query";
import { getProductBySlug, listProducts } from "../../src/server/catalog/service";

afterEach(() => setProvider(null));

describe("DataProvider seam", () => {
  it("serves the bundled JSON by default", () => {
    expect(listProducts(DEFAULT_QUERY).total).toBe(36);
    expect(getProvider()).toBe(getProvider());
  });

  it("routes every service call to a replacement provider without touching callers", () => {
    const fake = {
      listProducts: () => ({
        items: [],
        total: 7,
        page: 1,
        pageSize: 12,
        pageCount: 1,
        from: 1,
        to: 7,
      }),
      getProductBySlug: () => null,
      getPost: () => null,
    } as unknown as DataProvider;
    setProvider(fake);
    expect(listProducts(DEFAULT_QUERY).total).toBe(7);
    expect(getProductBySlug("the-renewal-serum")).toBeNull();
    expect(getPost("anything")).toBeNull();
    setProvider(null);
    expect(getProductBySlug("the-renewal-serum")).not.toBeNull();
  });
});
