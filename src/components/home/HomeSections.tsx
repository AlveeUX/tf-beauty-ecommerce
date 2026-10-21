import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/catalog-types";
import { ProductCard } from "@/components/product/ProductCard";
import { AddButton } from "@/components/product/CardActions";
import { ProductTrack } from "@/components/product/ProductTrack";
import { BundleBuilder, type Bundle } from "./BundleBuilder";
import { Testimonials } from "./Testimonials";
import type { Banner } from "@/server/content/banners";
import styles from "./HomeSections.module.css";
import { site } from "@/config/site";

function SectionHeader({
  eyebrow,
  title,
  action,
  center,
  intro,
  titleShift,
}: {
  eyebrow?: string;
  title: string;
  action?: { label: string; href: string };
  center?: boolean;
  intro?: string;
  /** Figma sets this title 2px left of the column (Fresh drops, 3:2699). */
  titleShift?: boolean;
}) {
  return (
    <header className={`${styles.header} ${center ? styles.center : ""}`}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={`${styles.title} ${titleShift ? styles.titleShift : ""}`}>{title}</h2>
      {intro ? <p className={styles.intro}>{intro}</p> : null}
      {action ? (
        <Link href={action.href} className={`${styles.outlineButton} m-btn-2`}>
          <span>{action.label}</span>
          <Icon name="arrow-up-right" size={18} />
        </Link>
      ) : null}
    </header>
  );
}

