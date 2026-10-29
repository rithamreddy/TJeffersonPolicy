"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { ApiError, api } from "@/lib/client/api";
import { currentSeasonYear, seasonLabel } from "@/lib/constants";

/**
 * Excuses a member from dues for one season, regardless of what the itemized
 * fees below would otherwise add up to. This is the only override on the
 * whole balance section — everything else is checked off item by item.
 */
export function DuesWaiverControl({
  userId,
  initialWaived,
  initialNote,
}: {
  userId: string;
  initialWaived: boolean;
  initialNote: string;
}) {
  const router = useRouter();
  const season = currentSeasonYear();
  const [waived, setWaived] = useState(initialWaived);
  const [note, setNote] = useState(initialNote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = waived !== initialWaived || note !== initialNote;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.put("/api/admin/dues", { userId, seasonYear: season, waived, note: note.trim() || undefined });
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-2 border-rule-faint bg-paper-sunk p-4">
      <Checkbox
        label={`Waive dues for the ${seasonLabel(season)} season`}
        checked={waived}
        onChange={(event) => {
          setWaived(event.target.checked);
          setSaved(false);
        }}
      />
      <Field label="Note" hint="Visible to the member.">
        {({ id, describedBy }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(false);
            }}
            placeholder="e.g. Financial hardship, cleared with the sponsor"
            maxLength={200}
          />
        )}
      </Field>
      {error ? <Alert tone="bad">{error}</Alert> : null}
      <Button size="sm" variant={dirty ? "primary" : "outline"} onClick={save} disabled={busy || !dirty}>
        {busy ? "Saving…" : saved && !dirty ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
