import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { MAX_PAGE_SIZE } from "@/lib/catalog-types";
import { listPosts } from "@/server/blog/queries";
import { DEFAULT_QUERY } from "@/server/catalog/query";
import { getCategoryTree, listProducts } from "@/server/catalog/service";

// the catalogue changes with the data files, so the list is built per request like the pages themselves
export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  "/",
  "/shop",
  "/categories",
  "/blog",
  "/about",
  "/contact",
  "/faqs",
  "/store-locator",
  "/track-order",
  "/login",
  "/register",
  "/demos",
  "/policy/privacy",
  "/policy/shipping",
  "/policy/returns",
  "/policy/terms",
];

/** Pages, every product, every blog post and every shop category, as absolute addresses. */
export default function sitemap(): MetadataRoute.Sitemap {
  const urls = new Set<string>(STATIC_PAGES);

  for (let page = 1; ; page++) {
    const result = listProducts({ ...DEFAULT_QUERY, page, pageSize: MAX_PAGE_SIZE });
    result.items.forEach((product) => urls.add(`/product/${product.slug}`));
    if (page >= result.pageCount) break;
  }

  const posts = listPosts({}, 1, 1000).posts;
  posts.forEach((post) => urls.add(`/blog/${post.slug}`));

  const categories = (nodes: ReturnType<typeof getCategoryTree>) =>
    nodes.forEach((node) => {
      urls.add(`/shop?category=${node.slug}`);
      categories(node.children);
    });
  categories(getCategoryTree());

  return [...urls].map((path) => ({ url: `${site.url}${path}` }));
}
