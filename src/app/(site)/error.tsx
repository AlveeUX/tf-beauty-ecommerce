"use client";

import { ErrorPanel } from "@/components/feedback/ErrorPanel";

/** Error boundary for every inner page: the header and footer stay, the page area shows the error screen. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel reset={reset} digest={error.digest} />;
}
