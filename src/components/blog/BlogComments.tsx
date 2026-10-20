"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/ui/Icon";
import { submitComment } from "@/lib/demo-store/forms";
import { commentDate, type BlogComment } from "@/lib/blog";
import { fieldErrors, type FieldErrors } from "@/lib/validation/checkout";
import { commentSchema } from "@/lib/validation/blog";
import styles from "./BlogDetail.module.css";

const BLANK = { name: "", email: "", website: "", body: "" };

function Entry({
  comment,
  onReply,
}: {
  comment: BlogComment;
  onReply: (comment: BlogComment) => void;
}) {
  return (
    <div className={styles.comment} data-testid="blog-comment">
      <div className={styles.avatar}>
        {comment.avatar ? (
          <Image src={comment.avatar} alt="" width={60} height={60} />
        ) : (
          <span aria-hidden="true">{comment.name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div>
        <p className={styles.who}>{comment.name}</p>
        <p className={styles.when}>{commentDate(comment.createdAt)}</p>
        <p className={styles.said}>{comment.body}</p>
        <button type="button" className={styles.reply} onClick={() => onReply(comment)}>
          Reply
        </button>
      </div>
    </div>
  );
}

/** Comment threads and the "Leave a Comment" form (Figma 3:26910, 3:26947). New comments wait for approval. */
export function BlogComments({ slug, comments }: { slug: string; comments: BlogComment[] }) {
  const [values, setValues] = useState(BLANK);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<BlogComment | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (key: keyof typeof BLANK) => (value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const top = comments.filter((c) => c.parentId === null);
  // a reply to a reply is shown under the same thread, in order
  const repliesOf = (id: number) => comments.filter((c) => c.parentId === id);

  function reply(comment: BlogComment) {
    setReplyTo(comment);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    formRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSent("");
    const parsed = commentSchema.safeParse({ ...values, parentId: replyTo?.id ?? null });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setBusy(true);
    const result = submitComment(slug, parsed.data);
    setBusy(false);
    if (result.ok) {
      setSent(result.data.message);
      setValues(BLANK);
      setReplyTo(null);
    } else if (result.data.errors) {
      setErrors(result.data.errors);
    } else {
      setFormError(result.data.message ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <div className={styles.threads}>
        {top.map((comment) => (
          <div key={comment.id} className={styles.thread}>
            <Entry comment={comment} onReply={reply} />
            {repliesOf(comment.id).map((child) => (
              <div key={child.id} className={styles.replyBlock}>
                <Entry comment={child} onReply={() => reply(comment)} />
              </div>
            ))}
          </div>
        ))}
        {top.length === 0 ? (
          <p className={styles.noComments}>No comments yet. Be the first to share a thought.</p>
        ) : null}
      </div>

      <h2 className={`${styles.heading} ${styles.leave}`}>Leave a Comment</h2>
      <form
        ref={formRef}
        className={styles.form}
        onSubmit={submit}
        noValidate
        data-testid="comment-form"
      >
        {replyTo ? (
          <p className={styles.replying} data-testid="replying-to">
            Replying to {replyTo.name}.{" "}
            <button type="button" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </p>
        ) : null}
        {sent ? (
          <p className={styles.sent} role="status" data-testid="comment-sent">
            {sent}
          </p>
        ) : null}
        {formError ? (
          <p className={styles.alert} role="alert">
            {formError}
          </p>
        ) : null}
        <Field
          kind="textarea"
          height={160}
          label="Write your comment"
          name="body"
          value={values.body}
          onChange={set("body")}
          error={errors.body}
          required
        />
        <div className={styles.fields}>
          <Field
            label="Full name"
            name="name"
            value={values.name}
            onChange={set("name")}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Field
            kind="email"
            label="Enter email"
            name="email"
            value={values.email}
            onChange={set("email")}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Field
            label="Website"
            name="website"
            value={values.website}
            onChange={set("website")}
            error={errors.website}
            autoComplete="url"
            optional
          />
        </div>
        <button
          type="submit"
          className={styles.submit}
          disabled={busy}
          data-testid="submit-comment"
        >
          <span>{busy ? "Sending" : "Submit now"}</span>
          <Icon name="arrow-up-right" size={18} />
        </button>
      </form>
    </>
  );
}
