"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Checkbox } from "@/components/form/Checkbox";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/ui/Icon";
import { submitContact } from "@/lib/demo-store/forms";
import { fieldErrors, type FieldErrors } from "@/lib/validation/checkout";
import { CONTACT_TOPICS, contactSchema } from "@/lib/validation/contact";
import styles from "./ContactPage.module.css";

const PLACEHOLDER_TOPIC = "Chose a topic";
const BLANK = { name: "", email: "", topic: PLACEHOLDER_TOPIC, message: "" };

/** "Send us a message" (CNT-003, Figma 3:27323). Valid messages are stored for staff; nothing is emailed. */
export function ContactForm() {
  const [values, setValues] = useState(BLANK);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof BLANK) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSent("");
    const parsed = contactSchema.safeParse({
      ...values,
      topic: values.topic === PLACEHOLDER_TOPIC ? "" : values.topic,
      consent,
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const result = submitContact(parsed.data);
    setBusy(false);
    if (result.ok) {
      setSent(result.data.message);
      setValues(BLANK);
      setConsent(false);
    } else if (result.data.errors) {
      setErrors(result.data.errors);
    } else {
      setFormError(result.data.message ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate data-testid="contact-form">
      <h2>Send us a message</h2>
      <p className={styles.hint}>
        Fields marked <span aria-hidden="true">*</span>
        <span className={styles.srOnly}>with an asterisk</span> are required. It’s helps us answer
        faster.
      </p>
      {sent ? (
        <p role="status" className={styles.success} data-testid="contact-sent">
          {sent}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className={styles.alert} data-testid="form-error">
          {formError}
        </p>
      ) : null}
      <div className={styles.fields}>
        <Field
          label="Full name"
          name="name"
          value={values.name}
          onChange={set("name")}
          error={errors.name}
          autoComplete="name"
          required
        />
        <Field
          label="Enter email"
          name="email"
          kind="email"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
          required
        />
        <div className={styles.wide}>
          <Field
            label="Select option"
            name="topic"
            kind="select"
            options={[PLACEHOLDER_TOPIC, ...CONTACT_TOPICS]}
            value={values.topic}
            onChange={set("topic")}
            error={errors.topic}
            required
          />
        </div>
        <div className={styles.wide}>
          <Field
            label="Write your message"
            name="message"
            kind="textarea"
            height={166}
            value={values.message}
            onChange={set("message")}
            error={errors.message}
            placeholder="Tell what on you minds..."
            required
          />
        </div>
      </div>
      <div className={styles.consent}>
        <Checkbox name="consent" checked={consent} onChange={setConsent} error={errors.consent}>
          I agree to the <Link href="/policy/privacy">Privacy Policy</Link> of the website.
        </Checkbox>
      </div>
      <button type="submit" className={styles.send} disabled={busy} data-testid="send-message">
        <span>{busy ? "Sending…" : "Send message"}</span>
        <Icon name="arrow-up-right" size={18} />
      </button>
    </form>
  );
}
