import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "../../src/db/client";
import { runMigrations } from "../../src/db/migrate";
import { seedCatalog } from "../../src/db/seed";
import { BLOG_PAGE_SIZE, parseBlogLayout } from "../../src/lib/blog";
import { commentSchema } from "../../src/lib/validation/blog";
import { addComment } from "../../src/server/blog/comments";
import {
  approvedComments,
  getPost,
  listPosts,
  neighbours,
  postIdFor,
  sidebarData,
} from "../../src/server/blog/queries";

let db: Db;
beforeAll(() => {
  db = createDb(":memory:").db;
  runMigrations(db);
  seedCatalog(db);
});

const input = (over: Partial<Parameters<typeof addComment>[2]> = {}) =>
  commentSchema.parse({ name: "Ana", email: "ana@example.com", body: "Lovely article!", ...over });

describe("blog queries (BLG-001..003)", () => {
  it("seeds the 12 design posts in list order and pages them", () => {
    const first = listPosts({}, 1, 12);
    expect(first.total).toBe(12);
    expect(first.pages).toBe(1);
    expect(first.posts[0]!.slug).toBe("inside-the-formula-behind-beautiful-skin");
    const sixPerPage = listPosts({}, 2, BLOG_PAGE_SIZE.list);
    expect(sixPerPage.pages).toBe(2);
    expect(sixPerPage.posts).toHaveLength(6);
    // a page past the end falls back to the last one
    expect(listPosts({}, 99, 6).page).toBe(2);
  });

  it("filters by category, tag and search text", () => {
    expect(listPosts({ category: "science" }, 1, 12).total).toBe(1);
    expect(listPosts({ tag: "Evening" }, 1, 12).total).toBe(2);
    expect(listPosts({ q: "makeup" }, 1, 12).posts[0]!.category).toBe("Makeup");
    expect(listPosts({ q: "zzzz" }, 1, 12).total).toBe(0);
    // wildcard characters are literal
    expect(listPosts({ q: "%" }, 1, 12).total).toBe(12);
  });

  it("builds the sidebar and finds a post with neighbours that wrap around", () => {
    const side = sidebarData("inside-the-formula-behind-beautiful-skin");
    expect(side.categories).toHaveLength(6);
    expect(side.recent).toHaveLength(3);
    expect(side.recent.map((p) => p.slug)).not.toContain(
      "inside-the-formula-behind-beautiful-skin",
    );
    expect(side.tags.length).toBeGreaterThan(0);
    const post = getPost("inside-the-formula-behind-beautiful-skin");
    expect(post?.blocks.some((b) => b.type === "quote")).toBe(true);
    expect(getPost("nope")).toBeNull();
    const around = neighbours("inside-the-formula-behind-beautiful-skin");
    expect(around.next?.slug).toBe("skin-simplified-for-smarter-skincare-routine");
    expect(around.previous?.slug).toBe("how-to-create-a-skincare-routine-that-works");
  });

  it("ignores unknown layouts", () => {
    expect(parseBlogLayout("list")).toBe("list");
    expect(parseBlogLayout("zzz")).toBe("grid");
    expect(parseBlogLayout(undefined)).toBe("grid");
  });
});

describe("blog comments (BLG-004)", () => {
  const slug = "inside-the-formula-behind-beautiful-skin";

  it("shows the three approved seed comments with one reply", () => {
    const comments = approvedComments(postIdFor(slug)!);
    expect(comments).toHaveLength(3);
    expect(comments.filter((c) => c.parentId === null)).toHaveLength(2);
  });

  it("stores new comments as pending, so they do not show until approved", () => {
    const result = addComment(db, slug, input(), "ip-a");
    expect(result.ok).toBe(true);
    expect(approvedComments(postIdFor(slug)!)).toHaveLength(3);
  });

  it("rejects unknown posts and replies to comments that are not visible", () => {
    expect(addComment(db, "nope", input(), "ip-b")).toEqual({ ok: false, reason: "not_found" });
    expect(addComment(db, slug, input({ parentId: 99999 }), "ip-b")).toEqual({
      ok: false,
      reason: "bad_parent",
    });
  });

  it("validates fields and limits sending per client", () => {
    expect(commentSchema.safeParse({ name: "", email: "x", body: "hi" }).success).toBe(false);
    expect(input({ website: "" }).website).toBe("");
    expect(commentSchema.safeParse({ ...input(), website: "javascript:alert(1)" }).success).toBe(
      false,
    );
    const results = Array.from({ length: 6 }, (_, i) =>
      addComment(db, slug, input({ email: `u${i}@example.com` }), "ip-flood", 1_000),
    );
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5]).toMatchObject({ ok: false, reason: "rate_limited" });
  });
});
