import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address.")
    .max(200)
    .email("Please enter a valid email address."),
  source: z.enum(["footer", "home-footer", "popup"]),
  /** The standard footer form has a checkbox; the other two show the consent text instead. */
  consent: z.literal(true, { error: "Please accept the terms to subscribe." }),
});
