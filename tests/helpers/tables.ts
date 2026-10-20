import { setProvider } from "../../src/data";
import { createJsonProvider } from "../../src/data/json-provider";
import { tables, type Tables } from "../../src/data/tables";

/** Installs a provider over a modified copy of the JSON tables (the bundled files are never touched). */
export function withTables(mutate: (copy: Tables) => void): void {
  const copy = structuredClone(tables);
  mutate(copy);
  setProvider(createJsonProvider(copy));
}

/** Back to the bundled JSON provider. */
export function resetTables(): void {
  setProvider(null);
}
