"use client";

import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import styles from "./SizeGuideModal.module.css";
import { site } from "@/config/site";

/** Rows of the size guide table (Figma 3:14326). The figures are the design's own. */
const ROWS = [
  ["Travel", "15–30 ml", "Trial & travel"],
  ["Mini", "5–8 ml / g", "Quick touch-ups"],
  ["Standard", "30–100 ml / 8–10 g", "Everyday use"],
  ["Large", "50 ml / 15 g", "Frequent use"],
  ["Jumbo", "150–200 ml", "Long-term value"],
] as const;

/** "<brand> size guide" popup (Figma 3:14326, 744 x 445). Opened from the product page's "Size guide" link. */
export function SizeGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal titleId="size-guide-title" width={744} onClose={onClose} testId="size-guide">
      <div className={styles.box}>
        <header className={styles.head}>
          <h2 id="size-guide-title">{site.name} size guide</h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={onClose}
            data-autofocus
          >
            <Icon name="x" size={18} />
          </button>
        </header>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">Volume / Weight</th>
              <th scope="col">Best For</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([size, volume, use]) => (
              <tr key={size}>
                <th scope="row">{size}</th>
                <td>{volume}</td>
                <td>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>
          All measurements in ml / g. See each product page for fl oz &amp; oz.
        </p>
      </div>
    </Modal>
  );
}
