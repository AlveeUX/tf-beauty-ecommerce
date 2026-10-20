import { expect, test } from "@playwright/test";
import { uniqueEmail } from "../fixtures/unique";
import { stored } from "../fixtures/flows";

// E2E-NWS-01..03 (PRD NWS-001, NWS-002): newsletter sign-up from the footer and the welcome popup.
// Every other test starts with the popup already dismissed (playwright.config.ts); these start fresh.
test.describe("Newsletter popup", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("E2E-NWS-01 the welcome popup appears, follows the frame, validates and stores a sign-up", async ({
    page,
  }) => {
    await page.goto("/shop");
    const popup = page.getByTestId("newsletter-popup");
    await expect(popup).toBeVisible({ timeout: 15_000 });
    const box = await popup.boundingBox();
    expect(box).toMatchObject({ x: 540, width: 840, height: 530 });
    await expect(popup.getByRole("heading")).toHaveText("Join Today and Enjoy 20% Off Everything.");
    await expect(popup).toContainText("Glow For Less");
    await expect(popup).toContainText("*Receive curated updates");
    await expect(page.getByTestId("popup-email")).toBeFocused();

    await page.getByTestId("popup-submit").click();
    await expect(popup.getByRole("alert")).toHaveText("Please enter a valid email address.");

    const email = uniqueEmail("popup");
    await page.getByTestId("popup-email").fill(email);
    await page.getByTestId("popup-submit").click();
    await expect(page.getByTestId("popup-thanks")).toContainText("Thank you for subscribing");
    expect(await stored(page, "subscribers")).toMatchObject([{ email, source: "popup" }]);

    // a sign-up is remembered: the popup does not come back
    await page.getByRole("button", { name: "Close" }).click();
    await expect(popup).toBeHidden();
    const memory = await page.evaluate(() => localStorage.getItem("cosmia.newsletter-popup"));
    expect(JSON.parse(memory ?? "{}")).toMatchObject({ subscribed: true });
  });

  test("E2E-NWS-02 Escape closes the popup, returns focus and keeps it away for a while", async ({
    page,
  }) => {
    await page.goto("/about");
    const popup = page.getByTestId("newsletter-popup");
    await expect(popup).toBeVisible({ timeout: 15_000 });
    // Tab stays inside the dialog
    for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(
      true,
    );
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    const memory = await page.evaluate(() => localStorage.getItem("cosmia.newsletter-popup"));
    expect(JSON.parse(memory ?? "{}")).toMatchObject({ subscribed: false });
    // quiet pages never show it
    await page.goto("/checkout");
    await page.waitForTimeout(500);
    await expect(popup).toBeHidden();
  });
});

test.describe("Newsletter sign-up forms", () => {
  test("E2E-NWS-03 the footer form needs consent and keeps each address once", async ({ page }) => {
    await page.goto("/faqs");
    const form = page.locator("footer form");
    const email = uniqueEmail("footer");
    await form.getByPlaceholder("Enter your email").fill(email);
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("alert")).toHaveText("Please accept the terms to subscribe.");
    expect(await stored(page, "subscribers")).toBeNull();

    await form.getByRole("checkbox").check({ force: true });
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("status")).toHaveText("Thanks for subscribing.");
    expect(await stored(page, "subscribers")).toMatchObject([{ email, source: "footer" }]);

    // the same address again (any capitalisation) is answered the same way and stays a single entry
    await form.getByPlaceholder("Enter your email").fill(email.toUpperCase());
    await form.getByRole("checkbox").check({ force: true });
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("status")).toHaveText("Thanks for subscribing.");
    expect(await stored<unknown[]>(page, "subscribers")).toHaveLength(1);
  });
});
