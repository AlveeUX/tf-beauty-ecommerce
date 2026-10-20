"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/form/Field";
import { changePassword, useCurrentUser } from "@/lib/demo-store/account";
import type { FieldErrors } from "@/lib/validation/checkout";
import formStyles from "./AuthForms.module.css";

export function ChangePasswordForm() {
  const { user } = useCurrentUser();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setDone(false);
    const found: FieldErrors = {};
    if (!current) found.current = "Enter your current password.";
    if (!next) found.next = "Choose a new password.";
    if (Object.keys(found).length > 0) return setErrors(found);
    if (!user) return;
    setErrors({});
    setBusy(true);
    const result = await changePassword(user.id, current, next);
    setBusy(false);
    if (result.ok) {
      setDone(true);
      setCurrent("");
      setNext("");
    } else {
      setErrors(result.errors ?? { current: result.message });
    }
  }

  return (
    <form className={formStyles.form} onSubmit={submit} noValidate data-testid="password-form">
      {done ? (
        <p role="status" className={formStyles.success} data-testid="password-changed">
          Your password has been changed.
        </p>
      ) : null}
      <Field
        label="Current password"
        name="current"
        kind="password"
        value={current}
        onChange={setCurrent}
        error={errors.current}
        autoComplete="current-password"
        required
      />
      <Field
        label="New password"
        name="next"
        kind="password"
        value={next}
        onChange={setNext}
        error={errors.next}
        autoComplete="new-password"
        required
      />
      <button type="submit" className={formStyles.submit} disabled={busy} data-testid="auth-submit">
        <span>Change password</span>
      </button>
    </form>
  );
}
