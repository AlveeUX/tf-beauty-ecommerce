"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { submitNewsletter } from "@/lib/demo-store/forms";
import styles from "./NewsletterForm.module.css";

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "success" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Footer newsletter form (Figma 3:5916). Validates, then stores the address with its consent (NWS-001).
 */
export function NewsletterForm({ tone = "default" }: { tone?: "default" | "dark" }) {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus({ kind: "error", message: "Please enter a valid email address." });
    } else if (!agreed) {
      setStatus({ kind: "error", message: "Please accept the terms to subscribe." });
    } else {
      const result = submitNewsletter({
        email: email.trim(),
        source: "footer",
        consent: true,
      });
      if (result.ok) {
        setStatus({ kind: "success" });
        setEmail("");
        setAgreed(false);
      } else {
        setStatus({
          kind: "error",
          message: result.data.message ?? "Something went wrong. Please try again.",
        });
      }
    }
  }

  return (
    <form
      className={`${styles.form} ${tone === "dark" ? styles.dark : ""}`}
      onSubmit={onSubmit}
      noValidate
    >
      <div className={styles.field}>
        <label className="visually-hidden" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={status.kind === "error"}
          aria-describedby="newsletter-status"
        />
        <button type="submit" className={styles.submit}>
          <span>Subscribe</span>
          <Icon name="bell" size={16} />
        </button>
      </div>

      <label className={styles.agree}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span className={styles.box} aria-hidden="true">
          <Icon name="check" size={12} strokeWidth={2.5} />
        </span>
        <span>
          Agree to our <Link href="/policy/terms">Terms &amp; Condition?</Link>
        </span>
      </label>

      <p
        id="newsletter-status"
        role={status.kind === "error" ? "alert" : "status"}
        className={status.kind === "error" ? styles.error : styles.success}
      >
        {status.kind === "error" ? status.message : null}
        {status.kind === "success" ? "Thanks for subscribing." : null}
      </p>
    </form>
  );
}
