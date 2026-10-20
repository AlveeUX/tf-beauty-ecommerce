import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { IngredientHighlights } from "@/components/product/IngredientHighlights";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { ProductContentSections } from "@/components/product/ProductContentSections";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { Icon } from "@/components/ui/Icon";
import {
  getApprovedReviews,
  getCollectionProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/server/catalog/service";
import { currentTimeMs } from "@/lib/time";
import { GALLERY_FOR, parsePdpLayout } from "@/lib/pdp-layouts";
import styles from "./page.module.css";

export const dynamic = "force-dynamic"; // price, stock and publication changes show immediately (D-009)

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ layout?: string; sticky?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.shortDescription ?? undefined };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { layout: requested, sticky } = await searchParams;
  const product = getProductBySlug(slug); // drafts/archived products are not public (BR-10)
  if (!product) notFound();

  // ?layout= previews any of the Figma layouts; otherwise the layout chosen for this product (PRD-012)
  const layout = parsePdpLayout(requested) ?? product.pdpLayout ?? "details-default";
  const gallery = GALLERY_FOR[layout];

  const reviews = getApprovedReviews(product.id);
  const moreFromCollection = getRelatedProducts(product.id, 8);
  const trending = getCollectionProducts("trending-now", 9).filter(
    (p) => p.slug !== product.slug,
  );

  return (
    <>
      <div className={`container ${styles.crumbs}`}>
        <nav aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">
                <Icon name="home" size={14} />
                Home
              </Link>
            </li>
            <li>
              <Icon name="chevron-right" size={12} />
              <Link href="/shop">Shop</Link>
            </li>
            <li>
              <Icon name="chevron-right" size={12} />
              <span aria-current="page">{product.name}</span>
            </li>
          </ol>
        </nav>
      </div>

      <section className={`container ${styles.top}`} data-layout={layout}>
        <ProductGallery
          images={product.images}
          name={product.name}
          mode={gallery.mode}
          zoom={gallery.zoom}
        />
        <div className={gallery.mode === "grid-1" ? styles.sticky : undefined}>
          <ProductInfo
            slug={product.slug}
            name={product.name}
            badge={product.badge}
            shortDescription={product.shortDescription}
            rating={product.ratingAvg}
            reviewCount={product.reviewCount}
            variants={product.variants}
            defaultVariantId={product.defaultVariant.id}
            categories={product.categories}
            tags={product.tags}
            layout={layout}
            colors={product.colors}
            saleEndsAt={product.saleEndsAt ? product.saleEndsAt.getTime() : null}
            serverNow={currentTimeMs()}
            sticky={sticky === "1"}
            image={product.images[0]?.url}
          />
        </div>
      </section>

      <div className={styles.band}>
        <div className="container">
          <ProductContentSections content={product.content} ingredients={product.ingredients} />
        </div>

        {product.content?.highlights ? (
          <IngredientHighlights highlights={product.content.highlights} />
        ) : null}

        <div className={`container ${styles.carousel}`}>
          <ProductCarousel title="More from collection" products={moreFromCollection} />
        </div>

        <div className="container">
          <ReviewsSection product={product} reviews={reviews} />
        </div>
      </div>

      <div className={`container ${styles.related}`}>
        <ProductCarousel title="Related products" products={trending} />
      </div>

      <BenefitStrip />
    </>
  );
}
