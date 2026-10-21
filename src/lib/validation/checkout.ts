import { z } from "zod";
import { PAYMENT_METHODS } from "@/config/order-constants";
import { SHIPPING_COUNTRIES } from "@/config/store";

/** Trimmed, non-empty text with a length cap. */
const required = (label: string, max = 120) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);

const optional = (max = 120) =>
  z
    .string()
    .trim()
    .max(max, "This is too long.")
    .optional()
    .transform((v) => (v ? v : undefined));

/** Billing details form (CHK-001). Shared by the checkout page and the order API. */
const billingSchema = z.object({
  firstName: required("First name"),
  lastName: required("Last name"),
  company: optional(),
  country: z.enum(SHIPPING_COUNTRIES, { error: "Choose a country or region." }),
  address1: required("Street address", 200),
  address2: optional(200),
  city: required("Town / City"),
  postcode: required("Postcode", 20),
  phone: required("Phone", 30).regex(/^[0-9+()\-.\s]{6,30}$/, "Enter a valid phone number."),
  email: z
    .string({ error: "Email is required." })
    .trim()
    .toLowerCase()
    .min(1, "Email is required.")
    .max(200)
    .email("Enter a valid email address."),
  notes: optional(1000),
});

export type BillingInput = z.infer<typeof billingSchema>;

/** A saved address: the billing form without the email and order notes (USR-004). */
export const addressSchema = billingSchema.omit({ email: true, notes: true });

export const checkoutSchema = billingSchema.extend({
  paymentMethod: z.enum(PAYMENT_METHODS, { error: "Choose a payment method." }),
  acceptTerms: z.literal(true, { error: "You must agree to the terms and conditions." }),
  /** One key per checkout screen visit, so a double click cannot create two orders (CHK-006). */
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, "Invalid request."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type FieldErrors = Record<string, string>;

/** First message per field, keyed by field name. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
