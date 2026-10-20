import { expect, test } from "@playwright/test";
import { latestResetLink, uniqueEmail } from "../fixtures/db";
import { addToCart, PASSWORD, register } from "../fixtures/flows";

// E2E-USR-01..06 (PRD USR-001..005, SEC-001/002/004). Every test uses its own account.
const name = (label: string) => `${label}${Math.random().toString(36).slice(2, 8)}`;

test.describe("Accounts and authentication", () => {
  test("E2E-USR-01 register shows field errors, then creates the account and signs in", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("error-username")).toBeVisible();
    await expect(page.getByTestId("error-email")).toBeVisible();
    await expect(page.getByTestId("error-password")).toBeVisible();

    const username = name("ana");
    const email = uniqueEmail("reg");
    await page.getByTestId("field-username").fill(username);
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill("12345678"); // too common
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("error-password")).toContainText("too common");

    await page.getByTestId("field-password").fill(PASSWORD);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: `Hello, ${username}` })).toBeVisible();
    await expect(page.getByTestId("profile")).toContainText(email);
    await expect(page.getByTestId("account-link")).toHaveAttribute("href", "/account");

    // the same email or user name cannot register twice
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/register");
    await page.getByTestId("field-username").fill(name("other"));
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill(PASSWORD);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("error-email")).toContainText("already exists");
  });

  test("E2E-USR-02 login: validation, one generic error for wrong user and wrong password, success", async ({
    page,
  }) => {
    const username = name("login");
    const email = uniqueEmail("login");
    await register(page, username, email, PASSWORD);
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("error-identifier")).toBeVisible();
    await expect(page.getByTestId("error-password")).toBeVisible();

    await page.getByTestId("field-identifier").fill(username);
    await page.getByTestId("field-password").fill("wrong password here");
    await page.getByTestId("auth-submit").click();
    const wrongPassword = await page.getByTestId("form-error").innerText();
    await page.getByTestId("field-identifier").fill("nobody-" + username);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("form-error")).toHaveText(wrongPassword); // no account enumeration

    // user name or email both work; the password field can be revealed
    await page.getByTestId("field-identifier").fill(email.toUpperCase());
    await page.getByTestId("field-password").fill(PASSWORD);
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(page.getByTestId("field-password")).toHaveAttribute("type", "text");
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test("E2E-USR-03 login locks after repeated failures (SEC-004)", async ({ page }) => {
    const username = name("lock");
    await register(page, username, uniqueEmail("lock"), PASSWORD);
    await page.getByTestId("logout").click();
    await page.goto("/login");
    for (let i = 0; i < 5; i++) {
      await page.getByTestId("field-identifier").fill(username);
      await page.getByTestId("field-password").fill(`wrong password ${i}`);
      await page.getByTestId("auth-submit").click();
      await expect(page.getByTestId("form-error")).toContainText("not correct");
    }
    // even the right password is refused while locked
    await page.getByTestId("field-password").fill(PASSWORD);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("form-error")).toContainText("Too many attempts");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("E2E-USR-04 forgot password answers the same for any account and the emailed link sets a new password", async ({
    page,
  }) => {
    const username = name("forgot");
    const email = uniqueEmail("forgot");
    await register(page, username, email, PASSWORD);
    await page.getByTestId("logout").click();

    await page.goto("/forgot-password");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("error-identifier")).toBeVisible();

    await page.getByTestId("field-identifier").fill("nobody-" + email);
    await page.getByTestId("auth-submit").click();
    const unknown = await page.getByTestId("forgot-sent").innerText();
    await page.getByTestId("field-identifier").fill(email);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("forgot-sent")).toHaveText(unknown);

    // the link only exists in the local outbox, and only for the real account
    expect(latestResetLink("nobody-" + email)).toBeNull();
    const link = latestResetLink(email);
    expect(link).not.toBeNull();
    await page.goto(link!);
    await page.getByTestId("field-password").fill("12345678");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("error-password")).toContainText("too common");
    const fresh = "a different long phrase 77";
    await page.getByTestId("field-password").fill(fresh);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/login$/);

    // the old password is gone, the new one works, and the link cannot be used twice
    await page.getByTestId("field-identifier").fill(username);
    await page.getByTestId("field-password").fill(PASSWORD);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("form-error")).toBeVisible();
    await page.getByTestId("field-password").fill(fresh);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/account$/);
    await page.goto(link!);
    await expect(page.getByTestId("reset-invalid")).toBeVisible();
  });

  test("E2E-USR-05 logout ends the session on the server and protected pages need a login (USR-005, SEC-002)", async ({
    page,
    context,
    request,
  }) => {
    // signed out: account pages and APIs refuse
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login\?next=/);
    for (const url of ["/api/account/addresses", "/api/account/wishlist"]) {
      expect((await request.get(url)).status(), url).toBe(401);
    }
    expect((await request.get("/api/auth/me")).status()).toBe(200);

    await register(page, name("out"), uniqueEmail("out"), PASSWORD);
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === "session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");

    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);

    // a copy of the old cookie is dead: the server deleted the session
    await context.addCookies([session!]);
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(
      ((await (await page.request.get("/api/auth/me")).json()) as { user: unknown }).user,
    ).toBeNull();
  });

  // restored with the demo account in TF1-T06 (the guest cart now lives in the browser)
  test.skip("E2E-USR-06 login merges the guest cart and wishlist into the account (OQ-20, WSH-003)", async ({
    page,
    browser,
  }) => {
    const username = name("merge");
    const email = uniqueEmail("merge");

    // first browser: the account already holds 2 serums and one wishlist item
    await register(page, username, email, PASSWORD);
    await addToCart(page, "the-renewal-serum", 2);
    await page.goto("/product/lip-repair-balm");
    const synced = page.waitForResponse(
      (r) => r.url().includes("/api/account/wishlist") && r.request().method() === "PUT",
    );
    await page.getByTestId("wishlist").click();
    await synced; // the heart is pushed to the account list while signed in
    await page.request.post("/api/auth/logout");

    // second browser: a guest builds a different basket, then logs in
    const guest = await browser.newContext();
    const gp = await guest.newPage();
    await addToCart(gp, "the-renewal-serum", 1);
    await addToCart(gp, "barrier-repair-cream", 1);
    await gp.goto("/product/gentle-cleansing-milk");
    await gp.getByTestId("wishlist").click();
    await expect(gp.getByTestId("wishlist-modal")).toBeVisible();
    await gp.keyboard.press("Escape");
    await expect(gp.getByTestId("wishlist-modal")).toBeHidden();
    await gp.goto("/login");
    await gp.getByTestId("field-identifier").fill(username);
    await gp.getByTestId("field-password").fill(PASSWORD);
    await gp.getByTestId("auth-submit").click();
    await expect(gp).toHaveURL(/\/account$/);

    // 2 + 1 serums (summed) and the cream; both wishlist items
    await expect(gp.getByTestId("cart-count")).toHaveText("4");
    await gp.goto("/cart");
    await expect(gp.getByTestId("cart-row")).toHaveCount(2);
    await expect(
      gp.getByTestId("cart-row").first().getByTestId("qty").locator("output"),
    ).toHaveText("03");
    await expect(gp.getByTestId("wishlist-count")).toHaveText("2");

    // logging out clears what the next person on this computer would see
    await gp.goto("/account");
    await gp.getByTestId("logout").click();
    await expect(gp).toHaveURL(/\/login$/);
    await expect(gp.getByTestId("cart-count")).toHaveCount(0);
    await expect(gp.getByTestId("wishlist-count")).toHaveCount(0);
    await guest.close();
  });

  test("E2E-USR-07 cross-site writes are rejected (SEC-004)", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      headers: { Origin: "https://evil.example" },
      data: { identifier: "a", password: "b" },
    });
    expect(response.status()).toBe(403);
  });
});
