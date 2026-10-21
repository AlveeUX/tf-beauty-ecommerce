"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { submitReview } from "@/lib/demo-store/forms";
import styles from "./ReviewForm.module.css";

type FieldErrors = Partial<Record<"headline" | "rating" | "comment" | "name" | "email", string>>;
type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const STORAGE_KEY = "cosmia:review-identity";

type Identity = { name?: string; email?: string };

/** Reads the identity the visitor chose to save in this browser; null on the server or when storage is blocked. */
function readIdentity(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
const subscribeIdentity = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};

/** "Share Your Experience" form (PRD-006). Submissions are stored as pending until approved. */
export function ReviewForm({ slug }: { slug: string }) {
  const [headline, setHeadline] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState(true);
  // null = untouched, so the saved identity (if any) shows until the visitor types.
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const savedRaw = useSyncExternalStore(subscribeIdentity, readIdentity, () => null);
  const saved: Identity = (() => {
    try {
      return savedRaw ? (JSON.parse(savedRaw) as Identity) : {};
    } catch {
      return {};
    }
  })();
  const name = nameInput ?? saved.name ?? "";
  const email = emailInput ?? saved.email ?? "";
  const setName = setNameInput;
  const setEmail = setEmailInput;
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (headline.trim().length < 3) next.headline = "Please add a headline (3+ characters).";
    if (rating < 1) next.rating = "Please choose a rating.";
    if (comment.trim().length < 10) next.comment = "Please write at least 10 characters.";
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Please enter a valid email.";
    return next;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (status.kind === "submitting") return; // ignore double submits
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus({ kind: "submitting" });
    const res = submitReview(slug, { headline, rating, comment, recommend, name, email });
    if (res.ok) {
      try {
        if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email }));
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
      setStatus({
        kind: "success",
        message: res.data.message ?? "Thanks! Your review is pending approval.",
      });
      setHeadline("");
      setRating(0);
      setComment("");
      return;
    }
    if (res.data.errors) {
      const mapped: FieldErrors = {};
      for (const key of ["headline", "rating", "comment", "name", "email"] as const) {
        const message = res.data.errors[key];
        if (message) mapped[key] = message;
      }
      setErrors(mapped);
    }
    setStatus({
      kind: "error",
      message: res.data.message ?? "Something went wrong. Please try again.",
    });
  }

  function cancel() {
    setHeadline("");
    setRating(0);
    setComment("");
    setErrors({});
    setStatus({ kind: "idle" });
  }

  const submitting = status.kind === "submitting";

  return (
    <form id="write-review" className={styles.form} onSubmit={onSubmit} noValidate>
      <h3>Share Your Experience</h3>
      <p className={styles.note}>
        Your email address will not be published. Required fields are marked <span>*</span>
      </p>

      <Field label="Review headline" error={errors.headline} htmlFor="review-headline">
        <input
          id="review-headline"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="I would buy this product again and again…"
          maxLength={120}
          aria-invalid={Boolean(errors.headline)}
        />
      </Field>

      <fieldset className={styles.field}>
        <legend>
          Your rating<span>*</span>
        </legend>
        <div className={styles.rate} role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
            >
              <Icon name="star" size={26} filled={n <= rating} strokeWidth={1.3} />
            </button>
          ))}
        </div>
        {errors.rating ? <p className={styles.error}>{errors.rating}</p> : null}
      </fieldset>

      <Field label="Comments" error={errors.comment} htmlFor="review-comment">
        <textarea
          id="review-comment"
          rows={5}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How you use this product and what is the experiences…"
          maxLength={2000}
          aria-invalid={Boolean(errors.comment)}
        />
      </Field>

      <div className={styles.recommend}>
        <p>
          <Icon name="thumbs-up" size={18} />
          Would you recommend this product to a friend? *
        </p>
        <div>
          <label>
            <input
              type="radio"
              name="recommend"
              checked={recommend}
              onChange={() => setRecommend(true)}
            />
            <span aria-hidden="true" /> Yes
          </label>
          <label>
            <input
              type="radio"
              name="recommend"
              checked={!recommend}
              onChange={() => setRecommend(false)}
            />
            <span aria-hidden="true" /> No
          </label>
        </div>
      </div>

      <div className={styles.two}>
        <Field label="Enter name" error={errors.name} htmlFor="review-name">
          <input
            id="review-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name…"
            autoComplete="name"
            maxLength={60}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>
        <Field label="Enter email" error={errors.email} htmlFor="review-email">
          <input
            id="review-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email.."
            autoComplete="email"
            maxLength={120}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
      </div>

      <label className={styles.remember}>
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span className={styles.box} aria-hidden="true">
          <Icon name="check" size={12} strokeWidth={2.5} />
        </span>
        Save my name, email, and website in this browser for the next time I comment.
      </label>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submit}
          disabled={submitting}
          data-testid="submit-review"
        >
          {submitting ? "Submitting…" : "Submit review"}
          <Icon name="arrow-up-right" size={16} />
        </button>
        <button type="button" className={styles.cancel} onClick={cancel}>
          Cancel review
          <Icon name="arrow-up-right" size={16} />
        </button>
      </div>

      <p
        role={status.kind === "error" ? "alert" : "status"}
        className={status.kind === "error" ? styles.error : styles.success}
        data-testid="review-status"
      >
        {status.kind === "success" || status.kind === "error" ? status.message : null}
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor}>
        {label}
        <span>*</span>
      </label>
      {children}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
