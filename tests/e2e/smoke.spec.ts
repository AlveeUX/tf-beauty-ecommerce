import { expect, test } from "@playwright/test";
import { expectNoSeriousViolations } from "./fixtures/axe";

// E2E-SMOKE-01: the app starts, serves the Home page, and the database is reachable.
test.describe("E2E-SMOKE-01 foundation smoke", () => {
  test("home page loads with its hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Glam Defined Perfectly");
  });

  test("health endpoint reports ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("home page has no critical/serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    expect(await expectNoSeriousViolations(page)).toEqual([]);
  });
});
