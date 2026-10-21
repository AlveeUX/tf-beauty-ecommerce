"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import styles from "./Field.module.css";

type Base = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  /** Shows "(optional)" after the label (checkout, Figma 3:22404). */
  optional?: boolean;
  /** Keep the label for screen readers only (the second street-address line). */
  hideLabel?: boolean;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  /** Content shown under the control, e.g. a hint. */
  children?: ReactNode;
};

type InputProps = Base & { kind?: "text" | "email" | "password" | "tel" };
type SelectProps = Base & { kind: "select"; options: readonly string[] };
type AreaProps = Base & { kind: "textarea"; rows?: number; height?: number };

/**
 * Labelled form control in the design's style (Figma 3:22853, 3:22373): 15px label with a red asterisk,
 * 52px bordered control, error text under it. Passwords get a show/hide button (Figma "eye-off").
 */
export function Field(props: InputProps | SelectProps | AreaProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const { label, name, value, onChange, error, required, optional, placeholder, autoComplete } =
    props;
  const errorId = `${id}-error`;
  const common = {
    id,
    name,
    value,
    disabled: props.disabled,
    placeholder,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-required": required || undefined,
    "aria-describedby": error ? errorId : undefined,
    "data-testid": `field-${name}`,
  } as const;

  let control: ReactNode;
  if (props.kind === "select") {
    control = (
      <div className={styles.selectWrap}>
        <select {...common} onChange={(e) => onChange(e.target.value)} className={styles.control}>
          {props.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={14} />
      </div>
    );
  } else if (props.kind === "textarea") {
    control = (
      <textarea
        {...common}
        rows={props.rows ?? 6}
        style={props.height ? { height: props.height } : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.control} ${styles.area}`}
      />
    );
  } else {
    const type = props.kind === "password" ? (shown ? "text" : "password") : (props.kind ?? "text");
    control = (
      <div className={styles.inputWrap}>
        <input
          {...common}
          type={type}
          onChange={(e) => onChange(e.target.value)}
          className={styles.control}
        />
        {props.kind === "password" ? (
          <button
            type="button"
            className={styles.eye}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            onClick={() => setShown((v) => !v)}
          >
            <Icon name={shown ? "eye" : "eye-off"} size={16} />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={`${styles.label} ${props.hideLabel ? styles.srOnly : ""}`}>
        <span className={styles.labelText}>
          {label}
          {required ? (
            <>
              {" "}
              <span className={styles.star} aria-hidden="true">
                *
              </span>
            </>
          ) : null}
          {optional ? <span className={styles.optional}> (optional)</span> : null}
        </span>
      </label>
      {control}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className={`${styles.error} m-slide-down`}
          data-testid={`error-${name}`}
        >
          {error}
        </p>
      ) : null}
      {props.children}
    </div>
  );
}
