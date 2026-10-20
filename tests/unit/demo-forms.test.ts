import { beforeEach, describe, expect, it } from "vitest";
import {
  submitComment,
  submitContact,
  submitNewsletter,
  submitReview,
} from "../../src/lib/demo-store/forms";
import { readStore } from "../../src/lib/demo-store/storage";
import { installBrowser } from "../helpers/browser-shim";

beforeEach(installBrowser);

const review = {
  headline: "Lovely texture",
  rating: 4,
  comment: "Lovely texture and a subtle finish, would buy again.",
  recommend: true,
  name: "Test Shopper",
  email: "Shopper@Example.com",
};

describe("submitReview", () => {
  it("keeps a valid review as pending and answers like the server did", () => {
    const result = submitReview("the-renewal-serum", review);
    expect(result).toMatchObject({ ok: true, status: 201, data: { message: expect.any(String) } });
    expect(readStore<unknown[]>("reviews", [])).toMatchObject([
      { slug: "the-renewal-serum", email: "shopper@example.com", status: "pending", rating: 4 },
    ]);
  });

  it("allows one review per email per product", () => {
    submitReview("the-renewal-serum", review);
    expect(submitReview("the-renewal-serum", review)).toMatchObject({ ok: false, status: 409 });
    expect(submitReview("facial-roller", review)).toMatchObject({ ok: true });
  });

  it("reports every invalid field and stores nothing", () => {
    const result = submitReview("the-renewal-serum", {
      ...review,
      rating: 9,
      email: "x",
      headline: "",
    });
    expect(result).toMatchObject({
      ok: false,
      status: 400,
      data: {
        errors: {
          rating: expect.any(String),
          email: expect.any(String),
          headline: expect.any(String),
        },
      },
    });
    expect(readStore("reviews", null)).toBeNull();
  });
});

describe("submitNewsletter", () => {
  it("requires consent and a valid address", () => {
    expect(
      submitNewsletter({ email: "a@example.com", source: "footer", consent: false }),
    ).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(submitNewsletter({ email: "nope", source: "footer", consent: true })).toMatchObject({
      ok: false,
    });
    expect(readStore("subscribers", null)).toBeNull();
  });

  it("keeps an address once, whatever its capitalisation, with the same answer each time", () => {
    const first = submitNewsletter({ email: "A@Example.com", source: "popup", consent: true });
    const again = submitNewsletter({ email: "a@example.com", source: "footer", consent: true });
    expect(first).toEqual(again);
    expect(readStore<unknown[]>("subscribers", [])).toMatchObject([
      { email: "a@example.com", source: "popup" },
    ]);
  });
});

describe("submitContact and submitComment", () => {
  it("validates and keeps a contact message", () => {
    expect(submitContact({ name: "", email: "x" })).toMatchObject({ ok: false, status: 422 });
    const ok = submitContact({
      name: "Ana Lopez",
      email: "ana@example.com",
      topic: "Product advice",
      message: "Which serum is best for dry skin in winter?",
      consent: true,
    });
    expect(ok.ok).toBe(true);
    expect(readStore<unknown[]>("contact-messages", [])).toMatchObject([
      { name: "Ana Lopez", topic: "Product advice" },
    ]);
  });

  it("keeps a comment as pending with its parent, and rejects empty ones", () => {
    expect(
      submitComment("some-post", { name: "", email: "", body: "", parentId: null }),
    ).toMatchObject({
      ok: false,
    });
    const ok = submitComment("some-post", {
      name: "Ana Lopez",
      email: "ana@example.com",
      body: "A very useful read, thank you.",
      parentId: 4,
    });
    expect(ok.ok).toBe(true);
    expect(readStore<unknown[]>("blog-comments", [])).toMatchObject([
      { slug: "some-post", status: "pending", parentId: 4 },
    ]);
  });
});
