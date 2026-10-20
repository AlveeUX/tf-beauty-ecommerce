import { getProvider } from "@/data";
import type { ProductBadge } from "@/lib/catalog-types";

/** What the quick-view popup (Figma 3:1366) shows about a product and its default variant. */
export type QuickViewData = {
  slug: string;
  name: string;
  badge: ProductBadge | null;
  shortDescription: string | null;
  rating: number;
  reviewCount: number;
  images: { url: string; alt: string }[];
  variantId: number;
  sizeLabel: string;
  priceCents: number;
  compareAtCents: number | null;
  inStock: boolean;
  available: number;
};

//** A published product's default variant for the popup, or null for an unknown or unpublished slug. */
export const getQuickView = (slug: string): QuickViewData | null => getProvider().getQuickView(slug);
