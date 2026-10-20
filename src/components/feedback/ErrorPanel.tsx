"use client";

import { Button } from "@/components/ui/Button";
import styles from "./ErrorPanel.module.css";

/**
 * What a visitor sees when a page fails to render. Proposed design (not a Figma frame): the 404 page's
 * type and spacing, two buttons. `reset` re-renders the page; the reference helps with support requests.
 */
export function ErrorPanel({ reset, digest }: { reset: () => void; digest?: string }) {
  return (
    <section className={styles.page} role="alert" data-testid="error-panel">
      <h1>Something went wrong</h1>
      <p>
        This page could not be shown. Try again, or go back to the home page. If it keeps happening,
        tell us what you were doing.
      </p>
      <div className={styles.actions}>
        <Button type="button" variant="dark" icon="arrow-up-right" onClick={reset}>
          Try again
        </Button>
        <Button href="/" variant="outline">
          Go home
        </Button>
      </div>
      {digest ? <small>Reference: {digest}</small> : null}
    </section>
  );
}
