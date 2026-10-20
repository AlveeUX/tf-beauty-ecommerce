"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { submitNewsletter } from "@/lib/demo-store/forms";
import styles from "./NewsletterPopup.module.css";

const KEY = "cosmia.newsletter-popup";
const SHOW_AFTER_MS = 6000;
/** After a dismissal the popup stays away this long; after a sign-up it never returns. */
const QUIET_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Pages where a popup would get in the way of a task in progress. */
const QUIET_PAGES = [
  "/checkout",
  "/cart",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

type Memory = { at: number; subscribed: boolean };

function readMemory(): Memory | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Memory) : null;
  } catch {
    return null;
  }
}

function remember(subscribed: boolean) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), subscribed }));
  } catch {
    // private mode: the popup may come back on the next visit, which is acceptable
  }
}

function suppressed(): boolean {
  const memory = readMemory();
  if (!memory) return false;
  return memory.subscribed || Date.now() - memory.at < QUIET_MS;
}

/**
 * Welcome popup "Join Today and Enjoy 20% Off Everything" (Figma 3:2009, NWS-002). Appears once the visitor
 * has been on a page for a few seconds, unless they closed it in the last week or already subscribed.
 * The welcome offer itself is a manual code staff manage later (OQ-23), so nothing here promises a code.
 */
export function NewsletterPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const quiet = QUIET_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (quiet || open || suppressed()) return;
    const timer = window.setTimeout(() => {
      if (suppressed()) return;
      opener.current = document.activeElement;
      setOpen(true);
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [quiet, open, pathname]);

  const close = useCallback(() => {
    setOpen(false);
    remember(done);
    if (opener.current instanceof HTMLElement) opener.current.focus();
  }, [done]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLInputElement>("input")?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>("button:not([disabled]), input, a[href]"),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setBusy(true);
    const result = submitNewsletter({
      email: email.trim(),
      source: "popup",
      consent: true,
    });
    setBusy(false);
    if (result.ok) {
      setDone(true);
      remember(true);
    } else {
      setError(result.data.errors?.email ?? result.data.message ?? "Something went wrong.");
    }
  }

  if (!open) return null;
  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-popup-title"
        data-testid="newsletter-popup"
      >
        <div className={styles.image}>
          <Image src="/images/newsletter/popup.jpg" alt="" fill sizes="420px" />
        </div>
        <button type="button" className={styles.close} onClick={close} aria-label="Close">
          <Icon name="x" size={20} />
        </button>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Glow For Less</p>
          <h2 id="newsletter-popup-title" className={styles.title}>
            Join Today and Enjoy <span>20% Off</span> Everything.
          </h2>
          {done ? (
            <p className={styles.thanks} role="status" data-testid="popup-thanks">
              Thank you for subscribing. We will send your welcome offer by email.
            </p>
          ) : (
            <form onSubmit={submit} noValidate>
              <label className="visually-hidden" htmlFor="popup-email">
                Email address
              </label>
              <input
                id="popup-email"
                type="email"
                className={styles.input}
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby="popup-error"
                data-testid="popup-email"
              />
              <button
                type="submit"
                className={styles.submit}
                disabled={busy}
                data-testid="popup-submit"
              >
                <span>Subscribe</span>
                <Icon name="bell" size={16} />
              </button>
              <p id="popup-error" role="alert" className={styles.error}>
                {error}
              </p>
            </form>
          )}
          <p className={styles.note}>
            *Receive curated updates, exclusive discounts, and new product announcements to your
            inbox.
          </p>
        </div>
      </div>
    </div>
  );
}
