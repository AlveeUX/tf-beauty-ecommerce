import type { Cents } from "./money";

/** Types shared by the catalog service (server) and storefront components. */
export const PRODUCT_BADGES = ["best-seller", "new", "trending", "hot"] as const;
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

/** What a product card needs. */
export type ProductSummary = {
  slug: string;
  name: string;
  /** e.g. "Serum · 30ml" */
  label: string;
  priceCents: Cents;
  compareAtCents?: Cents | null;
  rating: number;
  reviewCount: number;
  badge?: ProductBadge | null;
  image: string;
  /** Shown instead of `image` while the pointer is over the card (a mouse only). */
  hoverImage?: string | null;
  inStock?: boolean;
  /** Short description, shown in the list layouts. */
  description?: string | null;
};

export const SORT_OPTIONS = ["best-seller", "newest", "price-asc", "price-desc", "rating"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  "best-seller": "Best Seller",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top Rated",
};

export const SIZE_BUCKETS = ["mini", "standard", "large", "jumbo"] as const;
export type SizeBucket = (typeof SIZE_BUCKETS)[number];

/** Millilitre ranges (inclusive) behind the Shop "Size" filter: Mini 15ml, Standard 30ml, Large 50ml, Jumbo 50ml+. */
export const SIZE_BUCKET_RANGES: Record<
  SizeBucket,
  { label: string; min: number; max: number | null }
> = {
  mini: { label: "Mini", min: 0, max: 20 },
  standard: { label: "Standard", min: 21, max: 40 },
  large: { label: "Large", min: 41, max: 50 },
  jumbo: { label: "Jumbo", min: 51, max: null },
};

export const AVAILABILITY_OPTIONS = ["in-stock", "on-sale"] as const;
export type Availability = (typeof AVAILABILITY_OPTIONS)[number];

export const RATING_THRESHOLDS = [4.5, 4, 3.5, 3] as const;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;
