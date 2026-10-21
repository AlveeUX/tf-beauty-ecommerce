import { pageMeta } from "@/lib/seo";
import { WishlistPage } from "@/components/lists/WishlistPage";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "Wishlist",
  description: "The products you saved for later.",
  path: "/wishlist",
  noindex: true,
});

export default function WishlistRoute() {
  return (
    <>
      <PageHero title="Wishlist" />
      <WishlistPage />
      <BenefitStrip />
    </>
  );
}
