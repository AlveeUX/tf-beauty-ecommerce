"use client";

import "./globals.css";
import { ErrorPanel } from "@/components/feedback/ErrorPanel";

/** Last resort: the root layout itself failed, so this page brings its own <html> and <body>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorPanel reset={reset} digest={error.digest} />
      </body>
    </html>
  );
}
