"use client";

import { useSyncExternalStore } from "react";
import styles from "./UiKit.module.css";

const subscribe = () => () => {};

/** One colour token: a swatch, its CSS variable and the value it currently has. */
export function TokenSwatch({ token, role }: { token: string; role: string }) {
  const value = useSyncExternalStore(
    subscribe,
    () => getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    () => "",
  );
  return (
    <li className={styles.swatch} data-testid="ui-kit-swatch">
      <span className={styles.chip} style={{ background: `var(${token})` }} aria-hidden="true" />
      <code>{token}</code>
      <span className={styles.value}>{value || " "}</span>
      <span className={styles.role}>{role}</span>
    </li>
  );
}
