"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert, EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { ORDER_CATEGORIES, labelFor } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";
import { formatMoney } from "@/lib/utils/format";

export interface CatalogueItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  category: string;
  externalUrl: string | null;
  externalLabel: string | null;
  sizes: string[];
  isActive: boolean;
  sortOrder: number;
}

const blank = {
  name: "",
  description: "",
  price: "",
  category: "MERCH",
  externalUrl: "",
  externalLabel: "",
  sizes: "",
  isActive: true,
  sortOrder: "0",
};

type Draft = typeof blank;

function draftFrom(item: CatalogueItem): Draft {
  return {
    name: item.name,
    description: item.description ?? "",
    price: item.priceCents != null ? (item.priceCents / 100).toFixed(2) : "",
    category: item.category,
    externalUrl: item.externalUrl ?? "",
    externalLabel: item.externalLabel ?? "",
    sizes: item.sizes.join(", "),
    isActive: item.isActive,
    sortOrder: String(item.sortOrder),
  };
}

export function CatalogueEditor({ items }: { items: CatalogueItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function startNew() {
    setEditingId(null);
    setDraft(blank);
    setOpen(true);
    setError(null);
    setFieldErrors({});
  }

  function startEdit(item: CatalogueItem) {
    setEditingId(item.id);
    setDraft(draftFrom(item));
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
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      priceCents: draft.price ? Math.round(Number(draft.price) * 100) : undefined,
      category: draft.category,
      externalUrl: draft.externalUrl.trim() || undefined,
      externalLabel: draft.externalLabel.trim() || undefined,
      sizes: draft.sizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
      isActive: draft.isActive,
      sortOrder: Number(draft.sortOrder) || 0,
    };

    try {
      if (editingId) await api.patch(`/api/admin/order-items/${editingId}`, payload);
      else await api.post("/api/admin/order-items", payload);
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

  async function remove(item: CatalogueItem) {
    setBusy(true);
    setError(null);
    try {
      const result = await api.delete<{ deleted: boolean; archived: boolean }>(`/api/admin/order-items/${item.id}`);
      setNotice(
        result.deleted
          ? `"${item.name}" was deleted.`
          : `"${item.name}" has orders against it, so it was archived (hidden from members) instead of deleted.`,
      );
      setRemovingId(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not remove that item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {notice ? <Alert tone="good">{notice}</Alert> : null}

      <div className="flex justify-end">
        <Button onClick={startNew} size="sm">
          Add item
        </Button>
      </div>

      {open ? (
        <Card>
          <CardBody className="sm:p-6">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              {editingId ? "Edit item" : "New item"}
            </h2>

            <form onSubmit={submit} className="space-y-4">
              {error ? (
                <Alert tone="bad" title="Could not save">
                  {error}
                </Alert>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required error={fieldErrors.name}>
                  {({ id, invalid }) => (
                    <TextInput id={id} invalid={invalid} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
                  )}
                </Field>
                <Field label="Category">
                  {({ id }) => (
                    <Select id={id} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                      {Object.entries(ORDER_CATEGORIES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Price (USD)" error={fieldErrors.priceCents}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput id={id} type="number" min="0" step="0.01" aria-describedby={describedBy} invalid={invalid} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
                  )}
                </Field>
                <Field label="Sort order" hint="Lower numbers appear first.">
                  {({ id, describedBy }) => (
                    <TextInput id={id} type="number" min="0" aria-describedby={describedBy} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
                  )}
                </Field>
              </div>

              <Field label="Description" error={fieldErrors.description}>
                {({ id, invalid }) => (
                  <TextArea id={id} rows={2} invalid={invalid} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={2000} />
                )}
              </Field>

              <Field label="Sizes" hint="Comma separated.">
                {({ id, describedBy }) => (
                  <TextInput id={id} aria-describedby={describedBy} value={draft.sizes} onChange={(e) => setDraft({ ...draft, sizes: e.target.value })} />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payment link" error={fieldErrors.externalUrl}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput id={id} type="url" aria-describedby={describedBy} invalid={invalid} value={draft.externalUrl} onChange={(e) => setDraft({ ...draft, externalUrl: e.target.value })} />
                  )}
                </Field>
                <Field label="Payment link label">
                  {({ id, describedBy }) => (
                    <TextInput id={id} aria-describedby={describedBy} value={draft.externalLabel} onChange={(e) => setDraft({ ...draft, externalLabel: e.target.value })} />
                  )}
                </Field>
              </div>

              <Checkbox
                label="Available to members now"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />

              <div className="flex gap-2 border-t-2 border-rule-faint pt-4">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : editingId ? "Save changes" : "Create item"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Nothing in the catalogue"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardBody className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-ink">{item.name}</h3>
                      <Badge tone={item.isActive ? "good" : "neutral"}>{item.isActive ? "Available" : "Hidden"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">
                      {labelFor(ORDER_CATEGORIES, item.category)}
                      {item.priceCents ? ` · ${formatMoney(item.priceCents)}` : " · no price set"}
                      {item.sizes.length > 0 ? ` · ${item.sizes.join(", ")}` : ""}
                    </p>
                    {item.description ? <p className="mt-2 text-base text-ink/60">{item.description}</p> : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    {removingId === item.id ? (
                      <>
                        <Button size="sm" variant="danger" onClick={() => remove(item)} disabled={busy} autoFocus>
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRemovingId(null)} disabled={busy}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setRemovingId(item.id)}>
                        Remove
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
