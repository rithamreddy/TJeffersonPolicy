"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { NEWS_STATUSES, NEWS_VISIBILITIES } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils/format";

export interface NewsDraft {
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  status: string;
  visibility: string;
  tags: string;
}

export const emptyNewsDraft: NewsDraft = {
  title: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  status: "DRAFT",
  visibility: "PUBLIC",
  tags: "",
};

/** Where the post's email stands. Absent on a brand-new, unsaved post. */
export interface NewsEmailState {
  emailedAt: string | null;
  recipientCount: number | null;
  error: string | null;
  /** False when RESEND_API_KEY is not set on this deployment. */
  configured: boolean;
}

const MARKDOWN_HELP = [
  "# Heading   ## Smaller heading",
  "- bullet list      1. numbered list",
  "**bold**   *italic*   `code`",
  "[link text](https://example.com)",
  "> quoted line",
].join("\n");

export function NewsEditor({
  postId,
  initial,
  email,
}: {
  postId?: string;
  initial: NewsDraft;
  email?: NewsEmailState;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function set<K extends keyof NewsDraft>(key: K, value: NewsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  async function save(status?: string) {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setNotice(null);

    const payload = {
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      body: draft.body,
      imageUrl: draft.imageUrl.trim() || undefined,
      status: status ?? draft.status,
      visibility: draft.visibility,
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (postId) {
        const saved = await api.patch<{ email: string | null }>(`/api/admin/news/${postId}`, payload);
        setDraft((current) => ({ ...current, status: payload.status }));
        const where =
          payload.visibility === "MEMBERS" ? "It is live in the member portal." : "It is live on the public news page.";
        const base = payload.status === "PUBLISHED" ? `Published. ${where}` : "Saved as a draft.";
        setNotice(saved.email ? `${base} ${saved.email}` : base);
        router.refresh();
      } else {
        const created = await api.post<{ id: string }>("/api/admin/news", payload);
        router.push(`/admin/news/${created.id}`);
        router.refresh();
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        if (caught.fields) setFieldErrors(caught.fields);
      } else {
        setError("Could not save. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!postId) return;
    setBusy(true);
    try {
      await api.delete(`/api/admin/news/${postId}`);
      router.push("/admin/news");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="space-y-5"
      >
        {notice ? <Alert tone="good">{notice}</Alert> : null}
        {error ? (
          <Alert tone="bad" title="Could not save">
            {error}
          </Alert>
        ) : null}

        <Field label="Title" required error={fieldErrors.title}>
          {({ id, invalid }) => (
            <TextInput id={id} invalid={invalid} value={draft.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} />
          )}
        </Field>

        <Field
          label="Summary"
          required
          hint="One or two sentences. Shown in the news list and used as the page description."
          error={fieldErrors.excerpt}
        >
          {({ id, describedBy, invalid }) => (
            <TextArea id={id} rows={2} aria-describedby={describedBy} invalid={invalid} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} required maxLength={400} />
          )}
        </Field>

        <Field label="Body" required hint="Markdown. Raw HTML is not allowed and will be shown as plain text." error={fieldErrors.body}>
          {({ id, describedBy, invalid }) => (
            <TextArea id={id} rows={16} aria-describedby={describedBy} invalid={invalid} value={draft.body} onChange={(e) => set("body", e.target.value)} required className="font-mono text-[13px]" />
          )}
        </Field>

        <details className="border-2 border-rule-faint bg-paper-sunk px-6 py-4">
          <summary className="cursor-pointer text-sm font-medium text-ink">Formatting reference</summary>
          <pre className="mt-2.5 overflow-x-auto text-sm leading-relaxed text-ink/60">{MARKDOWN_HELP}</pre>
        </details>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tags" hint="Comma separated.">
            {({ id, describedBy }) => (
              <TextInput id={id} aria-describedby={describedBy} value={draft.tags} onChange={(e) => set("tags", e.target.value)} placeholder="tournament, results" />
            )}
          </Field>
          <Field label="Status">
            {({ id }) => (
              <Select id={id} value={draft.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(NEWS_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field
          label="Who can see it"
          hint={
            draft.visibility === "MEMBERS"
              ? "Shown only in the member portal. It never appears on the public website, the home page, or search results."
              : "Shown on the public news page and in the member portal."
          }
        >
          {({ id, describedBy }) => (
            <Select id={id} aria-describedby={describedBy} value={draft.visibility} onChange={(e) => set("visibility", e.target.value)}>
              {Object.entries(NEWS_VISIBILITIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {/* Publishing sends email to real families, so say so before the click,
            not after. Once sent, the status panel below takes over. */}
        {!email?.emailedAt ? (
          <Alert tone="info" title="Publishing emails this post">
            {email && !email.configured
              ? "Email is not set up on this deployment yet, so publishing will not send anything. Once it is, use Send email below."
              : "The first time this post is published it is emailed to every active member and their parent or guardian. Editing it afterwards does not send it again."}
          </Alert>
        ) : null}

        <Field label="Image URL" hint="Optional. A link to an image hosted elsewhere." error={fieldErrors.imageUrl}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} type="url" aria-describedby={describedBy} invalid={invalid} value={draft.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
          )}
        </Field>

        <div className="flex flex-wrap gap-2 border-t-2 border-rule-faint pt-5">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : postId ? "Save" : "Create post"}
          </Button>
          {draft.status !== "PUBLISHED" ? (
            <Button type="button" variant="primary" onClick={() => save("PUBLISHED")} disabled={busy || !postId}>
              Publish now
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => save("DRAFT")} disabled={busy}>
              Unpublish
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.push("/admin/news")} disabled={busy}>
            Back
          </Button>
        </div>
      </form>

      {postId && email ? (
        <EmailStatus postId={postId} published={draft.status === "PUBLISHED"} email={email} />
      ) : null}

      {postId ? (
        <div className="border border-bad/25 bg-bad-pale/50 p-5">
          <h2 className="font-display text-base font-semibold text-bad">Delete this post</h2>
          <p className="mt-1.5 text-base text-ink/75">Permanent. Unpublish instead if you might want it back.</p>
          <div className="mt-4 flex gap-2">
            {confirmingDelete ? (
              <>
                <Button variant="danger" onClick={remove} disabled={busy} autoFocus>
                  Yes, delete permanently
                </Button>
                <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                Delete post
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Where this post's email stands, with a manual send for the cases where the
 * automatic one did not happen. Never offers a re-send once anything has gone
 * out: families would get it twice.
 */
function EmailStatus({ postId, published, email }: { postId: string; published: boolean; email: NewsEmailState }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setMessage(null);
    setFailure(null);
    try {
      const result = await api.post<{ message: string | null }>(`/api/admin/news/${postId}/email`);
      setMessage(result.message);
      router.refresh();
    } catch (caught) {
      setFailure(caught instanceof ApiError ? caught.message : "Could not send the email.");
    } finally {
      setBusy(false);
    }
  }

  // formatDateTime is pinned to the school timezone, so the server render and
  // the browser's hydration agree. toLocaleString() would differ between them.
  const sentOn = email.emailedAt ? formatDateTime(email.emailedAt) : null;

  return (
    <div className="space-y-4 border-2 border-rule bg-paper-raised p-6">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">Email to members</h2>

      {sentOn && email.recipientCount == null ? (
        <p className="text-base text-ink/80">
          This post was published before news emails were set up, so it was never emailed — and it will not be offered
          for sending now, so old news cannot go out to every family by accident.
        </p>
      ) : sentOn ? (
        <p className="text-base text-ink/80">
          Emailed on {sentOn}
          {email.recipientCount != null ? ` to ${email.recipientCount} address${email.recipientCount === 1 ? "" : "es"}` : ""}.
          It will not be sent again.
        </p>
      ) : (
        <p className="text-base text-ink/80">
          {published ? "This post has not been emailed." : "Not emailed yet. It will be emailed when you publish it."}
        </p>
      )}

      {email.error ? (
        <Alert tone={email.emailedAt ? "warn" : "bad"} title="Last attempt">
          {email.error}
        </Alert>
      ) : null}
      {message ? <Alert tone="good">{message}</Alert> : null}
      {failure ? <Alert tone="bad">{failure}</Alert> : null}

      {published && !email.emailedAt ? (
        <Button type="button" onClick={send} disabled={busy || !email.configured}>
          {busy ? "Sending…" : "Send email now"}
        </Button>
      ) : null}
    </div>
  );
}
