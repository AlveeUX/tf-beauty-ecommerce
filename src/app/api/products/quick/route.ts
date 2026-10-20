import { jsonError } from "@/server/http";
import { getQuickView } from "@/server/catalog/quick-view";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{1,120}$/;

/** Quick-view popup: ?slug=the-renewal-serum. Unknown or malformed slugs answer 404. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const item = SLUG.test(slug) ? getQuickView(slug) : null;
  if (!item) return jsonError(404, "not_found", "This product does not exist.");
  return Response.json({ item });
}
