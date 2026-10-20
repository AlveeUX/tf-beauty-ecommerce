import type { ApiResult } from "@/lib/api";
import { commentSchema } from "@/lib/validation/blog";
import { fieldErrors } from "@/lib/validation/checkout";
import { contactSchema } from "@/lib/validation/contact";
import { newsletterSchema } from "@/lib/validation/newsletter";
import { reviewInputSchema } from "@/lib/validation/review";
import { readStore, writeStore } from "./storage";

/**
 * The storefront forms that would normally post to a server: newsletter, contact, reader comments and
 * product reviews. In the template they validate with the same schemas, keep the entry in this browser
 * (`cosmia.demo.*`) and answer like the server did, so the page behaves as it would when live. Replace
 * these functions with calls to your own API to go live.
 */
type Message = { message: string };

const invalid = (error: Parameters<typeof fieldErrors>[0]): ApiResult<never> => ({
  ok: false,
  status: 422,
  data: { code: "validation_failed", errors: fieldErrors(error) },
});

const created = (message: string): ApiResult<Message> => ({
  ok: true,
  status: 201,
  data: { message },
});

function append<T>(key: string, entry: T): void {
  writeStore(key, [...readStore<T[]>(key, []), entry]);
}

const now = () => new Date().toISOString();

export function submitNewsletter(input: unknown): ApiResult<Message> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const known = readStore<{ email: string }[]>("subscribers", []);
  // an address that is already on the list gets the same answer as a new one
  if (!known.some((s) => s.email === parsed.data.email)) {
    append("subscribers", { email: parsed.data.email, source: parsed.data.source, at: now() });
  }
  return created("Thanks for subscribing.");
}

export function submitContact(input: unknown): ApiResult<Message> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { name, email, topic, message } = parsed.data;
  append("contact-messages", { name, email, topic, message, at: now() });
  return created("Thank you. We have your message and will reply by email.");
}

export function submitComment(slug: string, input: unknown): ApiResult<Message> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { name, email, body, parentId } = parsed.data;
  append("blog-comments", { slug, name, email, body, parentId, status: "pending", at: now() });
  return created("Thank you. Your comment will appear once our team has approved it.");
}

export function submitReview(slug: string, input: unknown): ApiResult<Message> {
  const parsed = reviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      data: {
        code: "validation_failed",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      },
    };
  }
  const { headline, rating, comment, recommend, name, email } = parsed.data;
  const known = readStore<{ slug: string; email: string }[]>("reviews", []);
  // one review per email per product
  if (known.some((r) => r.slug === slug && r.email === email)) {
    return {
      ok: false,
      status: 409,
      data: { code: "duplicate_review", message: "You have already reviewed this product." },
    };
  }
  append("reviews", {
    slug,
    headline,
    rating,
    comment,
    recommend,
    name,
    email,
    status: "pending",
    at: now(),
  });
  return created("Thanks! Your review will appear once approved.");
}
