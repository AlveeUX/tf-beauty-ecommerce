import { site } from "@/config/site";

export type SocialNetwork = keyof typeof site.socials;

export const SOCIAL_LABEL: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  linkedin: "LinkedIn",
};

/**
 * Where a "Share on ..." button goes. Instagram has no web share address, so it opens the shop's own
 * Instagram profile (`site.socials.instagram`). Without a page address (server render) the link goes to the
 * network's share endpoint; the page address is added as soon as the browser knows it.
 */
export function shareHref(network: SocialNetwork, pageUrl: string): string {
  const url = encodeURIComponent(pageUrl);
  switch (network) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php${pageUrl ? `?u=${url}` : ""}`;
    case "twitter":
      return `https://twitter.com/intent/tweet${pageUrl ? `?url=${url}` : ""}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/${pageUrl ? `?url=${url}` : ""}`;
    case "instagram":
      return site.socials.instagram;
  }
}
