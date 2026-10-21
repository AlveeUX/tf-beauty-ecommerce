import { z } from "zod";

/**
 * Structured long-form product content shown under "Inside the formula" and
 * "Formulated for renewal" (Figma 3:13084, 3:13279). Authored per product in src/data/products.json.
 * Stored as JSON on products.content and validated on read, so malformed data hides the
 * sections instead of breaking the page.
 */
const CONTENT_ICONS = [
  "rotate",
  "ban",
  "calendar",
  "sun",
  "droplet",
  "brush",
  "flask",
  "badge-check",
] as const;

const productContentSchema = z.object({
  formula: z
    .object({
      title: z.string(),
      intro: z.string(),
      items: z
        .array(z.object({ icon: z.enum(CONTENT_ICONS), title: z.string(), text: z.string() }))
        .max(8),
    })
    .optional(),
  usage: z
    .object({
      title: z.string(),
      intro: z.string(),
      prepTitle: z.string(),
      prep: z.array(z.string()),
      finishTitle: z.string(),
      finish: z.array(z.string()),
    })
    .optional(),
  ingredients: z.object({ title: z.string(), freeOf: z.string(), inci: z.string() }).optional(),
  clinical: z
    .object({
      title: z.string(),
      stats: z.array(z.object({ value: z.string(), label: z.string(), text: z.string() })).max(6),
    })
    .optional(),
  highlights: z
    .object({
      title: z.string(),
      items: z
        .array(
          z.object({ eyebrow: z.string(), title: z.string(), text: z.string(), image: z.string() }),
        )
        .max(6),
    })
    .optional(),
});

export type ProductContent = z.infer<typeof productContentSchema>;

export function parseProductContent(raw: string | null): ProductContent | null {
  if (!raw) return null;
  try {
    const result = productContentSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
