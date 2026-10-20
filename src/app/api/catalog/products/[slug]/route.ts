import { getApprovedReviews, getProductBySlug, getRelatedProducts } from "@/server/catalog/service";
import { jsonError } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return jsonError(404, "not_found", "Product not found.");
  return Response.json({
    product,
    reviews: getApprovedReviews(product.id),
    related: getRelatedProducts(product.id, 4),
  });
}
