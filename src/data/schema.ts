import { z } from "zod";

/** Zod schemas for the JSON files in this folder. Shapes mirror the former database rows; timestamps are ISO strings. */

const iso = z.string();
const nullableStr = z.string().nullable();
const status = <T extends [string, ...string[]]>(...values: T) => z.enum(values);

export const categoryRow = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: nullableStr,
  image: nullableStr,
  parentId: z.number().int().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: iso,
  updatedAt: iso,
});

export const productRow = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  name: z.string().min(1),
  productType: z.string(),
  shortDescription: z.string(),
  description: nullableStr,
  ingredients: z.string(),
  content: nullableStr,
  status: status("draft", "published", "archived"),
  badge: status("best-seller", "new", "trending", "hot").nullable(),
  ratingAvg: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  ratingBreakdown: z.string(),
  soldCount: z.number().int().min(0),
  pdpLayout: nullableStr,
  saleEndsAt: nullableStr,
  publishedAt: iso,
  createdAt: iso,
  updatedAt: iso,
});

export const productImageRow = z.object({
  id: z.number().int(),
  productId: z.number().int(),
  url: z.string().min(1),
  alt: z.string(),
  sortOrder: z.number().int(),
});

export const variantRow = z.object({
  id: z.number().int(),
  productId: z.number().int(),
  sku: z.string().min(1),
  sizeLabel: z.string(),
  sizeMl: z.number().int().nullable(),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).nullable(),
  isDefault: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: iso,
  updatedAt: iso,
});

export const inventoryRow = z.object({
  variantId: z.number().int(),
  onHand: z.number().int().min(0),
  reserved: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  updatedAt: iso,
});

export const productCategoryRow = z.object({ productId: z.number().int(), categoryId: z.number().int() });

export const colorRow = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-f]{6}$/i),
  sortOrder: z.number().int(),
});

export const productColorRow = z.object({ productId: z.number().int(), colorId: z.number().int() });

export const productTagRow = z.object({ productId: z.number().int(), tag: z.string().min(1) });

export const collectionRow = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  name: z.string().min(1),
  createdAt: iso,
  updatedAt: iso,
});

export const collectionProductRow = z.object({
  collectionId: z.number().int(),
  productId: z.number().int(),
  sortOrder: z.number().int(),
});

export const reviewRow = z.object({
  id: z.number().int(),
  productId: z.number().int(),
  authorName: z.string().min(1),
  authorEmail: nullableStr,
  rating: z.number().int().min(1).max(5),
  title: z.string(),
  body: z.string(),
  recommend: z.boolean(),
  isVerified: z.boolean(),
  status: status("pending", "approved", "rejected"),
  brandReply: nullableStr,
  brandReplyAuthor: nullableStr,
  createdAt: iso,
  updatedAt: iso,
});

export const bannerRow = z.object({
  id: z.number().int(),
  slot: z.string().min(1),
  eyebrow: nullableStr,
  title: z.string(),
  subtitle: nullableStr,
  ctaLabel: nullableStr,
  ctaHref: nullableStr,
  image: nullableStr,
  data: nullableStr,
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  startsAt: nullableStr,
  endsAt: nullableStr,
  createdAt: iso,
  updatedAt: iso,
});

export const blogPostRow = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string(),
  category: z.string(),
  author: z.string(),
  authorImage: z.string(),
  readMinutes: z.number().int().min(1),
  coverImage: z.string(),
  content: z.string(),
  tags: z.string(),
  status: status("draft", "published", "archived"),
  publishedAt: iso,
  createdAt: iso,
});

export const blogCommentRow = z.object({
  id: z.number().int(),
  postId: z.number().int(),
  parentId: z.number().int().nullable(),
  name: z.string().min(1),
  email: z.string(),
  website: nullableStr,
  avatar: z.string(),
  body: z.string(),
  status: status("pending", "approved", "rejected"),
  createdAt: iso,
});

/** File name (without `.json`) -> row schema. The data test validates every file against this map. */
export const DATA_FILES = {
  categories: categoryRow,
  products: productRow,
  product_images: productImageRow,
  variants: variantRow,
  inventory: inventoryRow,
  product_categories: productCategoryRow,
  colors: colorRow,
  product_colors: productColorRow,
  product_tags: productTagRow,
  collections: collectionRow,
  collection_products: collectionProductRow,
  reviews: reviewRow,
  banners: bannerRow,
  blog_posts: blogPostRow,
  blog_comments: blogCommentRow,
} as const;

export type DataFileName = keyof typeof DATA_FILES;
