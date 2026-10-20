import { getProvider } from "@/data";
import type { PdpLayout } from "@/lib/pdp-layouts";
import type { ProductBadge, ProductSummary, SizeBucket } from "@/lib/catalog-types";
import type { ProductContent } from "@/lib/product-content";
import type { CatalogQuery } from "./query";

/**
 * Catalog read model for the storefront (PRD CAT-*, PRD-*, SRC-*). The functions below keep their names and
 * types and delegate to the active `DataProvider` (`src/data`), the one place to plug in a real backend.
 * Rules the provider must honour: only published products are visible; the displayed price is the default
 * variant's price; money is integer cents.
 */

export type CatalogResult = {
  items: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  /** 1-based index range of the items on this page ("Showing 1-12 of 300"). */
  from: number;
  to: number;
};

export type CategoryNode = { slug: string; name: string; count: number; children: CategoryNode[] };
export type Facets = {
  categories: CategoryNode[];
  sizes: { bucket: SizeBucket; label: string; count: number }[];
  colors: { slug: string; name: string; hex: string; count: number }[];
  ratings: { min: number; count: number }[];
  availability: { inStock: number; onSale: number };
  price: { minCents: number; maxCents: number };
};

export type VariantDetail = {
  id: number;
  sku: string;
  sizeLabel: string;
  sizeMl: number | null;
  priceCents: number;
  compareAtCents: number | null;
  isDefault: boolean;
  available: number;
  inStock: boolean;
};

export type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  productType: string;
  shortDescription: string | null;
  description: string | null;
  ingredients: string | null;
  content: ProductContent | null;
  badge: ProductBadge | null;
  ratingAvg: number;
  reviewCount: number;
  ratingBreakdown: Record<"5" | "4" | "3" | "2" | "1", number>;
  images: { url: string; alt: string }[];
  variants: VariantDetail[];
  defaultVariant: VariantDetail;
  categories: { slug: string; name: string }[];
  tags: string[];
  colors: { slug: string; name: string; hex: string }[];
  inStock: boolean;
  /** Layout chosen for this product (validated), or null for the default. */
  pdpLayout: PdpLayout | null;
  saleEndsAt: Date | null;
};

export type ReviewView = {
  id: number;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  recommend: boolean;
  createdAt: Date;
  brandReply: string | null;
  brandReplyAuthor: string | null;
};

export type CategoryCard = {
  slug: string;
  name: string;
  description: string | null;
  image: string;
  count: number;
};

export type SearchSuggestions = {
  products: ProductSummary[];
  categories: { slug: string; name: string }[];
};

/** Filtered, sorted, paginated product list. An out-of-range page is clamped to the last page. */
export const listProducts = (q: CatalogQuery): CatalogResult => getProvider().listProducts(q);

/**
 * Counts for the filter sidebar. Each group is counted with every *other* filter applied
 * but not its own, so choosing "Skincare" does not zero out the other categories.
 */
export const getFacets = (q: CatalogQuery): Facets => getProvider().getFacets(q);

/** Published product by slug, or null (drafts and archived products are not publicly reachable). */
export const getProductBySlug = (slug: string): ProductDetail | null =>
  getProvider().getProductBySlug(slug);

/** Approved reviews only. */
export const getApprovedReviews = (productId: number, limit?: number): ReviewView[] =>
  getProvider().getApprovedReviews(productId, limit);

/** Same-category products first (best sellers first), topped up from the rest of the catalog. */
export const getRelatedProducts = (productId: number, limit?: number): ProductSummary[] =>
  getProvider().getRelatedProducts(productId, limit);

/** Published products for the given slugs, in the order requested (unknown/unpublished slugs are skipped). */
export const getProductsBySlugs = (slugs: string[]): ProductSummary[] =>
  getProvider().getProductsBySlugs(slugs);

/** Active categories with published-product counts; empty categories are hidden by default. */
export const getCategoryTree = (opts?: { includeEmpty?: boolean }): CategoryNode[] =>
  getProvider().getCategoryTree(opts);

/** Categories that have both an image and published products, in tree order (parent, then children). */
export const getCategoryCards = (): CategoryCard[] => getProvider().getCategoryCards();

export const getCollectionProducts = (collectionSlug: string, limit?: number): ProductSummary[] =>
  getProvider().getCollectionProducts(collectionSlug, limit);

/** Typeahead for the search overlay (SRC-001): a few products and matching categories. */
export const searchSuggestions = (term: string, limit?: number): SearchSuggestions =>
  getProvider().searchSuggestions(term, limit);
