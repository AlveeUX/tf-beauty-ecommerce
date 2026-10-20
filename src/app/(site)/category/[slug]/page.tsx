import { notFound, redirect } from "next/navigation";
import { getCategoryTree } from "@/server/catalog/service";

export const dynamic = "force-dynamic";

/** /category/[slug] is the shop filtered to one category (PRD 6.2); one listing implementation serves both. */
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const known = new Set<string>();
  const walk = (nodes: ReturnType<typeof getCategoryTree>) =>
    nodes.forEach((n) => {
      known.add(n.slug);
      walk(n.children);
    });
  walk(getCategoryTree());
  if (!known.has(slug)) notFound();
  redirect(`/shop?category=${encodeURIComponent(slug)}`);
}
