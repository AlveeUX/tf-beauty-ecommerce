"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { submitNewsletter } from "@/lib/demo-store/forms";
import styles from "./HomeChrome.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Home footer newsletter field (Figma 3:3246): a dashed input with the Subscribe button inside it.
 * Validates, then stores the address (NWS-001). The design has no consent checkbox here (D-035); one was
 * added under the field, as best practice for newsletter consent, at the client's request (D-044).
 */
export function HomeNewsletter() {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "consent" | "success">("idle");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus("error");
      return;
    }
    if (!agreed) {
      setStatus("consent");
      return;
    }
    const result = submitNewsletter({
      email: email.trim(),
      source: "home-footer",
      consent: true,
    });
    setStatus(result.ok ? "success" : "error");
    if (result.ok) {
      setEmail("");
      setAgreed(false);
    }
  }

  return (
    <form className={styles.nlForm} onSubmit={onSubmit} noValidate>
      <label className="visually-hidden" htmlFor="home-newsletter-email">
        Email address
      </label>
      <input
        id="home-newsletter-email"
        className="m-field"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={status === "error"}
        aria-describedby="home-newsletter-status"
      />
      <button type="submit">
        <span>Subscribe</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/home/footer/bell.svg" alt="" width={16} height={16} />
      </button>
      <label className={styles.nlAgree}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          Agree to our <Link href="/policy/terms">Terms &amp; Condition?</Link>
        </span>
      </label>
      <p
        id="home-newsletter-status"
        className={styles.nlStatus}
        data-state={status}
        role={status === "error" || status === "consent" ? "alert" : "status"}
      >
        {status === "error" ? "Please enter a valid email address." : null}
        {status === "consent" ? "Please accept the terms to subscribe." : null}
        {status === "success" ? "Thanks! You are subscribed." : null}
      </p>
    </form>
  );
}
