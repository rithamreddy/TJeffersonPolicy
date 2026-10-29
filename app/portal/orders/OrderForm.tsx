"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { ApiError, api } from "@/lib/client/api";

/**
 * Inline order form, expanded from the item card. Kept in the same card so the
 * member never loses sight of what they are ordering.
 */
export function OrderForm({ itemId, itemName, sizes }: { itemId: string; itemName: string; sizes: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(sizes[0] ?? "");
  const [memberNote, setMemberNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Alert tone="good" title="Order recorded">
        Officers will follow up about payment and pickup. Track it under Your orders below.
      </Alert>
    );
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Request {itemName}
      </Button>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/orders", {
        itemId,
        quantity,
        size: sizes.length > 0 ? size : undefined,
        memberNote: memberNote.trim() || undefined,
      });
      setDone(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not place that order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-2 border-rule-faint bg-paper-sunk p-4">
      {error ? (
        <Alert tone="bad" title="Could not place the order">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Quantity" required>
          {({ id }) => (
            <TextInput
              id={id}
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
              required
            />
          )}
        </Field>

        {sizes.length > 0 ? (
          <Field label="Size" required>
            {({ id }) => (
              <Select id={id} value={size} onChange={(event) => setSize(event.target.value)} required>
                {sizes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}
      </div>

      <Field label="Note for officers">
        {({ id }) => (
          <TextArea
            id={id}
            rows={2}
            maxLength={500}
            value={memberNote}
            onChange={(event) => setMemberNote(event.target.value)}
          />
        )}
      </Field>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Submitting…" : "Submit request"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
