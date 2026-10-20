import { createJsonProvider } from "./json-provider";
import type { DataProvider } from "./provider";
import { tables } from "./tables";

export type { DataProvider } from "./provider";

/** Test hook: swap the provider (a fake in unit tests, or a real API adapter). */
let override: DataProvider | null = null;
let json: DataProvider | null = null;

export function setProvider(provider: DataProvider | null): void {
  override = provider;
}

/** The provider every storefront read goes through. Return your own here to connect a real backend. */
export function getProvider(): DataProvider {
  json ??= createJsonProvider(tables);
  return override ?? json;
}
