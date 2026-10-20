"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Checkbox } from "@/components/form/Checkbox";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/ui/Icon";
import {
  registerUser,
  requestPasswordReset,
  resetPassword,
  signIn,
  useCurrentUser,
  useResetTokenValid,
} from "@/lib/demo-store/account";
import { notify } from "@/lib/notify";
import { forgotSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validation/auth";
import { fieldErrors, type FieldErrors } from "@/lib/validation/checkout";
import styles from "./AuthForms.module.css";

/** Only same-site paths are followed after login (no open redirect). */
export function safeNext(value: string | undefined): string {
  return value && /^\/(?!\/)[\w\-/?=&.%]*$/.test(value) ? value : "/account";
}

type Tab = "login" | "register";

export function AuthTabs({ active }: { active: Tab }) {
  return (
    <div className={styles.tabsRow}>
      <nav className={styles.tabs} aria-label="Account">
        <Link
          href="/login"
          className={styles.tab}
          aria-current={active === "login" ? "page" : undefined}
        >
          Login
        </Link>
        <Link
          href="/register"
          className={styles.tab}
          aria-current={active === "register" ? "page" : undefined}
        >
          Register
        </Link>
      </nav>
    </div>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: string }) {
  return (
    <button type="submit" className={styles.submit} disabled={busy} data-testid="auth-submit">
      <span>{children}</span>
      <Icon name="arrow-up-right" size={18} />
    </button>
  );
}

/** Signed-in visitors have nothing to do on the login and register pages: send them on. */
function useLeaveWhenSignedIn(next: string) {
  const router = useRouter();
  const { user } = useCurrentUser();
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);
}

export function LoginForm({ next }: { next?: string }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const target = safeNext(next);
  useLeaveWhenSignedIn(target);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = loginSchema.safeParse({ identifier, password, remember });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const result = await signIn(parsed.data.identifier, parsed.data.password);
    if (result.ok) {
      router.push(target);
    } else {
      setFormError(result.message);
      setBusy(false);
    }
  }

  return (
    <form className={`${styles.form} ${styles.withTabs}`} onSubmit={submit} noValidate>
      {formError ? (
        <p role="alert" className={styles.alert} data-testid="form-error">
          {formError}
        </p>
      ) : null}
      <Field
        label="User name/ email address"
        name="identifier"
        value={identifier}
        onChange={setIdentifier}
        error={errors.identifier}
        autoComplete="username"
        required
      />
      <Field
        label="Password"
        name="password"
        kind="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="current-password"
        required
      />
      <div className={styles.rowTight}>
        <Checkbox name="remember" checked={remember} onChange={setRemember}>
          Remember me
        </Checkbox>
      </div>
      <SubmitButton busy={busy}>Login</SubmitButton>
      <Link href="/forgot-password" className={styles.textLink}>
        Lost your password
      </Link>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const target = safeNext(next);
  useLeaveWhenSignedIn(target);
  const router = useRouter();
  const set = (key: keyof typeof values) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const result = await registerUser(parsed.data);
    if (result.ok) {
      notify("Your account has been created.");
      router.push(target);
    } else {
      setErrors(result.errors ?? {});
      setFormError(result.errors ? "" : result.message);
      setBusy(false);
    }
  }

  return (
    <form className={`${styles.form} ${styles.withTabs}`} onSubmit={submit} noValidate>
      {formError ? (
        <p role="alert" className={styles.alert} data-testid="form-error">
          {formError}
        </p>
      ) : null}
      <Field
        label="User name"
        name="username"
        value={values.username}
        onChange={set("username")}
        error={errors.username}
        autoComplete="username"
        required
      />
      <Field
        label="Email address"
        name="email"
        kind="email"
        value={values.email}
        onChange={set("email")}
        error={errors.email}
        autoComplete="email"
        required
      />
      <Field
        label="Password"
        name="password"
        kind="password"
        value={values.password}
        onChange={set("password")}
        error={errors.password}
        autoComplete="new-password"
        required
      />
      <p className={styles.note}>
        Your personal data will be used to support your experience throughout this website, to
        manage access to your account, and for other purposes described in our{" "}
        <Link href="/policy/privacy">Privacy policy</Link>.
      </p>
      <SubmitButton busy={busy}>Register</SubmitButton>
      <Link href="/login" className={styles.textLink}>
        Already have an account?
      </Link>
    </form>
  );
}

export function ForgotForm() {
  const [identifier, setIdentifier] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState("");
  const [link, setLink] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent("");
    setLink(null);
    const parsed = forgotSchema.safeParse({ identifier });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const result = requestPasswordReset(parsed.data.identifier);
    setSent(result.message);
    setLink(result.link);
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p className={styles.intro}>
        Lost your password? Please enter your username or email address. You will receive a link to
        create a new password via email.
      </p>
      {sent ? (
        <p role="status" className={styles.success} data-testid="forgot-sent">
          {sent}
        </p>
      ) : null}
      {link ? (
        <p className={styles.note} data-testid="demo-reset-link">
          Demo mode sends no email. <Link href={link}>Open your reset link</Link>.
        </p>
      ) : null}
      <Field
        label="User name/email"
        name="identifier"
        value={identifier}
        onChange={setIdentifier}
        error={errors.identifier}
        autoComplete="username"
        required
      />
      <SubmitButton busy={false}>Reset password</SubmitButton>
    </form>
  );
}

/** The reset page: the form when the link is valid, otherwise the "invalid or expired" notice. */
export function ResetPanel({ token }: { token: string | undefined }) {
  const valid = useResetTokenValid(token ?? "");
  const { hydrated } = useCurrentUser();
  if (!hydrated) return <div className={styles.form} aria-busy="true" />;
  if (valid && token) return <ResetForm token={token} />;
  return (
    <div className={styles.form}>
      <p role="alert" className={styles.alert} data-testid="reset-invalid">
        This reset link is invalid or has expired.
      </p>
      <Link href="/forgot-password" className={styles.textLink}>
        Request a new link
      </Link>
    </div>
  );
}

function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = resetSchema.safeParse({ token, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const result = await resetPassword(parsed.data.token, parsed.data.password);
    if (result.ok) {
      notify("Your password has been changed. Please log in.");
      router.push("/login");
      return;
    }
    setErrors(result.errors ?? {});
    if (!result.errors?.password) setFormError(result.message);
    setBusy(false);
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <p className={styles.intro}>Choose a new password for your account.</p>
      {formError ? (
        <p role="alert" className={styles.alert} data-testid="form-error">
          {formError}
        </p>
      ) : null}
      <Field
        label="New password"
        name="password"
        kind="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="new-password"
        required
      />
      <SubmitButton busy={busy}>Save password</SubmitButton>
    </form>
  );
}
