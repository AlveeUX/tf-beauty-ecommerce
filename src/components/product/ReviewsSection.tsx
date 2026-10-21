import { Icon } from "@/components/ui/Icon";
import type { ProductDetail, ReviewView } from "@/server/catalog/service";
import { ReviewForm } from "./ReviewForm";
import styles from "./ReviewsSection.module.css";

type Props = {
  product: Pick<ProductDetail, "slug" | "name" | "ratingAvg" | "reviewCount" | "ratingBreakdown">;
  reviews: ReviewView[];
};

const STARS = [5, 4, 3, 2, 1] as const;

/** "[2 days ago]" style label used by the design. */
function relativeTime(date: Date, now = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return `[${formatter.format(Math.round(seconds / size), unit)}]`;
  }
  return "[just now]";
}

/** Trusted reviews: summary, distribution, review form and list. Figma 3:13447. */
export function ReviewsSection({ product, reviews }: Props) {
  const total = product.reviewCount;
  const max = Math.max(1, ...Object.values(product.ratingBreakdown));

  return (
    <section className={styles.section} aria-labelledby="reviews-title">
      <h2 id="reviews-title" className={styles.heading} data-reveal="fade-up">
        Trusted reviews
      </h2>

      <div className={styles.card} data-reveal="fade-up">
        <div className={styles.summary}>
          <div className={styles.score}>
            <p className={styles.average} data-testid="rating-average">
              {product.ratingAvg.toFixed(1)}
            </p>
            <div className={styles.stars} aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <Icon
                  key={n}
                  name="star"
                  size={14}
                  filled={n <= Math.round(product.ratingAvg)}
                  strokeWidth={1.2}
                />
              ))}
            </div>
            <p className={styles.based}>Based on {total} customers reviews.</p>
            <a href="#write-review" className={styles.write}>
              Write a review
            </a>
          </div>

          <ul className={styles.bars} aria-label="Rating distribution" data-reveal="fade">
            {STARS.map((star) => {
              const count = product.ratingBreakdown[String(star) as "5" | "4" | "3" | "2" | "1"];
              return (
                <li key={star}>
                  <span>
                    {star} {star === 1 ? "Star" : "Stars"}
                  </span>
                  <span className={styles.track}>
                    <span className={styles.fill} style={{ width: `${(count / max) * 100}%` }} />
                  </span>
                  <span className={styles.barCount}>{count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <ReviewForm slug={product.slug} />

        <ul className={styles.list} data-testid="review-list">
          {reviews.length === 0 ? (
            <li className={styles.none}>No reviews yet. Be the first to share your experience.</li>
          ) : null}
          {reviews.map((review) => (
            <li key={review.id} className={styles.review}>
              <div className={styles.reviewMain}>
                <div className={styles.reviewStars}>
                  <span aria-hidden="true" className={styles.starsRed}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Icon
                        key={n}
                        name="star"
                        size={13}
                        filled={n <= review.rating}
                        strokeWidth={1.2}
                      />
                    ))}
                  </span>
                  <span>{review.rating.toFixed(1)}</span>
                </div>
                <h3>{review.title}</h3>
                <p className={styles.body}>&ldquo;{review.body}&rdquo;</p>
                <p className={styles.bottomLine}>
                  Bottom Line{" "}
                  <em>
                    {review.recommend
                      ? "Yes, I recommend this product"
                      : "No, I would not recommend this product"}
                  </em>
                </p>
              </div>
              <div className={styles.author}>
                <p className={styles.when}>{relativeTime(review.createdAt)}</p>
                <span className={styles.avatar} aria-hidden="true">
                  {review.authorName.charAt(0)}
                </span>
                <p className={styles.name}>{review.authorName}</p>
                {review.isVerified ? (
                  <p className={styles.verified}>
                    <Icon name="check-circle" size={12} /> Verified
                  </p>
                ) : null}
              </div>

              {review.brandReply ? (
                <div className={styles.reply}>
                  <p className={styles.replyHead}>
                    <span className={styles.pill}>
                      <Icon name="user" size={14} /> Admin Reply
                    </span>
                    <span>{review.brandReplyAuthor}</span>
                  </p>
                  <blockquote>&ldquo;{review.brandReply}&rdquo;</blockquote>
                  <p className={styles.official}>
                    <Icon name="check-circle" size={12} /> Verified{" "}
                    <span>Official Store Response</span>
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
