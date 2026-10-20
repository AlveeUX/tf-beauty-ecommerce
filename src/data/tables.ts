import { z } from "zod";
import banners from "./banners.json";
import blogComments from "./blog_comments.json";
import blogPosts from "./blog_posts.json";
import categories from "./categories.json";
import collectionProducts from "./collection_products.json";
import collections from "./collections.json";
import colors from "./colors.json";
import inventory from "./inventory.json";
import productCategories from "./product_categories.json";
import productColors from "./product_colors.json";
import productImages from "./product_images.json";
import productTags from "./product_tags.json";
import products from "./products.json";
import reviews from "./reviews.json";
import variants from "./variants.json";
import {
  bannerRow,
  blogCommentRow,
  blogPostRow,
  categoryRow,
  collectionProductRow,
  collectionRow,
  colorRow,
  inventoryRow,
  productCategoryRow,
  productColorRow,
  productImageRow,
  productRow,
  productTagRow,
  reviewRow,
  variantRow,
} from "./schema";

/** The JSON files, validated once when the module loads so a bad edit fails with a readable message. */
const load = <S extends z.ZodType>(schema: S, rows: unknown): z.infer<S>[] =>
  z.array(schema).parse(rows);

export const tables = {
  banners: load(bannerRow, banners),
  blogComments: load(blogCommentRow, blogComments),
  blogPosts: load(blogPostRow, blogPosts),
  categories: load(categoryRow, categories),
  collectionProducts: load(collectionProductRow, collectionProducts),
  collections: load(collectionRow, collections),
  colors: load(colorRow, colors),
  inventory: load(inventoryRow, inventory),
  productCategories: load(productCategoryRow, productCategories),
  productColors: load(productColorRow, productColors),
  productImages: load(productImageRow, productImages),
  productTags: load(productTagRow, productTags),
  products: load(productRow, products),
  reviews: load(reviewRow, reviews),
  variants: load(variantRow, variants),
};

export type Tables = typeof tables;
