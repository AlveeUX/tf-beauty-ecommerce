import { lookupProducts } from "@/server/catalog/lookup";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9-]{1,120}$/;

/** Wishlist and compare pages: ?slugs=a,b,c (at most 24, malformed slugs are ignored). */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("slugs") ?? "";
  const slugs = [...new Set(raw.split(",").filter((s) => SLUG.test(s)))].slice(0, 24);
  return Response.json({ items: lookupProducts(slugs) });
}
