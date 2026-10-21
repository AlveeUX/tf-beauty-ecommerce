"use client";

import { useMemo } from "react";
import { passwordProblem } from "@/lib/validation/password";
import type { BillingInput } from "@/lib/validation/checkout";
import { readStore, removeStore, useHydrated, useStore, writeStore } from "./storage";

/**
 * Demo accounts, kept in this browser only (localStorage, `cosmia.demo.*`). Passwords are stored as a
 * salted SHA-256 digest so they are never readable in the clear, but this is NOT real security: anyone
 * with access to the browser can read or change every account. Replace this module with calls to your
 * own authentication service when you connect a backend.
 */
export type SessionUser = { id: number; email: string; username: string };
type StoredUser = SessionUser & { salt: string; hash: string };
type StoredReset = { token: string; userId: number; expiresAt: number };
type Throttle = Record<string, { count: number; until: number }>;

export type AddressFields = Omit<BillingInput, "email" | "notes">;
export type AddressView = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  company: string | null;
  country: string;
  address1: string;
  address2: string | null;
  city: string;
  postcode: string;
  phone: string;
  isDefault: boolean;
};

const USERS = "users";
const SESSION = "session";
const RESETS = "resets";
const THROTTLE = "throttle";
const ADDRESSES = "addresses";

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const MAX_ADDRESSES = 10;

type FieldProblems = Record<string, string>;
export type Outcome<T = object> =
  ({ ok: true } & T) | { ok: false; message: string; errors?: FieldProblems };

const NO_USERS: StoredUser[] = [];
const NO_ADDRESSES: AddressView[] = [];