/* ---------- Find favorites ---------- */
export function CategoryCards({
  cards,
  counts,
}: {
  cards: Banner[];
  counts: Record<string, number>;
}) {
  if (cards.length === 0) return null;
  return (
    <section className={styles.favorites} aria-labelledby="favorites-title">
      <div className="container">
        <SectionHeader
          eyebrow="Find your glow"
          title="Find favorites"
          action={{ label: "More categories", href: "/categories" }}
        />
        <ul className={styles.cards} id="favorites-title">
          {cards.map((card) => {
            const slug = String(card.data.categorySlug ?? "");
            const count = counts[slug];
            const crop = card.data.crop as
              { width: number; height: number; left: number; top: number } | undefined;
            return (
              <li key={card.id}>
                <Link href={card.ctaHref ?? "/shop"} className={styles.category}>
                  {card.image && crop ? (
                    // a fill crop taken from the design: the image is larger than the card
                    <Image
                      src={card.image}
                      alt=""
                      width={900}
                      height={1125}
                      sizes="340px"
                      style={{
                        position: "absolute",
                        maxWidth: "none",
                        width: `${crop.width}%`,
                        height: `${crop.height}%`,
                        left: `${crop.left}%`,
                        top: `${crop.top}%`,
                      }}
                    />
                  ) : card.image ? (
                    <Image src={card.image} alt="" fill sizes="308px" />
                  ) : null}
                  {count ? (
                    <span className={styles.count}>
                      <span>{String(count).padStart(2, "0")} products</span>
                    </span>
                  ) : null}
                  <span className={styles.go} aria-hidden="true">
                    <Icon name="arrow-up-right" size={18} />
                  </span>
                  <span className={styles.label}>
                    <strong>
                      {String(card.data.index ?? "")} • {card.title}
                    </strong>
                    <span>{card.subtitle}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Marquee ---------- */
/** Figma "check 4": a stamped seal with a tick (32px grid). */
function Seal() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M32 16L27.3135 20.6865V27.3135H20.6865L16 32L11.3135 27.3135H4.68647V20.6865L0 16L4.68647 11.3135V4.68647H11.3135L16 0L20.6865 4.68647H25.6551L22.9718 7.34847H19.5844L16.0013 3.76541L12.4183 7.34847H7.3498V12.4169L3.76674 16L7.3498 19.5831V24.6515H12.4183L16.0013 28.2346L19.5844 24.6515H24.6529V19.5831L28.2359 16L26.9182 14.6823L28.8069 12.8069L32 16ZM15.3997 18.6114L28.373 5.73796L30.2471 7.62798L17.1926 20.5813C16.7201 21.0565 16.0812 21.3227 15.401 21.324C14.7209 21.324 14.0834 21.0591 13.6015 20.576L8.41195 15.4649L10.278 13.5683L15.3997 18.6114ZM15.4756 18.686L15.4782 18.6886L15.4822 18.686H15.4756Z"
      />
    </svg>
  );
}

export function Marquee({ items }: { items: Banner[] }) {
  if (items.length === 0) return null;
  // The list is rendered twice so the CSS animation can loop seamlessly.
  const loop = [...items, ...items];
  return (
    <div className={styles.marquee} role="group" aria-label="Our promises">
      <ul>
        {loop.map((item, i) => (
          <li key={`${item.id}-${i}`} aria-hidden={i >= items.length || undefined}>
            <Seal />
            <span>{item.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Trending now ---------- */
export function TrendingNow({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;
  return (
    <section className={styles.trending} aria-labelledby="trending-title">
      <div className="container">
        <SectionHeader
          eyebrow="Explore products"
          title="Trending now"
          action={{ label: "More products", href: "/shop?badge=trending" }}
        />
      </div>
      <ProductTrack products={products} label="Trending now" tone="light" bleed />
    </section>
  );
}

/** "Brow Gel · 6ml" -> the unit stays lowercase like the design. */
function withUnit(text: string | null | undefined) {
  const m = /^(.*\d)([a-z]+)$/.exec(text ?? "");
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span className={styles.unit}>{m[2]}</span>
    </>
  );
}

/* ---------- Fresh drops ---------- */
type DropCrop = { height: number; top: number };

export function FreshDrops({ banner, items }: { banner: Banner | undefined; items: Banner[] }) {
  if (!banner) return null;
  const badge = banner.data.badge as { line1?: string; line2?: string; line3?: string } | undefined;
  const price = Number(banner.data.priceCents ?? 0);
  return (
    <section className={styles.drops} aria-labelledby="drops-title">
      <div className="container">
        <SectionHeader
          eyebrow="Collection 2026"
          title="Fresh drops"
          action={{ label: "More product", href: "/shop?badge=new" }}
          titleShift
        />
        <div className={styles.dropsGrid}>
          <article className={styles.feature}>
            {banner.image ? (
              <Image
                src={banner.image}
                alt=""
                width={1376}
                height={768}
                sizes="1021px"
                className={styles.featureImage}
              />
            ) : null}
            <div className={styles.featureShade} aria-hidden="true" />
            {badge ? (
              <div className={styles.freeBadge} aria-hidden="true">
                <Image
                  src="/images/home/fresh/badge-ring.svg"
                  alt=""
                  width={130}
                  height={130}
                  unoptimized
                />
                <Image
                  className={styles.freeFill}
                  src="/images/home/fresh/badge-fill.png"
                  alt=""
                  width={114}
                  height={114}
                  unoptimized
                />
                <Image
                  className={styles.freeTruck}
                  src="/images/home/fresh/truck.svg"
                  alt=""
                  width={25}
                  height={25}
                  unoptimized
                />
                <span className={styles.freeTitle}>
                  {badge.line1} {badge.line2}
                </span>
                <span className={styles.freeNote}>{badge.line3}</span>
              </div>
            ) : null}
            <div className={styles.featureText}>
              <p>{banner.eyebrow}</p>
              <h3>{banner.title}</h3>
              <AddButton
                slugs={[String(banner.data.productSlug ?? "")]}
                className={`${styles.featureCta} m-btn`}
              >
                <span>
                  {banner.ctaLabel}
                  {price ? ` — $${price / 100}` : ""}
                </span>
              </AddButton>
            </div>
            <span className={styles.dots} aria-hidden="true">
              <i data-on /> <i /> <i />
            </span>
          </article>

          <ul className={styles.dropList}>
            {items.slice(0, 3).map((d) => {
              const crop = d.data.crop as DropCrop | undefined;
              const compare = Number(d.data.compareAtCents ?? 0);
              return (
                <li key={d.id}>
                  <Link
                    href={d.ctaHref ?? "/shop"}
                    className={styles.dropImage}
                    aria-label={d.title}
                    tabIndex={-1}
                  >
                    {d.image ? (
                      crop ? (
                        <Image
                          src={d.image}
                          alt=""
                          width={520}
                          height={645}
                          sizes="130px"
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: `${crop.height}%`,
                            top: `${crop.top}%`,
                            maxWidth: "none",
                          }}
                        />
                      ) : (
                        <Image src={d.image} alt="" fill sizes="130px" />
                      )
                    ) : null}
                  </Link>
                  <p className={styles.dropEyebrow}>{d.eyebrow}</p>
                  <h3 className={styles.dropName}>
                    <Link href={d.ctaHref ?? "/shop"}>{d.title}</Link>
                  </h3>
                  <p className={styles.dropLabel}>{withUnit(d.subtitle)}</p>
                  <p className={styles.dropPrice}>
                    <span>{formatMoney(Number(d.data.priceCents ?? 0), "compact")}</span>
                    {compare > 0 ? (
                      <>
                        <span className="visually-hidden">Was</span>
                        <s>{formatMoney(compare, "compact")}</s>
                      </>
                    ) : null}
                  </p>
                  <AddButton
                    slugs={[String(d.data.productSlug ?? "")]}
                    className={styles.plus}
                    tone={String(d.data.tone ?? "light")}
                    ariaLabel={`Add ${d.title} to cart`}
                  >
                    <Icon name="plus" size={20} strokeWidth={2} />
                  </AddButton>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Feature strip ---------- */
export function FeatureStrip({ items }: { items: Banner[] }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.featureSection} aria-label={`Why ${site.name}`}>
      <div className="container">
        <ul className={styles.features}>
          {items.map((f) => {
            const inset = f.data.inset as [number, number, number, number] | undefined;
            return (
              <li key={f.id}>
                <span className={styles.featureIcon} aria-hidden="true">
                  {/* the design's own artwork, placed by its inset inside the 48px box */}
                  <span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={String(f.data.icon)}
                      alt=""
                      style={
                        inset
                          ? {
                              position: "absolute",
                              top: `${inset[0]}%`,
                              right: `${inset[1]}%`,
                              bottom: `${inset[2]}%`,
                              left: `${inset[3]}%`,
                              width: "auto",
                              height: "auto",
                            }
                          : undefined
                      }
                    />
                  </span>
                </span>
                <h3>{f.title}</h3>
                <p>{f.subtitle}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Editorial banner ---------- */
export function EditorialBanner({ banner }: { banner: Banner | undefined }) {
  if (!banner) return null;
  const secondary = banner.data.secondaryImage as string | undefined;
  const script = String(banner.data.script ?? "").split(" ");
  return (
    <section className={styles.editorial} aria-labelledby="editorial-title">
      <div className={styles.editorialInner}>
        {/* faint contour lines on the dark panel (Figma 3:2785, 20% opacity) */}
        <div className={styles.waves} aria-hidden="true">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home/editorial/waves.svg" alt="" />
          </div>
        </div>
        <div className={styles.editorialText}>
          <p className={styles.editorialEyebrow}>{banner.eyebrow}</p>
          <h2 id="editorial-title">{banner.title}</h2>
          <p className={styles.editorialCopy}>{banner.subtitle}</p>
          <Link
            href={banner.ctaHref ?? "/shop"}
            className={`${styles.editorialCta} m-btn`}
            data-magnetic
          >
            <span>{banner.ctaLabel}</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
          <p className={styles.film}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/home/editorial/play.svg" alt="" width={24} height={24} />
            <span>{String(banner.data.film ?? "")}</span>
          </p>
        </div>
        <div className={styles.editorialImage}>
          {banner.image ? <Image src={banner.image} alt="" fill sizes="838px" /> : null}
        </div>
        {secondary ? (
          <div className={styles.editorialThumb}>
            <Image src={secondary} alt="" fill sizes="200px" />
          </div>
        ) : null}
        <div className={styles.script} aria-hidden="true">
          <p>
            {script.map((word, i) => (
              <span key={i}>{word}</span>
            ))}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/home/editorial/script-line.svg" alt="" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Most loved ---------- */
export function MostLoved({ items }: { items: { product: ProductSummary; badgeLabel: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.loved} aria-labelledby="loved-title">
      <div className="container">
        <SectionHeader
          center
          eyebrow="Hall of frame"
          title="Most loved product"
          intro="Over 250,000 beauty bags packed globally. Select your shade in real-time checkout."
        />
        <ul className={styles.lovedGrid}>
          {items.slice(0, 4).map(({ product, badgeLabel }) => (
            <li key={product.slug}>
              <ProductCard product={product} layout="cta" badgeLabel={badgeLabel} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Journal ---------- */
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export function Journal({ posts }: { posts: Banner[] }) {
  if (posts.length === 0) return null;
  return (
    <section className={styles.journal} aria-labelledby="journal-title">
      <div className={`container ${styles.journalGrid}`}>
        <div className={styles.journalIntro}>
          <p className={styles.eyebrow}>Latest news</p>
          <h2 id="journal-title" className={styles.journalTitle}>
            The journal behind better skin
          </h2>
          <Link href="/blog" className={`${styles.blogButton} m-btn`}>
            <span>More blog</span>
            <Icon name="arrow-up-right" size={18} />
          </Link>
        </div>
        <ul className={styles.posts}>
          {posts.map((post, i) => (
            <li key={post.id}>
              <Link href={post.ctaHref ?? "/blog"} className={styles.post}>
                <span className={styles.postImage}>
                  {post.image ? <Image src={post.image} alt="" fill sizes="405px" /> : null}
                </span>
                <span className={styles.postMeta}>
                  <em data-accent={i === 1 || undefined}>
                    <span>{String(post.data.tag ?? "")}</span>
                  </em>
                  <span className={styles.postDate}>
                    {post.data.date ? formatDate(String(post.data.date)) : null}
                  </span>
                </span>
                <span className={styles.postTitle}>{post.title}</span>
                <span className={styles.postRead}>
                  {String(post.data.readMinutes ?? 5)} mins read
                </span>
                <span className={styles.postGo} aria-hidden="true">
                  <Icon name="arrow-up-right" size={20} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Instagram ---------- */
export function InstagramStrip({ items }: { items: Banner[] }) {
  if (items.length === 0) return null;
  return (
    <section className={styles.insta} aria-labelledby="insta-title">
      <span className={styles.instaIcon} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/home/icons/instagram-32.svg" alt="" width={32} height={32} />
      </span>
      <div className="container">
        <h2 id="insta-title" className={styles.instaTitle}>
          Moments made on Instagram
        </h2>
        <ul className={styles.instaGrid}>
          {items.slice(0, 6).map((item) => (
            <li key={item.id}>
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.title}
              >
                {item.image ? <Image src={item.image} alt={item.title} fill sizes="203px" /> : null}
                <span className={styles.instaHover} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Made personal + Explore bundle ---------- */
export function PersonalBand({ stories, bundles }: { stories: Banner[]; bundles: Bundle[] }) {
  if (stories.length === 0 && bundles.length === 0) return null;
  const side = "Real beauty editors and digital creatives showcasing backstage wearable pigments.";
  return (
    <section className={styles.personal} aria-label="Made personal and bundles">
      {stories.length > 0 ? (
        <>
          <div className="container">
            <div className={styles.personalHeader}>
              <div>
                <p className={styles.eyebrow}>In real life</p>
                <h2 className={styles.title}>Made personal</h2>
              </div>
              <p className={styles.side}>{side}</p>
            </div>
          </div>
          <div className={styles.personalCarousel}>
            <Testimonials items={stories} />
          </div>
        </>
      ) : null}

      {bundles.length > 0 ? (
        <div className="container">
          {stories.length > 0 ? <hr className={styles.rule} /> : null}
          <div className={styles.personalHeader} data-offset>
            <div>
              <p className={styles.eyebrow}>Bundle by categorie</p>
              <h2 className={styles.title}>Explore bundle</h2>
            </div>
            <p className={styles.side}>{side}</p>
          </div>
          <BundleBuilder bundles={bundles} />
        </div>
      ) : null}
    </section>
  );
}
