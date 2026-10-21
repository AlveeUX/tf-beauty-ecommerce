"use client";

import { useCallback, useSyncExternalStore } from "react";
import { COMPARE_LIMIT } from "@/config/store";

/**
 * Guest wishlist and compare list (WSH-003, CMP-001): product slugs in localStorage, shared between
 * tabs through the storage event.
 */
export type ListKey = "wishlist" | "compare";

const STORAGE_KEY: Record<ListKey, string> = {
  wishlist: "cosmia.wishlist.v1",
  compare: "cosmia.compare.v1",
};
const SLUG = /^[a-z0-9-]{1,120}$/;
const EMPTY: readonly string[] = Object.freeze([]);

const cache: Partial<Record<ListKey, readonly string[]>> = {};
const listeners = new Set<() => void>();

function read(key: ListKey): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY[key]) ?? "[]");
    if (!Array.isArray(parsed)) return EMPTY;
    return [...new Set(parsed.filter((s): s is string => typeof s === "string" && SLUG.test(s)))];
  } catch {
    return EMPTY; // storage blocked or corrupted: behave as an empty list
  }
}

function snapshot(key: ListKey): readonly string[] {
  return (cache[key] ??= read(key));
}

function write(key: ListKey, next: readonly string[]) {
  cache[key] = next;
  try {
    localStorage.setItem(STORAGE_KEY[key], JSON.stringify(next));
  } catch {
    // storage full or blocked: the list still works for this page view
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || Object.values(STORAGE_KEY).includes(event.key)) {
      delete cache.wishlist;
      delete cache.compare;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export type AddResult = "added" | "exists" | "limit";

export function useList(key: ListKey) {
  const slugs = useSyncExternalStore(
    subscribe,
    () => snapshot(key),
    () => EMPTY,
  );

  const add = useCallback(
    (slug: string): AddResult => {
      const list = snapshot(key);
      if (list.includes(slug)) return "exists";
      if (key === "compare" && list.length >= COMPARE_LIMIT) return "limit";
      write(key, [...list, slug]);
      return "added";
    },
    [key],
  );

  const remove = useCallback(
    (slug: string) =>
      write(
        key,
        snapshot(key).filter((s) => s !== slug),
      ),
    [key],
  );
  const clear = useCallback(() => write(key, EMPTY), [key]);

  return { slugs, has: (slug: string) => slugs.includes(slug), add, remove, clear };
}
