"use client";

import { site } from "@/config/site";
import { SOCIAL_LABEL, shareHref, type SocialNetwork } from "@/lib/share";
import { usePageUrl } from "@/lib/use-page-url";
import styles from "./SocialsStrip.module.css";

const NETWORKS: SocialNetwork[] = ["facebook", "instagram", "twitter", "linkedin"];

/**
 * The four round social icons drawn in the design (130 x 28), made clickable. `profile` opens the shop's
 * own profiles (`site.socials`), `share` shares the current page.
 */
export function SocialsStrip({
  mode,
  className,
}: {
  mode: "profile" | "share";
  className?: string;
}) {
  const pageUrl = usePageUrl();
  return (
    <span
      className={`${styles.strip} ${className ?? ""}`}
      role="group"
      aria-label={mode === "share" ? "Share this page" : "Social media"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/ui/socials.svg" alt="" width={130} height={28} />
      {NETWORKS.map((network) => (
        <a
          key={network}
          href={mode === "share" ? shareHref(network, pageUrl) : site.socials[network]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={
            mode === "share" ? `Share on ${SOCIAL_LABEL[network]}` : SOCIAL_LABEL[network]
          }
        />
      ))}
    </span>
  );
}
