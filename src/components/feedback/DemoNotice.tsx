"use client";

import { useHydrated, useStore, writeStore } from "@/lib/demo-store/storage";
import styles from "./DemoNotice.module.css";

const KEY = "notice-dismissed";

/**
 * A small dismissible note on the pages that would normally talk to a server (login, account, checkout):
 * in this template they work in the browser only. Fixed to the corner so it never moves the page layout.
 */
export function DemoNotice() {
  const hydrated = useHydrated();
  const dismissed = useStore<boolean>(KEY, false);
  if (!hydrated || dismissed) return null;
  return (
    <aside className={styles.notice} role="note" aria-label="Demo mode" data-testid="demo-notice">
      <p>
        <strong>Demo mode.</strong> Accounts, carts and orders are stored only in this browser. No
        email is sent and nothing is charged.
      </p>
      <button type="button" onClick={() => writeStore(KEY, true)}>
        Got it
      </button>
    </aside>
  );
}
