import { expect, test } from "@playwright/test";
import { uniqueEmail } from "../fixtures/db";
import {
  placeOrderFor,
  setStored,
  stored,
  storedOrders,
  type StoredOrder,
} from "../fixtures/flows";

// E2E-TRK-01..04 (PRD TRK-001/002, BR-12, ORD-001). Demo mode: orders live in this browser's localStorage,
// plus one sample order (CSM-DEMO2026 / demo@example.com) that every visitor can look up.
test.describe("Order tracking", () => {
  test("E2E-TRK-01 order ID and billing email show the status timeline and the order", async ({
    page,
  }) => {
    const email = uniqueEmail("track");
    const number = await placeOrderFor(page, email);

    await page.goto("/track-order");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Order tracking");
    await page.getByTestId("auth-submit").click(); // empty form
    await expect(page.getByTestId("error-orderId")).toBeVisible();
    await expect(page.getByTestId("error-email")).toBeVisible();

    await page.getByTestId("field-orderId").fill(number.toLowerCase());
    await page.getByTestId("field-email").fill(email.toUpperCase());
    await page.getByTestId("auth-submit").click();
    const result = page.getByTestId("track-result");
    await expect(result).toContainText(number);
    await expect(result.getByTestId("step-pending")).toHaveAttribute("data-done", "");
    await expect(result.getByTestId("step-shipped")).not.toHaveAttribute("data-done", "");
    await expect(result.getByTestId("order-items")).toContainText("Lip Repair Balm");
    await expect(result.getByTestId("payment-status")).toHaveText("Awaiting payment");
  });

  test("E2E-TRK-02 a wrong email or a wrong ID gives the same generic answer", async ({ page }) => {
    const email = uniqueEmail("generic");
    const number = await placeOrderFor(page, email);
    await page.goto("/track-order");

    const submit = async (id: string, mail: string) => {
      await page.getByTestId("field-orderId").fill(id);
      await page.getByTestId("field-email").fill(mail);
      await page.getByTestId("auth-submit").click();
      return page.getByTestId("form-error");
    };
    const wrongEmail = await submit(number, "someone.else@example.com");
    await expect(wrongEmail).toContainText("could not find an order");
    const message = await wrongEmail.innerText();
    await submit("CSM-ZZZZZZZZ", email);
    await expect(page.getByTestId("form-error")).toHaveText(message);
    await submit("nonsense", email);
    await expect(page.getByTestId("form-error")).toHaveText(message);
    await expect(page.getByTestId("track-result")).toHaveCount(0);
  });

  test("E2E-TRK-03 the documented sample order can be tracked from any browser", async ({
    page,
  }) => {
    await page.goto("/track-order");
    await page.getByTestId("field-orderId").fill("CSM-DEMO2026");
    await page.getByTestId("field-email").fill("demo@example.com");
    await page.getByTestId("auth-submit").click();
    const result = page.getByTestId("track-result");
    await expect(result).toContainText("CSM-DEMO2026");
    await expect(result.getByTestId("step-shipped")).toHaveAttribute("aria-current", "step");
    await expect(result).toContainText("DEMO-TRACK-0001");
    // and it is not mixed into this browser's own orders
    expect(await stored(page, "orders")).toBeNull();
  });

  test("E2E-TRK-04 the timeline follows the order through its states, including cancellation", async ({
    page,
  }) => {
    const email = uniqueEmail("states");
    const number = await placeOrderFor(page, email);
    expect(await storedOrders(page)).toHaveLength(1);

    const track = async () => {
      await page.goto("/track-order");
      await page.getByTestId("field-orderId").fill(number);
      await page.getByTestId("field-email").fill(email);
      await page.getByTestId("auth-submit").click();
      return page.getByTestId("track-result");
    };
    // there is no staff screen in the template, so the state change is applied to the stored order directly
    const change = async (
      status: string,
      extra: Partial<StoredOrder> & Record<string, unknown>,
      note: string,
    ) => {
      const orders = await storedOrders(page);
      const order = orders.find((o) => o.number === number)!;
      Object.assign(order, { status }, extra);
      order.events.push({ status, at: new Date().toISOString(), note });
      await setStored(page, "orders", orders);
    };

    await change("shipped", { carrier: "DHL", trackingNumber: "JD0146000" }, "Handed to carrier");
    let result = await track();
    await expect(result.getByTestId("step-shipped")).toHaveAttribute("aria-current", "step");
    await expect(result).toContainText("JD0146000");
    await expect(result).toContainText("Handed to carrier");

    await change("cancelled", {}, "Cancelled");
    result = await track();
    await expect(result.getByTestId("step-cancelled")).toHaveAttribute("aria-current", "step");
    await expect(result.getByTestId("step-delivered")).not.toHaveAttribute("data-done", "");
  });
});
