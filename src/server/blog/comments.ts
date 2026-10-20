import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { blogComments } from "@/db/schema";
import type { CommentInput } from "@/lib/validation/blog";
import { hit } from "@/server/security/rate-limit";
import { postIdFor } from "./queries";

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export type CommentResult =
  | { ok: true; id: number }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "bad_parent" }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number };

/** Store a reader comment as pending; staff approve it before it appears (BLG-004). */
export function addComment(
  db: Db,
  slug: string,
  input: CommentInput,
  clientKey: string,
  now = Date.now(),
): CommentResult {
  const postId = postIdFor(slug);
  if (postId === null) return { ok: false, reason: "not_found" };
  if (input.parentId !== null) {
    const parent = db
      .select({ id: blogComments.id })
      .from(blogComments)
      .where(
        and(
          eq(blogComments.id, input.parentId),
          eq(blogComments.postId, postId),
          eq(blogComments.status, "approved"),
        ),
      )
      .get();
    if (!parent) return { ok: false, reason: "bad_parent" };
  }
  const byClient = hit(db, `comment:ip:${clientKey}`, LIMIT, WINDOW_MS, now);
  const byEmail = hit(db, `comment:email:${input.email}`, LIMIT, WINDOW_MS, now);
  if (!byClient.allowed || !byEmail.allowed) {
    return {
      ok: false,
      reason: "rate_limited",
      retryAfterSeconds: Math.ceil(Math.max(byClient.retryAfterMs, byEmail.retryAfterMs) / 1000),
    };
  }
  const row = db
    .insert(blogComments)
    .values({
      postId,
      parentId: input.parentId,
      name: input.name,
      email: input.email,
      website: input.website || null,
      body: input.body,
    })
    .returning({ id: blogComments.id })
    .get();
  return { ok: true, id: row.id };
}
