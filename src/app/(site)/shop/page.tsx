import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { CatalogView } from "@/components/shop/CatalogView";
import { parseCatalogQuery } from "@/server/catalog/query";
import { getCategoryTree, getFacets, listProducts } from "@/server/catalog/service";

export const dynamic = "force-dynamic"; // filtering and sorting come from the query string

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The shop, or one category of it (`?category=`, listed in the sitemap), is its own page; filters, sorting and layouts are views of it. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { query } = parseCatalogQuery(await searchParams);
  const slug = query.categories.length === 1 ? query.categories[0] : undefined;
  const find = (nodes: ReturnType<typeof getCategoryTree>): string | undefined => {
    for (const node of nodes) {
      if (node.slug === slug) return node.name;
      const inChild = find(node.children);
      if (inChild) return inChild;
    }
    return undefined;
  };
  const name = slug ? find(getCategoryTree()) : undefined;
  if (slug && name) {
    return pageMeta({
      title: name,
      description: `Shop ${name.toLowerCase()}: browse the range, filter by price and availability, and sort by what matters to you.`,
      path: `/shop?category=${encodeURIComponent(slug)}`,
    });
  }
  return pageMeta({
    title: "Shop",
    description:
      "Shop every product: filter by category, price and availability, and sort by what matters to you.",
    path: "/shop",
  });
}

export default async function ShopPage({ searchParams }: Props) {
  // Invalid parameters are dropped (not fatal) so a mistyped link still shows the shop.
  const { query } = parseCatalogQuery(await searchParams);
  return (
    <CatalogView
      title="Shop"
      basePath="/shop"
      query={query}
      result={listProducts(query)}
      facets={getFacets(query)}
    />
  );
}
