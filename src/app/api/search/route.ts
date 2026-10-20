import { searchSuggestions } from "@/server/catalog/service";
import { jsonError } from "@/server/http";

export const dynamic = "force-dynamic";

/** GET /api/search?q=serum  -> { products, categories } for the search overlay (SRC-001). */
export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q");
  if (q === null) return jsonError(400, "invalid_query", "Missing search term.", ["q"]);
  if (q.length > 80) return jsonError(400, "invalid_query", "Search term is too long.", ["q"]);
  return Response.json(searchSuggestions(q));
}
