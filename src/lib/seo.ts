import type { Metadata } from "next";
import { site } from "@/config/site";

/** The share picture drawn in code by `src/app/opengraph-image.tsx`; a page's own `openGraph` would otherwise drop it. */
const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name} | ${site.tagline}`,
};

type PageMetaInput = {
  /** Page name; the site name is added after it (`Shop | Brand`) unless `absoluteTitle` is set. */
  title: string;
  description: string;
  /** Site-relative address with its query, e.g. `/shop?category=serums`; becomes the canonical URL. */
  path: string;
  /** Personal or throw-away pages (cart, account, sign-in): kept out of search results. */
  noindex?: boolean;
  /** Use `title` as it is, without the site name (the Home page). */
  absoluteTitle?: boolean;
};

/**
 * Title, description, canonical address and share tags for one page, so every page names itself.
 * A page that sets `openGraph` replaces the layout's, so the share tags are repeated here.
 */
export function pageMeta({
  title,
  description,
  path,
  noindex = false,
  absoluteTitle = false,
}: PageMetaInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: fullTitle,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SHARE_IMAGE.url],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Cut text to a search-result snippet (about 160 characters) at a word boundary. */
export function snippet(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
