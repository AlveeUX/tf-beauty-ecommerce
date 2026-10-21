import { z } from "zod";

export const commentSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(120, "That name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address.")
    .max(200)
    .email("Enter a valid email address."),
  website: z
    .string()
    .trim()
    .max(200, "That address is too long.")
    .refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter a full web address.")
    .optional()
    .default(""),
  body: z
    .string()
    .trim()
    .min(5, "Write at least 5 characters.")
    .max(2000, "Keep the comment under 2000 characters."),
  parentId: z.number().int().positive().nullable().optional().default(null),
});