async function digest(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  if (globalThis.crypto?.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // insecure contexts (plain http on a LAN address) have no SubtleCrypto: fall back to a simple hash
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

const hashPassword = (salt: string, password: string) => digest(`${salt}:${password}`);
const users = () => readStore<StoredUser[]>(USERS, NO_USERS);
const toSession = ({ id, email, username }: StoredUser): SessionUser => ({ id, email, username });

/* --------------------------------- session --------------------------------- */

/** The signed-in user (null when signed out) and whether stored data has been read yet. */
export function useCurrentUser(): { user: SessionUser | null; hydrated: boolean } {
  const hydrated = useHydrated();
  const all = useStore<StoredUser[]>(USERS, NO_USERS);
  const session = useStore<{ userId: number } | null>(SESSION, null);
  const user = useMemo(() => {
    const found = session ? all.find((u) => u.id === session.userId) : undefined;
    return found ? toSession(found) : null;
  }, [all, session]);
  return { user, hydrated };
}

/** Set by an explicit log out, so account pages do not also redirect to the login page with a `next` target. */
let signedOutOnPurpose = false;
export const wasSignedOutOnPurpose = () => signedOutOnPurpose;

export function signOut(): void {
  signedOutOnPurpose = true;
  removeStore(SESSION);
}

/* ------------------------------ register / login ------------------------------ */

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<Outcome<{ user: SessionUser }>> {
  const problem = passwordProblem(input.password);
  if (problem) {
    return { ok: false, message: problem, errors: { password: problem } };
  }
  const all = users();
  const email = input.email.trim().toLowerCase();
  if (all.some((u) => u.email.toLowerCase() === email)) {
    const message = "An account with this email address already exists.";
    return { ok: false, message, errors: { email: message } };
  }
  if (all.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
    const message = "This user name is already taken.";
    return { ok: false, message, errors: { username: message } };
  }
  const salt = randomHex(16);
  const user: StoredUser = {
    id: all.reduce((max, u) => Math.max(max, u.id), 0) + 1,
    username: input.username,
    email,
    salt,
    hash: await hashPassword(salt, input.password),
  };
  writeStore(USERS, [...all, user]);
  signedOutOnPurpose = false;
  writeStore(SESSION, { userId: user.id });
  return { ok: true, user: toSession(user) };
}

const BAD_LOGIN = "The user name, email address or password is not correct.";

/** Wrong user and wrong password give the same message so accounts cannot be enumerated. */
export async function signIn(
  identifier: string,
  password: string,
): Promise<Outcome<{ user: SessionUser }>> {
  const key = identifier.trim().toLowerCase();
  const throttle = readStore<Throttle>(THROTTLE, {});
  const entry = throttle[key];
  if (entry && entry.until > Date.now()) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
  }
  const found = users().find(
    (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key,
  );
  if (!found || (await hashPassword(found.salt, password)) !== found.hash) {
    const count = (entry && entry.until === 0 ? entry.count : 0) + 1;
    writeStore(THROTTLE, {
      ...throttle,
      [key]: { count, until: count >= MAX_FAILURES ? Date.now() + LOCK_MS : 0 },
    });
    return { ok: false, message: BAD_LOGIN };
  }
  const { [key]: _cleared, ...rest } = throttle;
  void _cleared;
  writeStore(THROTTLE, rest);
  signedOutOnPurpose = false;
  writeStore(SESSION, { userId: found.id });
  return { ok: true, user: toSession(found) };
}

/* ------------------------------ password reset ------------------------------ */

const RESET_SENT =
  "If an account exists for that user name or email address, a link to choose a new password has been created.";

/**
 * Creates a reset token for an existing account. Demo mode sends no email, so the link is returned for the
 * page to show; the message is the same whether or not the account exists.
 */
export function requestPasswordReset(identifier: string): { message: string; link: string | null } {
  const key = identifier.trim().toLowerCase();
  const user = users().find(
    (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key,
  );
  if (!user) return { message: RESET_SENT, link: null };
  const token = randomHex(32);
  const others = readStore<StoredReset[]>(RESETS, []).filter((r) => r.userId !== user.id);
  writeStore(RESETS, [...others, { token, userId: user.id, expiresAt: Date.now() + RESET_TTL_MS }]);
  return { message: RESET_SENT, link: `/reset-password?token=${token}` };
}

const NO_RESETS: StoredReset[] = [];
const isLive = (r: StoredReset, token: string) => r.token === token && r.expiresAt > Date.now();

export function isResetTokenValid(token: string): boolean {
  return readStore<StoredReset[]>(RESETS, NO_RESETS).some((r) => isLive(r, token));
}

/** True while the reset link can be used (hook version of {@link isResetTokenValid}). */
export function useResetTokenValid(token: string): boolean {
  return useStore<StoredReset[]>(RESETS, NO_RESETS).some((r) => isLive(r, token));
}

const INVALID_LINK = "This reset link is invalid or has expired.";

export async function resetPassword(token: string, password: string): Promise<Outcome> {
  const reset = readStore<StoredReset[]>(RESETS, []).find(
    (r) => r.token === token && r.expiresAt > Date.now(),
  );
  if (!reset) return { ok: false, message: INVALID_LINK };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, message: problem, errors: { password: problem } };
  const salt = randomHex(16);
  const hash = await hashPassword(salt, password);
  writeStore(
    USERS,
    users().map((u) => (u.id === reset.userId ? { ...u, salt, hash } : u)),
  );
  // a link works once
  writeStore(
    RESETS,
    readStore<StoredReset[]>(RESETS, []).filter((r) => r.token !== token),
  );
  removeStore(THROTTLE);
  return { ok: true };
}

export async function changePassword(
  userId: number,
  current: string,
  next: string,
): Promise<Outcome> {
  const user = users().find((u) => u.id === userId);
  if (!user || (await hashPassword(user.salt, current)) !== user.hash) {
    const message = "Your current password is not correct.";
    return { ok: false, message, errors: { current: message } };
  }
  const problem = passwordProblem(next);
  if (problem) return { ok: false, message: problem, errors: { next: problem } };
  const salt = randomHex(16);
  const hash = await hashPassword(salt, next);
  writeStore(
    USERS,
    users().map((u) => (u.id === userId ? { ...u, salt, hash } : u)),
  );
  return { ok: true };
}

/* --------------------------------- addresses --------------------------------- */

const allAddresses = () => readStore<AddressView[]>(ADDRESSES, NO_ADDRESSES);
const ordered = (list: AddressView[]) =>
  [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id);

const fieldsOf = (a: AddressFields) => ({
  firstName: a.firstName,
  lastName: a.lastName,
  company: a.company ?? null,
  country: a.country,
  address1: a.address1,
  address2: a.address2 ?? null,
  city: a.city,
  postcode: a.postcode,
  phone: a.phone,
});

/** Saved addresses of one account, default first. */
export function useAddresses(userId: number | null): AddressView[] {
  const all = useStore<AddressView[]>(ADDRESSES, NO_ADDRESSES);
  return useMemo(
    () => (userId === null ? NO_ADDRESSES : ordered(all.filter((a) => a.userId === userId))),
    [all, userId],
  );
}

export function addAddress(userId: number, input: AddressFields): Outcome {
  const all = allAddresses();
  const mine = all.filter((a) => a.userId === userId);
  if (mine.length >= MAX_ADDRESSES) {
    return { ok: false, message: `You can save up to ${MAX_ADDRESSES} addresses.` };
  }
  const id = all.reduce((max, a) => Math.max(max, a.id), 0) + 1;
  // the first address becomes the default that checkout pre-fills
  writeStore(ADDRESSES, [...all, { id, userId, ...fieldsOf(input), isDefault: mine.length === 0 }]);
  return { ok: true };
}

export function updateAddress(userId: number, id: number, input: AddressFields): Outcome {
  const all = allAddresses();
  if (!all.some((a) => a.id === id && a.userId === userId)) {
    return { ok: false, message: "That address was not found." };
  }
  writeStore(
    ADDRESSES,
    all.map((a) => (a.id === id ? { ...a, ...fieldsOf(input) } : a)),
  );
  return { ok: true };
}

export function setDefaultAddress(userId: number, id: number): void {
  writeStore(
    ADDRESSES,
    allAddresses().map((a) => (a.userId === userId ? { ...a, isDefault: a.id === id } : a)),
  );
}

export function deleteAddress(userId: number, id: number): void {
  const left = allAddresses().filter((a) => !(a.id === id && a.userId === userId));
  const mine = ordered(left.filter((a) => a.userId === userId));
  // deleting the default hands the role to the next address
  const promote = mine.length > 0 && !mine.some((a) => a.isDefault) ? mine[0]!.id : null;
  writeStore(
    ADDRESSES,
    left.map((a) => (a.id === promote ? { ...a, isDefault: true } : a)),
  );
}
