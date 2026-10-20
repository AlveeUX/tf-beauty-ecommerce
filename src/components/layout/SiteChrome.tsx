import type { ProductSummary } from "@/lib/catalog-types";
import { getCategoryTree, getCollectionProducts } from "@/server/catalog/service";
import { Footer } from "./Footer";
import { Header, type NavLink } from "./Header";
import { NewsletterPopup } from "./NewsletterPopup";

function headerCategories(): NavLink[] {
  try {
    return getCategoryTree().map((c) => ({
      label: c.name,
      href: `/shop?category=${c.slug}`,
    }));
  } catch (error) {
    // Database not migrated yet: render without the dropdown rather than failing every page.
    console.error("Header categories unavailable:", error);
    return [];
  }
}

export function trendingProducts(): ProductSummary[] {
  try {
    return getCollectionProducts("trending-now", 4);
  } catch {
    return [];
  }
}

/** Standard storefront frame: announcement bar + header above, footer below. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header categories={headerCategories()} trending={trendingProducts()} />
      <main>{children}</main>
      <Footer />
      <NewsletterPopup />
    </>
  );
}
