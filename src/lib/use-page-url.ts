"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** The address of the current page without query or hash ("" while rendering on the server). */
export function usePageUrl(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin + window.location.pathname,
    () => "",
  );
}
