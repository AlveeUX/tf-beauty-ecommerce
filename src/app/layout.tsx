import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource/prata/latin-400.css";
import "@fontsource/allura/latin-400.css";
import { StoreProviders } from "@/components/cart/StoreProviders";
import "./globals.css";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
};

/**
 * Root layout: document shell only. The visible chrome (header/footer) lives in the route-group
 * layouts: (site) for standard pages and (home) for the Home variant.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body id="top">
        <StoreProviders>{children}</StoreProviders>
      </body>
    </html>
  );
}
