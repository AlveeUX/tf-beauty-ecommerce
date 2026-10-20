import styles from "./LoadingPanel.module.css";

/** Shown while a page is being prepared. Proposed design: a few calm placeholder bars, no spinner. */
export function LoadingPanel() {
  return (
    <div
      className={`container ${styles.page}`}
      role="status"
      aria-live="polite"
      data-testid="loading-panel"
    >
      <span className="visually-hidden">Loading…</span>
      <span className={styles.bar} style={{ width: "32%" }} aria-hidden="true" />
      <span className={styles.bar} style={{ width: "100%" }} aria-hidden="true" />
      <span className={styles.bar} style={{ width: "86%" }} aria-hidden="true" />
      <span className={styles.bar} style={{ width: "64%" }} aria-hidden="true" />
    </div>
  );
}
