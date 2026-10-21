import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource/prata/latin-400.css";
import "@fontsource/allura/latin-400.css";
import { StoreProviders } from "@/components/cart/StoreProviders";
import { MotionInit } from "@/components/motion/MotionInit";
import "./globals.css";
import { motionDataAttributes } from "@/config/motion";
import { site } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

/**
 * Root layout: document shell only. The visible chrome (header/footer) lives in the route-group
 * layouts: (site) for standard pages and (home) for the Home variant.
 * <html> carries the motion settings as data-* attributes and gets `motion-ready` from the pre-paint script,
 * hence suppressHydrationWarning.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning {...motionDataAttributes()}>
      <head>
        <MotionInit />
      </head>
      <body id="top">
        <StoreProviders>{children}</StoreProviders>
      </body>
    </html>
  );
}
