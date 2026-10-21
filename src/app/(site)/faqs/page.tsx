import { pageMeta } from "@/lib/seo";
import { FaqPage } from "@/components/content/FaqPage";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "FAQs",
  description: "Answers about orders, shipping, returns and how to use our products.",
  path: "/faqs",
});

/** Figma 3:27601. No benefit strip on this page: the footer follows the questions. */
export default function FaqsRoute() {
  return (
    <>
      <PageHero title="FAQs" />
      <FaqPage />
    </>
  );
}
