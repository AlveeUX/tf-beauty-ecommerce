import { pageMeta } from "@/lib/seo";
import { ContactPage } from "@/components/content/ContactPage";
import { PageHero } from "@/components/layout/PageHero";

export const metadata = pageMeta({
  title: "Contact us",
  description: "Questions about an order or a product? Write to us, call us or visit a store.",
  path: "/contact",
});

/** Figma 3:27227. This page has no benefit strip: the footer follows the questions. */
export default function ContactRoute() {
  return (
    <>
      <PageHero title="Contact us" />
      <ContactPage />
    </>
  );
}
