import { SiteChrome } from "@/components/layout/SiteChrome";

// Pages render per request: they read the query string, and the sale countdowns use the current time.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteChrome>{children}</SiteChrome>;
}
