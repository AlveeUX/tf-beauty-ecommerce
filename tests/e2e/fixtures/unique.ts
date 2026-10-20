/** A unique, valid email address per test so tests never share an account or an order. */
export function uniqueEmail(label: string): string {
  return `${label}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@example.com`;
}
