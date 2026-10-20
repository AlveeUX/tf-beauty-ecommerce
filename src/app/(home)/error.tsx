"use client";

import { ErrorPanel } from "@/components/feedback/ErrorPanel";

/** Error boundary for the Home page: the header and footer stay, the page area shows the error screen. */
export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel reset={reset} digest={error.digest} />;
}
