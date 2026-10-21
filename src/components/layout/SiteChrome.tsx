import type { ProductSummary } from "@/lib/catalog-types";
import { getCategoryTree, getCollectionProducts } from "@/server/catalog/service";
import { Footer } from "./Footer";
import { Header, type NavLink } from "./Header";
import { NewsletterPopup } from "./NewsletterPopup";

function headerCategories(): NavLink[] {
  return getCategoryTree().map((c) => ({
    label: c.name,
    href: `/shop?category=${c.slug}`,
  }));
}

export function trendingProducts(): ProductSummary[] {
  return getCollectionProducts("trending-now", 4);
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
