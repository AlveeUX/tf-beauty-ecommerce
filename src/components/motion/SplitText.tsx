import { Fragment, type CSSProperties } from "react";

/**
 * Mask text reveal (M2, docs/animation-plan.md 2.5): each word is wrapped so it can slide up from behind its
 * own line (`.m-word` in src/styles/motion.css). Wrap it in a span with role="img" and the full text as its aria-label
 * (an aria-label on the heading itself fails HTML validation): the words are aria-hidden, so a screen reader reads
 * the heading once. The spaces stay plain text, so line breaks are unchanged.
 */
export function SplitText({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      {i > 0 ? " " : null}
      <span className="m-word" aria-hidden="true">
        <span style={{ "--w": i } as CSSProperties}>{word}</span>
      </span>
    </Fragment>
  ));
}
