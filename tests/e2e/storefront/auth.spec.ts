import { expect, test } from "@playwright/test";
import { uniqueEmail } from "../fixtures/unique";
import { addToCart, PASSWORD, register, stored } from "../fixtures/flows";

// E2E-USR-01..07 (PRD USR-001..005). Demo mode: accounts, the session and reset links live in this browser's
// localStorage, so nothing is shared between browsers. Every test uses its own account.
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

  test("E2E-USR-03 login locks after repeated failures", async ({ page }) => {
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

  test("E2E-USR-04 forgot password answers the same for any account and the reset link sets a new password", async ({
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
    await expect(page.getByTestId("demo-reset-link")).toHaveCount(0); // no link for a non-existent account
    await page.getByTestId("field-identifier").fill(email);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("forgot-sent")).toHaveText(unknown);

    // demo mode sends no email: the page offers the link, and only for the real account
    const link = await page.getByTestId("demo-reset-link").getByRole("link").getAttribute("href");
    expect(link).toMatch(/^\/reset-password\?token=[0-9a-f]{64}$/);
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

  test("E2E-USR-05 logout ends the session and account pages need a login (USR-005)", async ({
    page,
  }) => {
    // signed out: account pages send the visitor to the login page and keep the target
    await page.goto("/account/orders");
    await expect(page).toHaveURL(
      /\/login\?next=%2Faccount%2Forders|\/login\?next=\/account\/orders/,
    );

    await register(page, name("out"), uniqueEmail("out"), PASSWORD);
    expect(await stored(page, "session")).not.toBeNull();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await stored(page, "session")).toBeNull();

    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=/);
    // the passwords are stored as a digest, never in the clear
    const users = (await stored<Record<string, unknown>[]>(page, "users")) ?? [];
    expect(JSON.stringify(users)).not.toContain(PASSWORD);
    expect(users[0]).toHaveProperty("hash");
  });

  test("E2E-USR-06 the cart and wishlist stay as they are through login and logout", async ({
    page,
  }) => {
    const username = name("keep");
    await register(page, username, uniqueEmail("keep"), PASSWORD);
    await page.getByTestId("logout").click();

    await addToCart(page, "the-renewal-serum", 2);
    await page.goto("/product/gentle-cleansing-milk");
    await page.getByTestId("wishlist").click();
    await page.keyboard.press("Escape");
    await page.goto("/login");
    await page.getByTestId("field-identifier").fill(username);
    await page.getByTestId("field-password").fill(PASSWORD);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId("cart-count")).toHaveText("2");
    await expect(page.getByTestId("wishlist-count")).toHaveText("1");

    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId("cart-count")).toHaveText("2");
  });

  test("E2E-USR-07 change password asks for the current one and applies the password rules", async ({
    page,
  }) => {
    const username = name("chg");
    await register(page, username, uniqueEmail("chg"), PASSWORD);
    const form = page.getByTestId("password-form");
    await form.getByTestId("auth-submit").click();
    await expect(form.getByTestId("error-current")).toBeVisible();
    await expect(form.getByTestId("error-next")).toBeVisible();

    await form.getByTestId("field-current").fill("not my password");
    await form.getByTestId("field-next").fill("a brand new long phrase 9");
    await form.getByTestId("auth-submit").click();
    await expect(form.getByTestId("error-current")).toContainText("not correct");

    await form.getByTestId("field-current").fill(PASSWORD);
    await form.getByTestId("field-next").fill("password123"); // too common
    await form.getByTestId("auth-submit").click();
    await expect(form.getByTestId("error-next")).toContainText("too common");

    await form.getByTestId("field-next").fill("a brand new long phrase 9");
    await form.getByTestId("auth-submit").click();
    await expect(page.getByTestId("password-changed")).toBeVisible();
  });
});
