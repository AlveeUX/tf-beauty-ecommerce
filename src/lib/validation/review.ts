import { z } from "zod";

/** Input of the "Share your experience" form (PRD-006). Every field is required. */
export const reviewInputSchema = z.object({
  headline: z.string().trim().min(3, "Please add a headline (3+ characters).").max(120),
  rating: z.number().int().min(1, "Please choose a rating.").max(5),
  comment: z.string().trim().min(10, "Please write at least 10 characters.").max(2000),
  recommend: z.boolean(),
  name: z.string().trim().min(2, "Please enter your name.").max(60),
  email: z.string().trim().toLowerCase().email("Please enter a valid email.").max(120),
});
