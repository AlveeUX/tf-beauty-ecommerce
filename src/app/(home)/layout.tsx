import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NewsletterPopup } from "@/components/layout/NewsletterPopup";
import { trendingProducts } from "@/components/layout/SiteChrome";
import { getCategoryTree } from "@/server/catalog/service";
import { getBanners } from "@/server/content/banners";

// Home content is read per request so admin changes show immediately (decision-log D-009).
export const dynamic = "force-dynamic";

/** Home chrome: dark header laid over the hero, dark footer with newsletter card. */
export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let categories: { label: string; href: string }[] = [];
  let portrait: string | null = null;
  try {
    categories = getCategoryTree().map((c) => ({
      label: c.name,
      href: `/shop?category=${c.slug}`,
    }));
    portrait = getBanners("home-newsletter")[0]?.image ?? null;
  } catch (error) {
    console.error("Home chrome content unavailable:", error);
  }
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
