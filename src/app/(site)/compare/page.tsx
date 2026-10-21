import { pageMeta } from "@/lib/seo";
import { ComparePage } from "@/components/lists/ComparePage";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "Compare",
  description: "Compare products side by side.",
  path: "/compare",
  noindex: true,
});

export default function CompareRoute() {
  return (
    <>
      <PageHero title="Compare" />
      <ComparePage />
      <BenefitStrip />
    </>
  );
}
