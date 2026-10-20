"use client";

import { useSyncExternalStore } from "react";

/**
 * Browser-side storage for the demo store (cart, orders, account). Everything lives under the
 * `cosmia.demo.` prefix in localStorage; nothing is sent anywhere. Replace the stores in this folder
 * with calls to your own backend when you connect one (see the documentation, "Connecting a backend").
 */
const PREFIX = "cosmia.demo.";
const EVENT = "cosmia:demo-store";

/** Parsed values by raw string, so repeated reads return the same object (required by useSyncExternalStore). */
const parsed = new Map<string, { raw: string | null; value: unknown }>();

function rawGet(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null; // private mode or storage blocked: behave as empty
  }
}

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = rawGet(key);
  if (raw === null) return fallback; // nothing stored: the caller's own fallback, never a cached one
  const hit = parsed.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: unknown = fallback;
  try {
    value = JSON.parse(raw);
  } catch {
    value = fallback;
  }
  parsed.set(key, { raw, value });
  return value as T;
}

export function writeStore<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(PREFIX + key, raw);
  } catch {
    // storage full or blocked: keep the value in memory so this tab can continue
    parsed.set(key, { raw, value });
  }
  window.dispatchEvent(new Event(EVENT));
}

export function removeStore(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
  parsed.delete(key);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(listener: () => void): () => void {
  window.addEventListener(EVENT, listener); // writes in this tab
  window.addEventListener("storage", listener); // writes in other tabs
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/** Live value of a stored key. Renders `fallback` on the server and during hydration. */
export function useStore<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => readStore(key, fallback),
    () => fallback,
  );
}

const noop = () => () => {};

/** False while rendering on the server and during hydration, true afterwards (stored values are then real). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
