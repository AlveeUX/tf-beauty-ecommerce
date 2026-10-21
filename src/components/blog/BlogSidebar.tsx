import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { BlogLayout, BlogSidebarData } from "@/lib/blog";
import styles from "./BlogSidebar.module.css";

type Props = {
  data: BlogSidebarData;
  /** Keeps the chosen layout when a widget filters the list. */
  layout?: BlogLayout;
  activeCategory?: string;
  activeTag?: string;
  query?: string;
};

function listHref(
  layout: BlogLayout | undefined,
  params: { category?: string; tag?: string },
): string {
  const search = new URLSearchParams();
  if (layout && layout !== "grid") search.set("layout", layout);
  if (params.category) search.set("category", params.category);
  if (params.tag) search.set("tag", params.tag);
  const qs = search.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

function Heading({ children }: { children: string }) {
  return <h2 className={styles.heading}>{children}</h2>;
}

/** Sidebar of the blog frames: search, sale banner, categories, recent posts and tags (Figma 3:26713). */
export function BlogSidebar({ data, layout, activeCategory, activeTag, query }: Props) {
  const firstCategory = data.categories[0]?.name;
  const current = activeCategory ?? (activeTag || query ? undefined : firstCategory);
  return (
    <aside className={styles.side} aria-label="Blog sidebar" data-reveal="fade">
      <section className={`${styles.widget} ${styles.search}`}>
        <Heading>Search here</Heading>
        <form action="/blog" method="get" role="search" className={styles.box}>
          {layout && layout !== "grid" ? (
            <input type="hidden" name="layout" value={layout} />
          ) : null}
          <input
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search..."
            aria-label="Search the journal"
            data-testid="blog-search"
          />
          <button type="submit" aria-label="Search">
            <Icon name="search" size={24} />
          </button>
        </form>
      </section>

      <section className={styles.promo} aria-label="Mid year sale">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/blog/promo-mid-year-sale.jpg" alt="" className={styles.promoImage} />
        <div className={styles.shade} aria-hidden="true" />
        <p className={styles.midYear}>Mid Year</p>
        <p className={styles.sale}>SALE</p>
        <span className={`${styles.rule} ${styles.ruleLeft}`} aria-hidden="true" />
        <span className={styles.upTo}>UP to</span>
        <span className={`${styles.rule} ${styles.ruleRight}`} aria-hidden="true" />
        <span className={styles.thirty} role="img" aria-label="30 percent off">
          <span aria-hidden="true">30</span>
          <span aria-hidden="true" className={styles.percent}>
            %
          </span>
          <span aria-hidden="true" className={styles.off}>
            <span>OFF</span>
          </span>
        </span>
        <p className={styles.code}>Use code: GLOW30</p>
      </section>

      <section className={`${styles.widget} ${styles.categories}`}>
        <Heading>Categories</Heading>
        <ul className={styles.cats}>
          {data.categories.map((category) => (
            <li key={category.name}>
              <Link
                href={listHref(layout, { category: category.name })}
                aria-current={category.name === current ? "true" : undefined}
              >
                <span>{category.name}</span>
                <span className={styles.count}>{category.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.widget} ${styles.recent}`}>
        <Heading>Recent Blog</Heading>
        <ul className={styles.recentList}>
          {data.recent.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className={styles.thumb}
                aria-hidden="true"
                tabIndex={-1}
              >
                <Image src={post.coverImage} alt="" fill sizes="90px" />
              </Link>
              <div>
                <p className={styles.recentCat}>{post.category}</p>
                <Link href={`/blog/${post.slug}`} className={styles.recentTitle}>
                  {post.title}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.widget} ${styles.tags}`}>
        <Heading>Tags</Heading>
        <ul className={styles.chips}>
          {data.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={listHref(layout, { tag })}
                aria-current={tag === activeTag ? "true" : undefined}
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
