import { z } from "zod";

/** Topics offered in the contact form's select ("Chose a topic", Figma 3:27358). The list is an Assumption. */
export const CONTACT_TOPICS = [
  "Order support",
  "Product advice",
  "Returns and exchanges",
  "Wholesale and stockists",
  "Press",
  "Something else",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(120, "That name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address.")
    .max(200)
    .email("Enter a valid email address."),
  topic: z.enum(CONTACT_TOPICS, { error: "Choose a topic." }),
  message: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters.")
    .max(4000, "Keep the message under 4000 characters."),
  consent: z.literal(true, { error: "You must agree to the privacy policy." }),
});
