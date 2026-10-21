"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/form/Field";
import { SHIPPING_COUNTRIES } from "@/config/store";
import {
  addAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
  useAddresses,
  useCurrentUser,
  type AddressView,
} from "@/lib/demo-store/account";
import { addressSchema, fieldErrors, type FieldErrors } from "@/lib/validation/checkout";
import styles from "./Account.module.css";

const BLANK = {
  firstName: "",
  lastName: "",
  company: "",
  country: SHIPPING_COUNTRIES[0] as string,
  address1: "",
  address2: "",
  city: "",
  postcode: "",
  phone: "",
};

type Draft = typeof BLANK;

/** Saved addresses (USR-004): add, edit, delete, choose the default that checkout pre-fills. */
export function AddressesManager() {
  const { user } = useCurrentUser();
  const items = useAddresses(user?.id ?? null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");

  const set = (name: keyof Draft) => (value: string) => setDraft((d) => ({ ...d, [name]: value }));

  function open(address?: AddressView) {
    setErrors({});
    setMessage("");
    setDraft(
      address
        ? {
            firstName: address.firstName,
            lastName: address.lastName,
            company: address.company ?? "",
            country: address.country,
            address1: address.address1,
            address2: address.address2 ?? "",
            city: address.city,
            postcode: address.postcode,
            phone: address.phone,
          }
        : BLANK,
    );
    setEditing(address ? address.id : "new");
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    const parsed = addressSchema.safeParse(draft);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const result =
      editing === "new"
        ? addAddress(user.id, parsed.data)
        : updateAddress(user.id, Number(editing), parsed.data);
    if (!result.ok) return setMessage(result.message);
    setEditing(null);
    setMessage("Address saved.");
  }

  function makeDefault(id: number) {
    if (user) setDefaultAddress(user.id, id);
  }

  function remove(id: number) {
    if (!user) return;
    deleteAddress(user.id, id);
    setMessage("Address deleted.");
  }

  return (
    <div className={styles.card} data-testid="addresses" data-reveal="fade-up">
      <h2>Addresses</h2>
      {message ? (
        <p
          role="status"
          className={`${styles.statusNote} m-slide-down`}
          data-testid="address-message"
        >
          {message}
        </p>
      ) : null}
      {items.length === 0 && editing === null ? (
        <p data-testid="addresses-empty">You have not saved an address yet.</p>
      ) : (
        <ul className={styles.addressGrid}>
          {items.map((a) => (
            <li key={a.id} className={styles.address} data-testid="address-card">
              {a.isDefault ? <span className={styles.badge}>Default</span> : null}
              <address>
                {a.firstName} {a.lastName}
                <br />
                {a.address1}
                {a.address2 ? `, ${a.address2}` : ""}
                <br />
                {a.city}, {a.postcode}
                <br />
                {a.country}
                <br />
                {a.phone}
              </address>
              <div className={styles.rowActions}>
                <button type="button" onClick={() => open(a)}>
                  Edit
                </button>
                {!a.isDefault ? (
                  <button type="button" onClick={() => makeDefault(a.id)}>
                    Make default
                  </button>
                ) : null}
                <button type="button" onClick={() => remove(a.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing === null ? (
        <p className={styles.addRow}>
          <button
            type="button"
            className={styles.small}
            onClick={() => open()}
            data-testid="add-address"
          >
            Add address
          </button>
        </p>
      ) : (
        <form className={styles.formGrid} onSubmit={save} noValidate data-testid="address-form">
          <Field
            label="First name"
            name="firstName"
            value={draft.firstName}
            onChange={set("firstName")}
            error={errors.firstName}
            required
          />
          <Field
            label="Last name"
            name="lastName"
            value={draft.lastName}
            onChange={set("lastName")}
            error={errors.lastName}
            required
          />
          <div className={styles.wide}>
            <Field
              label="Company name"
              name="company"
              value={draft.company}
              onChange={set("company")}
              error={errors.company}
              optional
            />
          </div>
          <div className={styles.wide}>
            <Field
              label="Country / Region"
              name="country"
              kind="select"
              options={SHIPPING_COUNTRIES}
              value={draft.country}
              onChange={set("country")}
              error={errors.country}
              required
            />
          </div>
          <div className={styles.wide}>
            <Field
              label="Street address"
              name="address1"
              value={draft.address1}
              onChange={set("address1")}
              error={errors.address1}
              required
            />
          </div>
          <div className={styles.wide}>
            <Field
              label="Apartment, suite, unit"
              name="address2"
              value={draft.address2}
              onChange={set("address2")}
              error={errors.address2}
              optional
            />
          </div>
          <Field
            label="Town / City"
            name="city"
            value={draft.city}
            onChange={set("city")}
            error={errors.city}
            required
          />
          <Field
            label="Postcode"
            name="postcode"
            value={draft.postcode}
            onChange={set("postcode")}
            error={errors.postcode}
            required
          />
          <div className={styles.wide}>
            <Field
              label="Phone"
              name="phone"
              kind="tel"
              value={draft.phone}
              onChange={set("phone")}
              error={errors.phone}
              required
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.small} data-testid="save-address">
              Save address
            </button>
            <button type="button" className={styles.ghost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
