import { beforeEach, describe, expect, it } from "vitest";
import {
  addAddress,
  changePassword,
  deleteAddress,
  isResetTokenValid,
  registerUser,
  requestPasswordReset,
  resetPassword,
  setDefaultAddress,
  signIn,
  signOut,
  updateAddress,
  type AddressFields,
} from "../../src/lib/demo-store/account";
import { readStore } from "../../src/lib/demo-store/storage";
import { installBrowser } from "../helpers/browser-shim";

const PASSWORD = "a long unusual phrase 42";
const signUp = (name = "ana", email = "ana@example.com") =>
  registerUser({ username: name, email, password: PASSWORD });
const session = () => readStore<{ userId: number } | null>("session", null);

beforeEach(installBrowser);

describe("register and sign in", () => {
  it("creates an account, signs in, and never stores the password in the clear", async () => {
    const result = await signUp();
    expect(result).toMatchObject({ ok: true, user: { id: 1, username: "ana" } });
    expect(session()).toEqual({ userId: 1 });
    expect(JSON.stringify(window.localStorage)).not.toContain(PASSWORD);
    const [stored] = readStore<{ salt: string; hash: string }[]>("users", []);
    expect(stored!.salt).toHaveLength(32);
    expect(stored!.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("applies the password rules and rejects duplicate emails and user names", async () => {
    expect(
      await registerUser({ username: "bob", email: "b@example.com", password: "12345678" }),
    ).toMatchObject({
      ok: false,
      errors: { password: expect.stringContaining("too common") },
    });
    expect(
      await registerUser({ username: "bob", email: "b@example.com", password: "short" }),
    ).toMatchObject({
      ok: false,
      errors: { password: expect.stringContaining("at least 8") },
    });
    await signUp();
    expect(await signUp("other", "ANA@example.com")).toMatchObject({
      ok: false,
      errors: { email: expect.stringContaining("already exists") },
    });
    expect(await signUp("ANA", "other@example.com")).toMatchObject({
      ok: false,
      errors: { username: expect.stringContaining("already taken") },
    });
  });

  it("signs in by user name or email, and gives one message for every failure", async () => {
    await signUp();
    signOut();
    expect(session()).toBeNull();
    const wrongPassword = await signIn("ana", "nope nope nope");
    const unknownUser = await signIn("nobody", PASSWORD);
    expect(wrongPassword).toEqual(unknownUser);
    expect(wrongPassword.ok).toBe(false);
    expect(await signIn("Ana@Example.com", PASSWORD)).toMatchObject({ ok: true });
    expect(session()).toEqual({ userId: 1 });
  });

  it("locks the identifier after five failures, even for the right password", async () => {
    await signUp();
    signOut();
    for (let i = 0; i < 5; i++) expect((await signIn("ana", `wrong ${i}`)).ok).toBe(false);
    const locked = await signIn("ana", PASSWORD);
    expect(locked).toMatchObject({
      ok: false,
      message: expect.stringContaining("Too many attempts"),
    });
    expect(session()).toBeNull();
  });
});

describe("password reset and change", () => {
  it("gives the same answer for any account and a link only for real ones", async () => {
    await signUp();
    const real = requestPasswordReset("ana@example.com");
    const fake = requestPasswordReset("nobody");
    expect(real.message).toBe(fake.message);
    expect(fake.link).toBeNull();
    expect(real.link).toMatch(/^\/reset-password\?token=[0-9a-f]{64}$/);
  });

  it("a reset link sets a new password once, and expires", async () => {
    await signUp();
    signOut();
    const token = requestPasswordReset("ana").link!.split("=")[1]!;
    expect(isResetTokenValid(token)).toBe(true);
    expect(await resetPassword(token, "12345678")).toMatchObject({ ok: false });
    expect(await resetPassword(token, "the new long phrase 5")).toEqual({ ok: true });
    expect(isResetTokenValid(token)).toBe(false);
    expect(await resetPassword(token, "another long phrase 6")).toMatchObject({ ok: false });
    expect((await signIn("ana", PASSWORD)).ok).toBe(false);
    expect((await signIn("ana", "the new long phrase 5")).ok).toBe(true);

    const later = requestPasswordReset("ana").link!.split("=")[1]!;
    const resets = readStore<{ token: string; expiresAt: number }[]>("resets", []);
    window.localStorage.setItem(
      "cosmia.demo.resets",
      JSON.stringify(resets.map((r) => ({ ...r, expiresAt: Date.now() - 1 }))),
    );
    expect(isResetTokenValid(later)).toBe(false);
  });

  it("changing the password needs the current one", async () => {
    await signUp();
    expect(await changePassword(1, "wrong", "a brand new long phrase 9")).toMatchObject({
      ok: false,
      errors: { current: expect.any(String) },
    });
    expect(await changePassword(1, PASSWORD, "password123")).toMatchObject({
      ok: false,
      errors: { next: expect.stringContaining("too common") },
    });
    expect(await changePassword(1, PASSWORD, "a brand new long phrase 9")).toEqual({ ok: true });
    signOut();
    expect((await signIn("ana", "a brand new long phrase 9")).ok).toBe(true);
  });
});

describe("saved addresses", () => {
  const address = (over: Partial<AddressFields> = {}): AddressFields => ({
    firstName: "Maya",
    lastName: "Stone",
    company: undefined,
    address2: undefined,
    country: "United Kingdom (UK)",
    address1: "22 Baker Street",
    city: "London",
    postcode: "NW1 6XE",
    phone: "+44 20 7946 0001",
    ...over,
  });
  const mine = (userId: number) =>
    readStore<{ id: number; userId: number; isDefault: boolean; firstName: string }[]>(
      "addresses",
      [],
    ).filter((a) => a.userId === userId);

  it("makes the first address the default, keeps one default, and promotes another on delete", () => {
    addAddress(1, address());
    addAddress(1, address({ firstName: "Second" }));
    expect(mine(1).map((a) => a.isDefault)).toEqual([true, false]);

    setDefaultAddress(1, 2);
    expect(mine(1).map((a) => a.isDefault)).toEqual([false, true]);

    deleteAddress(1, 2);
    expect(mine(1)).toHaveLength(1);
    expect(mine(1)[0]!.isDefault).toBe(true);
  });

  it("only touches the owner's addresses and caps the list at ten", () => {
    addAddress(1, address());
    expect(updateAddress(2, 1, address({ firstName: "Hijack" }))).toMatchObject({ ok: false });
    deleteAddress(2, 1);
    expect(mine(1)[0]!.firstName).toBe("Maya");
    expect(updateAddress(1, 1, address({ firstName: "Renamed" }))).toEqual({ ok: true });
    expect(mine(1)[0]!.firstName).toBe("Renamed");

    for (let i = 0; i < 9; i++) expect(addAddress(1, address())).toEqual({ ok: true });
    expect(addAddress(1, address())).toMatchObject({ ok: false });
  });
});
