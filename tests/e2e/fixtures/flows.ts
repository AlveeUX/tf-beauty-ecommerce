import { expect, type Page } from "@playwright/test";

/** Key prefix of the browser-side demo store (src/lib/demo-store/storage.ts). */
export const STORE = "cosmia.demo.";

/** Make sure the page is on the app's origin so localStorage is reachable (a bare context starts on about:blank). */
async function onOrigin(page: Page) {
  if (page.url() === "about:blank") await page.goto("/api/health");
}

/** Put products in the cart of this browser context by writing the same localStorage the buttons write. */
export async function addToCart(page: Page, slug: string, quantity = 1) {
  const response = await page.request.get(`/api/variants?slug=${encodeURIComponent(slug)}`);
  const line = ((await response.json()) as { lines: { variantId: number }[] }).lines[0];
  expect(line, `catalog has ${slug}`).toBeTruthy();
  await onOrigin(page);
  await page.evaluate(
    ([key, variantId, qty]) => {
      const items: { variantId: number; quantity: number }[] = JSON.parse(
        localStorage.getItem(key as string) ?? "[]",
      );
      const found = items.find((i) => i.variantId === variantId);
      if (found) found.quantity += qty as number;
      else items.push({ variantId: variantId as number, quantity: qty as number });
      localStorage.setItem(key as string, JSON.stringify(items));
    },
    [`${STORE}cart`, line!.variantId, quantity],
  );
}

/** The raw value stored under a demo-store key, parsed (null when absent). */
export async function stored<T = unknown>(page: Page, key: string): Promise<T | null> {
  await onOrigin(page);
  return page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw === null ? null : JSON.parse(raw);
  }, `${STORE}${key}`);
}

export async function setStored(page: Page, key: string, value: unknown) {
  await onOrigin(page);
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, JSON.stringify(v)),
    [`${STORE}${key}`, value],
  );
}

export type StoredOrder = {
  number: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalCents: number;
  email: string;
  events: { status: string; at: string; note: string | null }[];
};

export async function storedOrders(page: Page): Promise<StoredOrder[]> {
  return (await stored<StoredOrder[]>(page, "orders")) ?? [];
}

export const BILLING = {
  firstName: "Ana",
  lastName: "Lopez",
  address1: "1 High Street",
  city: "London",
  postcode: "N1 1AA",
  phone: "+44 20 7946 0000",
};

/** Fill the checkout billing form (country stays at its default, United Kingdom). */
export async function fillBilling(page: Page, email: string, over: Partial<typeof BILLING> = {}) {
  const values = { ...BILLING, ...over };
  for (const [name, value] of Object.entries(values)) {
    await page.getByTestId(`field-${name}`).fill(value);
  }
  await page.getByTestId("field-email").fill(email);
}

/** Add a product, check out as a guest with bank transfer and return the new order number. */
export async function placeOrderFor(page: Page, email: string, slug = "lip-repair-balm") {
  await addToCart(page, slug, 1);
  await page.goto("/checkout");
  await fillBilling(page, email);
  await page.getByTestId("check-acceptTerms").check();
  await page.getByTestId("place-order").click();
  await expect(page).toHaveURL(/\/checkout\/confirmation\/CSM-[A-Z0-9]{8}$/);
  return (await page.getByTestId("order-number").innerText()).trim();
}

export async function register(page: Page, username: string, email: string, password: string) {
  await page.goto("/register");
  await page.getByTestId("field-username").fill(username);
  await page.getByTestId("field-email").fill(email);
  await page.getByTestId("field-password").fill(password);
  await page.getByTestId("auth-submit").click();
  await expect(page).toHaveURL(/\/account$/);
}

export const PASSWORD = "a long unusual phrase 42";
