import { getProvider } from "@/data";

/** What the wishlist and compare pages need about a product (default variant). */
export type ListProduct = {
  slug: string;
  name: string;
  label: string;
  image: string | null;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sku: string;
  sizeLabel: string;
};

/** Published products by slug, in the order asked; unknown or unpublished slugs are skipped. */
export const lookupProducts = (slugs: string[]): ListProduct[] => getProvider().lookupProducts(slugs);
