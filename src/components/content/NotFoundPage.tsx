import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <section className={styles.page} data-testid="not-found">
      <div className={styles.digits} aria-hidden="true">
        <span className={styles.shadow}>404</span>
        <span className={styles.front}>404</span>
      </div>
      <h1 className="m-enter m-i1">Oooop! Page not found</h1>
      <p className="m-enter m-i2">
        You are here because you entered the address of a page that no longer exists or has been
        moved to a different address
      </p>
      <Link href="/" className={`${styles.home} m-enter m-i3`}>
        <span>Go back to home</span>
        <Icon name="arrow-up-right" size={18} />
      </Link>
    </section>
  );
}
