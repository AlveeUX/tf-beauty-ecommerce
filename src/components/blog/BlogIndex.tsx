import Link from "next/link";
import { Pagination } from "@/components/shop/Pagination";
import type { BlogCard as Card, BlogLayout, BlogSidebarData } from "@/lib/blog";
import { BlogCard, type CardVariant } from "./BlogCard";
import { BlogSidebar } from "./BlogSidebar";
import styles from "./BlogIndex.module.css";

type Props = {
  layout: BlogLayout;
  posts: Card[];
  page: number;
  pages: number;
  total: number;
  sidebar: BlogSidebarData;
  filter: { category?: string; tag?: string; q?: string };
};

const VARIANT: Record<BlogLayout, CardVariant> = {
  grid: "grid",
  "sidebar-left": "grid",
  "sidebar-right": "grid",
  list: "row",
  standard: "large",
};

function href(layout: BlogLayout, filter: Props["filter"], page: number): string {
  const search = new URLSearchParams();
  if (layout !== "grid") search.set("layout", layout);
  if (filter.category) search.set("category", filter.category);
  if (filter.tag) search.set("tag", filter.tag);
  if (filter.q) search.set("q", filter.q);
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

/** Blog list in the five frames of the design: grid, sidebar left/right, list and standard. */
export function BlogIndex({ layout, posts, page, pages, total, sidebar, filter }: Props) {
  const hasSidebar = layout !== "grid";
  const filtered = Boolean(filter.category || filter.tag || filter.q);
  const label = filter.category ?? filter.tag ?? filter.q;
  const sidebarRight = layout === "sidebar-right" || layout === "standard";

  const list = (
    <div className={styles.main}>
      {filtered ? (
        <p className={styles.filter} role="status" data-testid="blog-filter">
          {total} {total === 1 ? "post" : "posts"} for “{label}”.{" "}
          <Link href={href(layout, {}, 1)}>Show all</Link>
        </p>
      ) : null}
      {posts.length === 0 ? (
        <p className={styles.none} data-testid="blog-none">
          No posts match your search. Try another word, or <Link href="/blog">show every post</Link>
          .
        </p>
      ) : (
        <div
          className={`${styles.posts} ${styles[layout.replace("-", "_")]}`}
          data-layout={layout}
          data-reveal-stagger
        >
          {posts.map((post, i) => (
            <BlogCard key={post.slug} post={post} variant={VARIANT[layout]} priority={i < 2} />
          ))}
        </div>
      )}
      {pages > 1 ? (
        <div className={styles.pager}>
          <Pagination page={page} pageCount={pages} hrefFor={(p) => href(layout, filter, p)} />
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={`container ${styles.wrap} ${hasSidebar ? styles.withSidebar : ""} ${
        sidebarRight ? styles.sideRight : ""
      }`}
      data-testid="blog-index"
    >
      {hasSidebar && !sidebarRight ? (
        <BlogSidebar
          data={sidebar}
          layout={layout}
          activeCategory={filter.category}
          activeTag={filter.tag}
          query={filter.q}
        />
      ) : null}
      {list}
      {hasSidebar && sidebarRight ? (
        <BlogSidebar
          data={sidebar}
          layout={layout}
          activeCategory={filter.category}
          activeTag={filter.tag}
          query={filter.q}
        />
      ) : null}
    </div>
  );
}
