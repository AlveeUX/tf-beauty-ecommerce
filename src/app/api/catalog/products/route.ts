import { parseCatalogQuery } from "@/server/catalog/query";
import { getFacets, listProducts } from "@/server/catalog/service";
import { jsonError } from "@/server/http";

export const dynamic = "force-dynamic";

/** GET /api/catalog/products?category=&price=20-50&sort=&page=...  (add facets=1 for filter counts) */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const { query, issues } = parseCatalogQuery(params);
  if (issues.length > 0) {
    return jsonError(400, "invalid_query", "One or more query parameters are invalid.", issues);
  }
  const result = listProducts(query);
  return Response.json({
    ...result,
    ...(params.get("facets") === "1" ? { facets: getFacets(query) } : {}),
  });
}
