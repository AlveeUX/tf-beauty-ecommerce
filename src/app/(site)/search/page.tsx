import { pageMeta } from "@/lib/seo";
import { CatalogView } from "@/components/shop/CatalogView";
import { parseCatalogQuery } from "@/server/catalog/query";
import { getFacets, listProducts } from "@/server/catalog/service";

export const metadata = pageMeta({
  title: "Search",
  description: "Search the shop by product name, ingredient or category.",
  path: "/search",
  noindex: true,
});
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Full search results (SRC-002): the shop listing with a text query, so every filter and sort still applies. */
export default async function SearchPage({ searchParams }: Props) {
  const { query } = parseCatalogQuery(await searchParams);
  return (
    <CatalogView
      title={query.q ? `Search: ${query.q}` : "Search"}
      crumbs={[{ label: "Search" }]}
      basePath="/search"
      query={query}
      result={listProducts(query)}
      facets={getFacets(query)}
    />
  );
}
