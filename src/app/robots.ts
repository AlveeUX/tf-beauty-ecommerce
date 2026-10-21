import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/** Everything is public except the pages that only make sense for one visitor (cart, checkout, account). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/account", "/api/", "/reset-password"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
