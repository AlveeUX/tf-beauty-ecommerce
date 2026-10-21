import { pageMeta } from "@/lib/seo";
import { CartPage } from "@/components/cart/CartPage";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "Cart",
  description: "The products in your cart and the total of your order.",
  path: "/cart",
  noindex: true,
});

export default function CartRoute() {
  return (
    <>
      <PageHero title="Cart" />
      <CartPage />
      <BenefitStrip />
    </>
  );
}
