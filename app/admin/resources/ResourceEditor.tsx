"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert, EmptyState } from "@/components/ui/States";
import { RESOURCE_CATEGORIES, RESOURCE_VISIBILITIES, labelFor } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";

export interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
  tags: string[];
  visibility: string;
  addedBy: string | null;
}

const blank = { title: "", description: "", category: "EVIDENCE", url: "", tags: "", visibility: "MEMBER" };
type Draft = typeof blank;

export function ResourceEditor({ resources }: { resources: ResourceItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startNew() {
    setEditingId(null);
    setDraft(blank);
    setOpen(true);
    setError(null);
    setFieldErrors({});
  }

  function startEdit(item: ResourceItem) {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description ?? "",
      category: item.category,
      url: item.url,
      tags: item.tags.join(", "),
      visibility: item.visibility,
    });
    setOpen(true);
    setError(null);
    setFieldErrors({});
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      category: draft.category,
      url: draft.url.trim(),
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      visibility: draft.visibility,
    };

    try {
      if (editingId) await api.patch(`/api/admin/resources/${editingId}`, payload);
      else await api.post("/api/admin/resources", payload);
      setOpen(false);
      router.refresh();
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

  async function remove(id: string) {
    setBusy(true);
    try {
      await api.delete(`/api/admin/resources/${id}`);
      setDeletingId(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={startNew} size="sm">
          Add resource
        </Button>
      </div>

      {open ? (
        <Card>
          <CardBody className="sm:p-6">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              {editingId ? "Edit resource" : "New resource"}
            </h2>

            <form onSubmit={submit} className="space-y-4">
              {error ? (
                <Alert tone="bad" title="Could not save">
                  {error}
                </Alert>
              ) : null}

              <Field label="Title" required error={fieldErrors.title}>
                {({ id, invalid }) => (
                  <TextInput id={id} invalid={invalid} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
                )}
              </Field>

              <Field
                label="Link"
                required
                error={fieldErrors.url}
              >
                {({ id, describedBy, invalid }) => (
                  <TextInput id={id} type="url" aria-describedby={describedBy} invalid={invalid} value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} required placeholder="https://" />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  {({ id }) => (
                    <Select id={id} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                      {Object.entries(RESOURCE_CATEGORIES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Who can see it">
                  {({ id, describedBy }) => (
                    <Select id={id} aria-describedby={describedBy} value={draft.visibility} onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}>
                      {Object.entries(RESOURCE_VISIBILITIES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>

              <Field label="Description" error={fieldErrors.description}>
                {({ id, invalid }) => (
                  <TextArea id={id} rows={2} invalid={invalid} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={2000} />
                )}
              </Field>

              <Field label="Tags" hint="Comma separated.">
                {({ id, describedBy }) => (
                  <TextInput id={id} aria-describedby={describedBy} value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="topic, camp files, novice" />
                )}
              </Field>

              <div className="flex gap-2 border-t-2 border-rule-faint pt-4">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : editingId ? "Save changes" : "Add resource"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {resources.length === 0 ? (
        <EmptyState title="No resources yet" />
      ) : (
        <ul className="space-y-3">
          {resources.map((item) => (
            <li key={item.id}>
              <Card>
                <CardBody className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{labelFor(RESOURCE_CATEGORIES, item.category)}</Badge>
                      {item.visibility === "OFFICER" ? <Badge tone="warn">Officers only</Badge> : null}
                    </div>
                    <h3 className="mt-2 font-display text-base font-semibold text-ink">{item.title}</h3>
                    {item.description ? <p className="mt-1 text-base text-ink/60">{item.description}</p> : null}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 block truncate text-sm text-navy-600 hover:underline"
                    >
                      {item.url}
                    </a>
                    {item.tags.length > 0 ? <p className="mt-1.5 text-sm text-ink/60">{item.tags.join(" · ")}</p> : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    {deletingId === item.id ? (
                      <>
                        <Button size="sm" variant="danger" onClick={() => remove(item.id)} disabled={busy} autoFocus>
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)} disabled={busy}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setDeletingId(item.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
