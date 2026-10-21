import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  blogDate,
  type BlogBlock,
  type BlogCard,
  type BlogComment,
  type BlogPostDetail,
} from "@/lib/blog";
import { BlogComments } from "./BlogComments";
import styles from "./BlogDetail.module.css";
import { SocialsStrip } from "@/components/ui/SocialsStrip";

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "p":
      return <p className={styles.p}>{block.text}</p>;
    case "checklist":
      return (
        <ul className={styles.checks}>
          {block.items.map((item) => (
            <li key={item}>
              <Icon name="check-circle" size={18} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <figure className={styles.quote}>
          <blockquote>{block.text}</blockquote>
          <figcaption>{block.by}</figcaption>
        </figure>
      );
    case "images":
      return (
        <div className={styles.pair}>
          {block.srcs.map((src, i) => (
            <div key={src} className={styles.pairImage}>
              <Image src={src} alt={block.alts[i] ?? ""} fill sizes="420px" />
            </div>
          ))}
        </div>
      );
    case "note":
      return (
        <div role="note" className={styles.note}>
          <span className={styles.noteIcon} aria-hidden="true">
            <Icon name="info" size={16} />
          </span>
          <p>
            <strong>{block.lead}</strong>
            {block.text}
          </p>
        </div>
      );
  }
}

function Neighbour({ post, side }: { post: BlogCard; side: "previous" | "next" }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`${styles.neighbour} ${side === "next" ? styles.next : ""}`}
      data-testid={`blog-${side}`}
    >
      <span className={styles.neighbourLabel}>
        {side === "previous" ? <Icon name="arrow-left" size={18} /> : null}
        <span>{side === "previous" ? "Previous Post" : "Next Post"}</span>
        {side === "next" ? <Icon name="arrow-right" size={18} /> : null}
      </span>
      <span className={styles.neighbourTitle}>{post.title.replace(/\.$/, "")}</span>
    </Link>
  );
}

type Props = {
  post: BlogPostDetail;
  comments: BlogComment[];
  neighbours: { previous: BlogCard | null; next: BlogCard | null };
};

/** Blog details, main column (Figma 3:26846): hero, meta, body blocks, tags and share, neighbours, comments. */
export function BlogDetail({ post, comments, neighbours }: Props) {
  const threads = comments.filter((c) => c.parentId === null).length;
  return (
    <article className={styles.article} data-testid="blog-post">
      <div className={`${styles.hero} m-fade-soft`}>
        <Image src={post.coverImage} alt={post.title} fill priority sizes="870px" />
      </div>
      <p className={styles.meta} data-reveal="fade-up">
        <span className={styles.author}>
          <Image
            src={post.authorImage ?? "/images/blog/author-selena.jpg"}
            alt=""
            width={24}
            height={24}
          />
          <span>
            <span className={styles.by}>By</span> {post.author}
          </span>
        </span>
        <span aria-hidden="true" className={styles.dot}>
          ·
        </span>
        <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className={styles.cat}>
          {post.category}
        </Link>
        <span aria-hidden="true" className={styles.dot}>
          ·
        </span>
        <time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time>
        <span aria-hidden="true" className={styles.dot}>
          ·
        </span>
        <span>{post.readMinutes} mins read</span>
      </p>
      <h1 className={styles.title} data-reveal="fade-up">
        {post.title}
      </h1>

      <div className={styles.body} data-reveal="fade-up">
        {post.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      <div className={styles.foot} data-reveal="fade-up">
        <div className={styles.tags}>
          <span>Tags:</span>
          <ul>
            {post.tags.map((tag, i) => (
              <li key={tag}>
                <Link
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  data-first={i === 0 || undefined}
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.share}>
          <span>Share:</span>
          <SocialsStrip mode="share" />
        </div>
      </div>

      {neighbours.previous && neighbours.next ? (
        <nav className={styles.neighbours} aria-label="More posts" data-reveal="fade-up">
          <Neighbour post={neighbours.previous} side="previous" />
          <Link href="/blog" className={styles.all} aria-label="All posts">
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
              <rect x="0" y="0" width="14.1" height="14.1" />
              <rect x="0" y="17.9" width="14.1" height="14.1" />
              <rect x="17.9" y="0" width="14.1" height="14.1" />
              <rect x="17.9" y="17.9" width="14.1" height="14.1" />
            </svg>
          </Link>
          <Neighbour post={neighbours.next} side="next" />
        </nav>
      ) : null}

      <h2 className={styles.heading}>
        {String(threads).padStart(2, "0")} {threads === 1 ? "Comment" : "Comments"}
      </h2>
      <BlogComments slug={post.slug} comments={comments} />
    </article>
  );
}
