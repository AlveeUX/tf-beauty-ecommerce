"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { DemoNotice } from "@/components/feedback/DemoNotice";
import { useCurrentUser, wasSignedOutOnPurpose } from "@/lib/demo-store/account";
import { AccountNav } from "./AccountNav";
import styles from "./Account.module.css";

/**
 * Every /account page needs a signed-in customer (USR-004). Demo mode: the session is in this browser, so
 * the check runs here after the page loads; a signed-out visitor is sent to the login page.
 */
export function AccountShell({ children }: { children: ReactNode }) {
  const { user, hydrated } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !user && !wasSignedOutOnPurpose()) router.replace(`/login?next=${pathname}`);
  }, [hydrated, user, router, pathname]);

  return (
    <div className={`container ${styles.page}`}>
      {user ? (
        <div className={styles.layout}>
          <AccountNav />
          <div className={styles.content}>{children}</div>
        </div>
      ) : (
        <div aria-busy="true" />
      )}
      <DemoNotice />
    </div>
  );
}
