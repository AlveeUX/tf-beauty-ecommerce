import { getProvider } from "@/data";
import type { BlogCard, BlogComment, BlogPostDetail, BlogSidebarData } from "@/lib/blog";

export type BlogFilter = { category?: string; tag?: string; q?: string };

export const listPosts = (
  filter: BlogFilter,
  page: number,
  pageSize: number,
): { posts: BlogCard[]; total: number; pages: number; page: number } =>
  getProvider().listPosts(filter, page, pageSize);

/** Sidebar widgets: categories with counts, the newest posts (not the open one) and the tag cloud. */
export const sidebarData = (excludeSlug?: string): BlogSidebarData =>
  getProvider().sidebarData(excludeSlug);

export const getPost = (slug: string): BlogPostDetail | null => getProvider().getPost(slug);

/** Neighbours in list order; the ends wrap around so both links always exist (Assumption, D-041). */
export const neighbours = (slug: string): { previous: BlogCard | null; next: BlogCard | null } =>
  getProvider().neighbours(slug);

export const postIdFor = (slug: string): number | null => getProvider().postIdFor(slug);

export const approvedComments = (postId: number): BlogComment[] =>
  getProvider().approvedComments(postId);
