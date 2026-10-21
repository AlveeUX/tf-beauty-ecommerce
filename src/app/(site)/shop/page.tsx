import type { Metadata } from "next";
import { CatalogView } from "@/components/shop/CatalogView";
import { parseCatalogQuery } from "@/server/catalog/query";
import { getFacets, listProducts } from "@/server/catalog/service";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic"; // filtering and sorting come from the query string

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

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
