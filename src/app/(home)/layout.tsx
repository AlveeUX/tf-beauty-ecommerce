import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NewsletterPopup } from "@/components/layout/NewsletterPopup";
import { trendingProducts } from "@/components/layout/SiteChrome";
import { getCategoryTree } from "@/server/catalog/service";
import { getBanners } from "@/server/content/banners";

// Read per request: the sale countdowns are computed from the current time (src/data/json-provider.ts).
export const dynamic = "force-dynamic";

/** Home chrome: dark header laid over the hero, dark footer with newsletter card. */
export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = getCategoryTree().map((c) => ({
    label: c.name,
    href: `/shop?category=${c.slug}`,
  }));
  const portrait = getBanners("home-newsletter")[0]?.image ?? null;
  return (
    <>
      <div style={{ position: "relative" }}>
        <HomeHeader categories={categories} trending={trendingProducts()} />
        <main>{children}</main>
      </div>
      <HomeFooter portrait={portrait} />
      <NewsletterPopup />
    </>
  );
}
