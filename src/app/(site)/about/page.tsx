import { pageMeta } from "@/lib/seo";
import { AboutPage } from "@/components/content/AboutPage";
import { site } from "@/config/site";

export const metadata = pageMeta({
  title: "About us",
  description: `${site.name} started in a small studio in ${site.foundedYear} with one rule: if we wouldn't put it on our own faces every day, we don't sell it.`,
  path: "/about",
});

/** Figma 3:28603. This page has no banner of its own: the dark hero starts right under the header. */
export default function AboutRoute() {
  return <AboutPage />;
}
