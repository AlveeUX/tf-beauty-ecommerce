import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { blogDate, type BlogCard as Card } from "@/lib/blog";
import styles from "./BlogCard.module.css";

export type CardVariant = "grid" | "row" | "large";

function Meta({ post, withAuthor }: { post: Card; withAuthor?: boolean }) {
  return (
    <p className={styles.meta}>
      {withAuthor ? (
        <span className={styles.by}>
          <Image
            src="/images/blog/author-selena.jpg"
            alt=""
            width={24}
            height={24}
            className={styles.byImage}
          />
          <span>By {post.author}</span>
          <span aria-hidden="true" className={styles.dot}>
            ·
          </span>
        </span>
      ) : null}
      <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className={styles.cat}>
        {post.category}
      </Link>
      <span aria-hidden="true" className={styles.dot}>
        ·
      </span>
      <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time>
    </p>
  );
}

function More({ post, boxed }: { post: Card; boxed?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={boxed ? styles.moreBox : styles.more}
      aria-label={`Read more: ${post.title}`}
    >
      <span>Read more</span>
      <Icon name="arrow-up-right" size={18} />
    </Link>
  );
}

/** Post card in three shapes: grid card (3:25805), list row (3:25320) and large standard post (3:26239). */
export function BlogCard({
  post,
  variant,
  priority,
}: {
  post: Card;
  variant: CardVariant;
  priority?: boolean;
}) {
  const href = `/blog/${post.slug}`;
  const sizes = variant === "grid" ? "390px" : variant === "row" ? "405px" : "870px";
  return (
    <article
      className={`${styles.card} ${styles[variant]}`}
      data-testid="blog-card"
      data-reveal="fade-up"
    >
      <Link href={href} className={styles.image} tabIndex={-1} aria-hidden="true">
        <Image
          src={post.coverImage}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className={styles.cover}
        />
      </Link>
      <div className={styles.body}>
        <Meta post={post} withAuthor={variant === "large"} />
        <h2 className={styles.title}>
          <Link href={href}>{post.title}</Link>
        </h2>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <More post={post} boxed={variant === "large"} />
      </div>
    </article>
  );
}
