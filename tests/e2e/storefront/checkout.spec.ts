import { expect, test } from "@playwright/test";
import { uniqueEmail } from "../fixtures/unique";
import {
  addToCart,
  fillBilling,
  PASSWORD,
  register,
  setStored,
  stored,
  storedOrders,
} from "../fixtures/flows";

// E2E-CHK-01..07 (PRD CHK-001..009, ORD-001/002, BR-03/07). Demo mode: the order is stored in the browser's
// localStorage and nothing is charged. Each test uses its own email so orders never mix.
const place = (page: import("@playwright/test").Page) => page.getByTestId("place-order").click();

test.describe("Checkout", () => {
  test("E2E-CHK-01 guest checkout: validation, totals, order placed, cart emptied", async ({
    page,
  }) => {
    const email = uniqueEmail("guest");
    await addToCart(page, "the-renewal-serum", 3);
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Checkout");

    // 3 x $48 = $144 -> free shipping, no shipping row
    await expect(page.getByTestId("checkout-lines").getByRole("listitem")).toHaveCount(1);
    await expect(page.getByTestId("checkout-total")).toHaveText("$144.00");
    await expect(page.getByTestId("checkout-shipping")).toHaveCount(0);
    await expect(page.getByTestId("shipping-bar")).toContainText("unlocked free shipping");

    // empty submit: every required field and the terms box are flagged and no order is stored
    await place(page);
    for (const field of [
      "firstName",
      "lastName",
      "address1",
      "city",
      "postcode",
      "phone",
      "email",
    ]) {
      await expect(page.getByTestId(`error-${field}`), field).toBeVisible();
    }
    await expect(page.getByTestId("error-acceptTerms")).toBeVisible();
    expect(await storedOrders(page)).toHaveLength(0);

    await fillBilling(page, "not-an-email");
    await place(page);
    await expect(page.getByTestId("error-email")).toContainText("valid email");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("check-acceptTerms").check();
    await place(page);

    await expect(page).toHaveURL(/\/checkout\/confirmation\/CSM-[A-Z0-9]{8}$/);
    const number = (await page.getByTestId("order-number").innerText()).trim();
    await expect(page.getByTestId("order-total")).toHaveText("$144.00");
    await expect(page.getByTestId("next-steps")).toContainText(number); // bank transfer reference
    await expect(page.getByTestId("step-pending")).toHaveAttribute("data-done", "");
    await expect(page.getByTestId("cart-count")).toHaveCount(0);

    // the browser holds one pending order and an empty cart
    const orders = await storedOrders(page);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      number,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "bank_transfer",
      totalCents: 14400,
      email,
    });
    expect(await stored(page, "cart")).toEqual([]);

    // reloading the confirmation works in this browser
    await page.reload();
    await expect(page.getByTestId("order-number")).toHaveText(number);
  });

  test("E2E-CHK-02 shipping applies below the threshold; cash on delivery and check also work", async ({
    page,
  }) => {
    const email = uniqueEmail("cod");
    await addToCart(page, "lip-repair-balm", 1); // $14
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-subtotal")).toHaveText("$14");
    await expect(page.getByTestId("checkout-shipping")).toHaveText("$8.00");
    await expect(page.getByTestId("checkout-total")).toHaveText("$22.00");
    await expect(page.getByTestId("shipping-bar")).toContainText("away from free shipping");

    await fillBilling(page, email);
    await page.getByTestId("pay-cod").check();
    await expect(page.getByText("Pay in cash when your order is delivered.")).toBeVisible();
    await page.getByTestId("check-acceptTerms").check();
    await place(page);
    await expect(page).toHaveURL(/\/checkout\/confirmation\//);
    await expect(page.getByTestId("order-total")).toHaveText("$22.00");
    expect((await storedOrders(page))[0]).toMatchObject({ paymentMethod: "cod", totalCents: 2200 });
  });

  test("E2E-CHK-03 a double click creates one order (CHK-006)", async ({ page }) => {
    const email = uniqueEmail("double");
    await addToCart(page, "gentle-cleansing-milk", 1);
    await page.goto("/checkout");
    await fillBilling(page, email);
    await page.getByTestId("check-acceptTerms").check();
    const button = page.getByTestId("place-order");
    await Promise.all([button.dblclick(), page.waitForURL(/\/checkout\/confirmation\//)]);
    expect(await storedOrders(page)).toHaveLength(1);
  });

  test("E2E-CHK-04 a declined card leaves a consistent state: failed order, cart kept, retry works", async ({
    page,
  }) => {
    const email = uniqueEmail("declined");
    await addToCart(page, "lip-repair-balm", 2);
    await page.goto("/checkout");
    await fillBilling(page, email);
    await page.getByTestId("pay-card_test").check();
    await page.getByTestId("check-acceptTerms").check();

    // the documented testing hook: the next test-card payment is declined once
    await setStored(page, "simulate", "decline");
    await place(page);
    await expect(page.getByTestId("checkout-problem")).toContainText("declined");
    await expect(page).toHaveURL(/\/checkout$/);
    expect(await storedOrders(page)).toMatchObject([{ status: "failed", paymentStatus: "failed" }]);
    expect(await stored(page, "cart")).toHaveLength(1); // the cart is kept
    expect(await stored(page, "simulate")).toBeNull(); // the hook is single use

    // the shopper tries again: the test card approves and the order starts processing
    await place(page);
    await expect(page).toHaveURL(/\/checkout\/confirmation\//);
    await expect(page.getByTestId("payment-status")).toHaveText("Paid");
    await expect(page.getByTestId("step-processing")).toHaveAttribute("data-done", "");
    expect((await storedOrders(page)).map((o) => o.status)).toEqual(["failed", "processing"]);
    expect(await stored(page, "cart")).toEqual([]);
  });

  test("E2E-CHK-05 stock that disappears after adding to the cart blocks the order and says which item", async ({
    page,
  }) => {
    const email = uniqueEmail("stock");
    await addToCart(page, "firming-neck-cream", 3);
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-total")).toBeVisible();

    // from now on the catalog reports one unit left
    await page.route("**/api/variants?*", async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { lines: { slug: string; available: number }[] };
      for (const line of body.lines) if (line.slug === "firming-neck-cream") line.available = 1;
      await route.fulfill({ response, json: body });
    });

    await fillBilling(page, email);
    await page.getByTestId("check-acceptTerms").check();
    await place(page);
    await expect(page.getByTestId("checkout-problem")).toContainText("no longer available");
    await expect(page.getByTestId("checkout-problem")).toContainText("Firming neck cream");
    expect(await storedOrders(page)).toHaveLength(0);
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("E2E-CHK-06 an empty cart shows the empty state and no order can be placed", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-empty")).toBeVisible();
    await expect(page.getByTestId("place-order")).toHaveCount(0);
    expect(await storedOrders(page)).toHaveLength(0);
  });

  test("E2E-CHK-07 the coupon box opens and rejects unknown codes (the template has no coupon rules)", async ({
    page,
  }) => {
    await addToCart(page, "lip-repair-balm", 1);
    await page.goto("/checkout");
    await expect(page.getByTestId("coupon-input")).toHaveCount(0);
    await page.getByRole("button", { name: "Click here" }).click();
    await page.getByTestId("coupon-input").fill("SAVE10");
    await page.getByRole("button", { name: "Apply coupon" }).click();
    await expect(page.getByText("This coupon code is not valid.")).toBeVisible();
  });

  test("E2E-CHK-08 signed-in checkout pre-fills the saved address and the order appears in the account", async ({
    page,
  }) => {
    const email = uniqueEmail("member");
    await register(page, "member" + Math.random().toString(36).slice(2, 8), email, PASSWORD);

    await page.goto("/account/addresses");
    await expect(page.getByTestId("addresses-empty")).toBeVisible();
    await page.getByTestId("add-address").click();
    await page.getByTestId("save-address").click();
    await expect(page.getByTestId("error-firstName")).toBeVisible();
    await page.getByTestId("field-firstName").fill("Maya");
    await page.getByTestId("field-lastName").fill("Stone");
    await page.getByTestId("field-address1").fill("22 Baker Street");
    await page.getByTestId("field-city").fill("London");
    await page.getByTestId("field-postcode").fill("NW1 6XE");
    await page.getByTestId("field-phone").fill("+44 20 7946 0001");
    await page.getByTestId("save-address").click();
    await expect(page.getByTestId("address-card")).toHaveCount(1);
    await expect(page.getByTestId("address-card")).toContainText("Default");

    await addToCart(page, "lip-repair-balm", 1);
    await page.goto("/checkout");
    await expect(page.getByTestId("field-firstName")).toHaveValue("Maya");
    await expect(page.getByTestId("field-address1")).toHaveValue("22 Baker Street");
    await expect(page.getByTestId("field-email")).toHaveValue(email);
    await page.getByTestId("check-acceptTerms").check();
    await place(page);
    await expect(page).toHaveURL(/\/checkout\/confirmation\//);
    const number = (await page.getByTestId("order-number").innerText()).trim();

    await page.goto("/account/orders");
    await expect(page.getByTestId("orders-list")).toContainText(number);
    await page.getByRole("link", { name: number }).click();
    await expect(page.getByTestId("order-heading")).toContainText(number);
    await expect(page.getByTestId("order-items")).toContainText("Lip Repair Balm");
  });

  test("E2E-CHK-09 another account cannot open someone else's order; a new browser is sent to tracking", async ({
    page,
    browser,
  }) => {
    const email = uniqueEmail("owner");
    await register(page, "owner" + Math.random().toString(36).slice(2, 8), email, PASSWORD);
    await addToCart(page, "lip-repair-balm", 1);
    await page.goto("/checkout");
    await page.getByTestId("check-acceptTerms").check();
    await fillBilling(page, email);
    await place(page);
    await expect(page).toHaveURL(/\/checkout\/confirmation\//);
    const number = (await page.getByTestId("order-number").innerText()).trim();

    // a second account in the same browser sees an empty order list and a 404 for the first one's order
    await page.goto("/account");
    await page.getByTestId("logout").click();
    await register(
      page,
      "intruder" + Math.random().toString(36).slice(2, 8),
      uniqueEmail("intruder"),
      PASSWORD,
    );
    await page.goto("/account/orders");
    await expect(page.getByTestId("orders-empty")).toBeVisible();
    await page.goto(`/account/orders/${number}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oooop! Page not found");

    // another browser does not have the order at all: the confirmation page sends it to the tracking form
    const other = await browser.newContext();
    const op = await other.newPage();
    await op.goto(`/checkout/confirmation/${number}`);
    await expect(op).toHaveURL(/\/track-order$/);
    await other.close();
  });
});
