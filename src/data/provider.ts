import type { ProductSummary } from "@/lib/catalog-types";
import type { VariantLine } from "@/lib/cart";
import type { BlogCard, BlogComment, BlogPostDetail, BlogSidebarData } from "@/lib/blog";
import type { Banner } from "@/server/content/banners";
import type { BlogFilter } from "@/server/blog/queries";
import type { CatalogQuery } from "@/server/catalog/query";
import type { ListProduct } from "@/server/catalog/lookup";
import type { QuickViewData } from "@/server/catalog/quick-view";
import type {
  CatalogResult,
  CategoryCard,
  CategoryNode,
  Facets,
  ProductDetail,
  ReviewView,
  SearchSuggestions,
} from "@/server/catalog/service";

/**
 * Everything the storefront reads. The bundled `JsonProvider` serves the files in `src/data`;
 * to use a real backend, implement this interface (REST, GraphQL, Shopify, Medusa ...) and
 * return it from `getProvider()` in `src/data/index.ts`. Pages and components do not change.
 */
export interface DataProvider {
  listProducts(q: CatalogQuery): CatalogResult;
  getFacets(q: CatalogQuery): Facets;
  getProductBySlug(slug: string): ProductDetail | null;
  getApprovedReviews(productId: number, limit?: number): ReviewView[];
  getRelatedProducts(productId: number, limit?: number): ProductSummary[];
  getProductsBySlugs(slugs: string[]): ProductSummary[];
  getCategoryTree(opts?: { includeEmpty?: boolean }): CategoryNode[];
  getCategoryCards(): CategoryCard[];
  getCollectionProducts(collectionSlug: string, limit?: number): ProductSummary[];
  searchSuggestions(term: string, limit?: number): SearchSuggestions;
  lookupProducts(slugs: string[]): ListProduct[];
  /**
   * Cart data for variants, by id or by product slug (its default variant). Unknown or unpublished
   * products are left out. Prices are integer cents; `available` is the units that can still be bought.
   */
  getVariantLines(refs: { variantId?: number; slug?: string }[]): VariantLine[];
  getQuickView(slug: string): QuickViewData | null;
  getBanners(slot: string, now?: Date): Banner[];
  listPosts(
    filter: BlogFilter,
    page: number,
    pageSize: number,
  ): { posts: BlogCard[]; total: number; pages: number; page: number };
  sidebarData(excludeSlug?: string): BlogSidebarData;
  getPost(slug: string): BlogPostDetail | null;
  neighbours(slug: string): { previous: BlogCard | null; next: BlogCard | null };
  postIdFor(slug: string): number | null;
  approvedComments(postId: number): BlogComment[];
}
