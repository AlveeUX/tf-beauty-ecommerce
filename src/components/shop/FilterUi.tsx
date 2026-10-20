"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./FilterUi.module.css";

type FilterUi = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  /** The sheet that replaces the sidebar, panel and dropdown bar up to 1100 px. */
  sheetOpen: boolean;
  toggleSheet: () => void;
  closeSheet: () => void;
};
const Context = createContext<FilterUi | null>(null);

/**
 * Open/closed state shared by the toolbar's FILTER button and the filters it reveals: the panel of
 * "Shop top filter" (open at first, as in the frame) or the drawer of "Filter drawer" (closed).
 */
export function FilterUiProvider({
  defaultOpen = false,
  children,
}: {
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toggleSheet = useCallback(() => setSheetOpen((v) => !v), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const value = useMemo(
    () => ({ open, toggle, close, sheetOpen, toggleSheet, closeSheet }),
    [open, toggle, close, sheetOpen, toggleSheet, closeSheet],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useFilterUi(): FilterUi {
  const value = useContext(Context);
  if (!value) throw new Error("useFilterUi needs a FilterUiProvider");
  return value;
}

/** The dark "FILTER" button at the right of the toolbar (Figma 3:7268, 139 x 44; 113 wide in the drawer layout). */
export function FilterButton({ controls, drawer }: { controls: string; drawer?: boolean }) {
  const { open, toggle } = useFilterUi();
  return (
    <button
      type="button"
      className={`${styles.button} ${drawer ? styles.compact : ""}`}
      aria-expanded={open}
      aria-controls={controls}
      aria-haspopup={drawer ? "dialog" : undefined}
      onClick={toggle}
      data-testid="filter-button"
    >
      <Icon name="sliders" size={16} />
      <span>Filter</span>
    </button>
  );
}

/** Filter button of the layouts that show their filters inline above 1100 px; below that it opens the sheet. */
export function SheetFilterButton() {
  const { sheetOpen, toggleSheet } = useFilterUi();
  return (
    <button
      type="button"
      className={`${styles.button} ${styles.sheetButton}`}
      aria-expanded={sheetOpen}
      aria-controls="shop-filters-sheet"
      aria-haspopup="dialog"
      onClick={toggleSheet}
      data-testid="filter-sheet-button"
    >
      <Icon name="sliders" size={16} />
      <span>Filter</span>
    </button>
  );
}
