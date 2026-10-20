import { getProvider } from "@/data";
import { jsonError } from "@/server/http";

const MAX_REFS = 60;

/**
 * Catalog data for cart lines (read-only): `?variant=12&variant=13` and/or `?slug=the-renewal-serum`.
 * The cart itself lives in the browser; this is how it learns prices and stock.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const refs = [
    ...params.getAll("variant").map((v) => ({ variantId: Number(v) })),
    ...params.getAll("slug").map((slug) => ({ slug })),
  ];
  if (refs.length === 0 || refs.length > MAX_REFS)
    return jsonError(400, "bad_request", "Ask for 1 to 60 items.");
  if (refs.some((r) => "variantId" in r && !Number.isInteger(r.variantId))) {
    return jsonError(400, "bad_request", "Invalid variant id.");
  }
  return Response.json({ lines: getProvider().getVariantLines(refs) });
}
