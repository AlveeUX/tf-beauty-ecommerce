"use client";

import { useState } from "react";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { Checkbox } from "@/components/form/Checkbox";
import { Field } from "@/components/form/Field";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { notify } from "@/lib/notify";
import styles from "./UiKit.module.css";

/** The parts of the UI kit that react to clicks and typing: form controls, stepper, modal and toasts. */
export function InteractiveDemos() {
  const [text, setText] = useState("");
  const [email, setEmail] = useState("not-an-email");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("Canada");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [quantity, setQuantity] = useState(2);
  const [modalOpen, setModalOpen] = useState(false);
  const [crash, setCrash] = useState(false);

  // Deliberate: shows the page-level error screen (src/app/(site)/error.tsx); "Try again" brings the page back.
  if (crash) throw new Error("UI kit error preview");

  return (
    <>
      <section className={styles.section} aria-labelledby="kit-forms">
        <h2 id="kit-forms">Form fields</h2>
        <p className={styles.note}>
          <code>Field</code> in <code>src/components/form</code>. One component for text, email,
          password (with show/hide), tel, select and textarea; <code>error</code> shows the message
          under the control.
        </p>
        <div className={styles.fields}>
          <Field
            label="Text"
            name="kit-text"
            value={text}
            onChange={setText}
            placeholder="Type here"
          />
          <Field
            label="Email with an error"
            name="kit-email"
            kind="email"
            value={email}
            onChange={setEmail}
            error="Enter a valid email address."
            required
          />
          <Field
            label="Password"
            name="kit-password"
            kind="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
          />
          <Field
            label="Country"
            name="kit-country"
            kind="select"
            options={["Canada", "Denmark", "France"]}
            value={country}
            onChange={setCountry}
          />
          <Field
            label="Optional note"
            name="kit-message"
            kind="textarea"
            optional
            value={message}
            onChange={setMessage}
          />
        </div>
        <Checkbox name="kit-agree" checked={agreed} onChange={setAgreed}>
          I have read and agree to the terms and conditions
        </Checkbox>
      </section>

      <section className={styles.section} aria-labelledby="kit-controls">
        <h2 id="kit-controls">Quantity, dialog and messages</h2>
        <div className={styles.row}>
          <QuantityStepper value={quantity} max={5} name="Sample product" onChange={setQuantity} />
          <Button
            variant="outline"
            type="button"
            onClick={() => setModalOpen(true)}
            data-testid="kit-open-modal"
          >
            Open dialog
          </Button>
          <Button
            variant="dark"
            type="button"
            onClick={() => notify("Saved to your wishlist.")}
            data-testid="kit-toast"
          >
            Show message
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => notify("Something went wrong. Please try again.", "error")}
          >
            Show error message
          </Button>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="kit-error">
        <h2 id="kit-error">Error screen</h2>
        <p className={styles.note}>
          What visitors see when a page fails to render (<code>src/app/(site)/error.tsx</code>). The
          button below makes this page fail on purpose; &ldquo;Try again&rdquo; brings it back.
        </p>
        <div className={styles.row}>
          <Button
            variant="outline"
            type="button"
            onClick={() => setCrash(true)}
            data-testid="kit-crash"
          >
            Show the error screen
          </Button>
        </div>
      </section>

      {modalOpen ? (
        <Modal
          titleId="kit-modal-title"
          width={440}
          onClose={() => setModalOpen(false)}
          testId="kit-modal"
        >
          <div className={styles.modalBody}>
            <h2 id="kit-modal-title">A dialog</h2>
            <p>
              <code>Modal</code> traps focus, closes with Escape or a click on the dark area, and
              returns focus to the button that opened it.
            </p>
            <Button type="button" data-autofocus onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
