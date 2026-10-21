/** Journal (blog) types and helpers shared by the server queries, the pages and the seed. */

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "checklist"; items: string[] }
  | { type: "quote"; text: string; by: string }
  | { type: "images"; srcs: [string, string]; alts: [string, string] }
  | { type: "note"; lead: string; text: string };

export const BLOG_LAYOUTS = ["grid", "list", "standard", "sidebar-left", "sidebar-right"] as const;
export type BlogLayout = (typeof BLOG_LAYOUTS)[number];
const DEFAULT_BLOG_LAYOUT: BlogLayout = "grid";

export function parseBlogLayout(value: string | undefined): BlogLayout {
  return (BLOG_LAYOUTS as readonly string[]).includes(value ?? "")
    ? (value as BlogLayout)
    : DEFAULT_BLOG_LAYOUT;
}

/** Posts per page, as each frame shows them: grid 3 x 4, sidebar grids 2 x 4, list 6 rows, standard 3. */
export const BLOG_PAGE_SIZE: Record<BlogLayout, number> = {
  grid: 12,
  "sidebar-left": 8,
  "sidebar-right": 8,
  list: 6,
  standard: 3,
};

export type BlogCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readMinutes: number;
  coverImage: string;
  publishedAt: string;
};

export type BlogComment = {
  id: number;
  parentId: number | null;
  name: string;
  avatar: string | null;
  body: string;
  createdAt: string;
};

export type BlogPostDetail = BlogCard & {
  authorImage: string | null;
  tags: string[];
  blocks: BlogBlock[];
};

export type BlogSidebarData = {
  categories: { name: string; count: number }[];
  recent: BlogCard[];
  tags: string[];
};

/** "08 OCT 2026" (upper-case via CSS), in UTC so the server and the browser agree. */
export function blogDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** "June 18, 2024 at 06:00 pm" as the comments show it. */
export function commentDate(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
    .format(d)
    .toLowerCase();
  return `${date} at ${time}`;
}

export function safeJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
