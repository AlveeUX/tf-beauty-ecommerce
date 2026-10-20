import type { Metadata } from "next";
import { FlashSale } from "@/components/home/FlashSale";
import { HeroSlider } from "@/components/home/HeroSlider";
import {
  CategoryCards,
  EditorialBanner,
  FeatureStrip,
  FreshDrops,
  InstagramStrip,
  Journal,
  Marquee,
  MostLoved,
  PersonalBand,
  TrendingNow,
} from "@/components/home/HomeSections";
import {
  getCategoryTree,
  getCollectionProducts,
  getProductsBySlugs,
} from "@/server/catalog/service";
import type { ProductBadge } from "@/lib/catalog-types";
import { getBanners } from "@/server/content/banners";
import { getBundles } from "@/server/content/bundles";

export const metadata: Metadata = { title: { absolute: "Cosmia | Skincare & Cosmetics" } };
export const dynamic = "force-dynamic";

export default function Home() {
  // Product counts for the category cards (shown on hover).
  const counts: Record<string, number> = {};
  const walk = (nodes: ReturnType<typeof getCategoryTree>) =>
    nodes.forEach((n) => {
      counts[n.slug] = n.count;
      walk(n.children);
    });
  walk(getCategoryTree());

  // Designed cards first (banner data overrides price/rating/badge), then the live collection.
  const designed = getBanners("home-trending").flatMap((b) => {
    const base = getProductsBySlugs([String(b.data.productSlug)])[0];
    if (!base) return [];
    return [
      {
        ...base,
        priceCents: Number(b.data.priceCents),
        compareAtCents: Number(b.data.compareAtCents),
        rating: Number(b.data.rating),
        reviewCount: Number(b.data.reviewCount),
        badge: b.data.badge as ProductBadge,
        inStock: true,
      },
    ];
  });
  const taken = new Set(designed.map((p) => p.slug));
  const trending = [
    ...designed,
    ...getCollectionProducts("trending-now", 12).filter((p) => !taken.has(p.slug)),
  ].slice(0, 8);

  const loved = getBanners("home-loved").flatMap((b) => {
    const base = getProductsBySlugs([String(b.data.productSlug)])[0];
    if (!base) return [];
    return [
      {
        product: {
          ...base,
          priceCents: Number(b.data.priceCents),
          compareAtCents: null,
          inStock: true, // the design shows every card purchasable
          rating: Number(b.data.rating),
          reviewCount: Number(b.data.reviewCount),
        },
        badgeLabel: String(b.data.badgeLabel),
      },
    ];
  });

  return (
    <>
      <HeroSlider slides={getBanners("home-hero")} />
      <CategoryCards cards={getBanners("home-categories")} counts={counts} />
      <Marquee items={getBanners("home-marquee")} />
      <TrendingNow products={trending} />
      <FreshDrops
        banner={getBanners("home-fresh-drops")[0]}
        items={getBanners("home-fresh-items")}
      />
      <FeatureStrip items={getBanners("home-features")} />
      <EditorialBanner banner={getBanners("home-editorial")[0]} />
      <MostLoved items={loved} />
      <FlashSale banner={getBanners("home-flash")[0]} />
      <PersonalBand stories={getBanners("home-testimonials")} bundles={getBundles()} />
      <Journal posts={getBanners("home-journal")} />
      <InstagramStrip items={getBanners("home-instagram")} />
    </>
  );
}
