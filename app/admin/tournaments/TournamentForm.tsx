"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { TOURNAMENT_CIRCUITS, TOURNAMENT_STATUSES } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";
import {
  isoToWallClock,
  wallClockToIso,
  type DivisionDraft,
  type TournamentDraft,
} from "./tournamentDraft";

export function TournamentForm({
  mode,
  tournamentId,
  initial,
}: {
  mode: "create" | "edit";
  tournamentId?: string;
  initial: TournamentDraft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<TournamentDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const [importRef, setImportRef] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  function set<K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setDivision(index: number, patch: Partial<DivisionDraft>) {
    setDraft((current) => ({
      ...current,
      divisions: current.divisions.map((division, i) => (i === index ? { ...division, ...patch } : division)),
    }));
  }

  /**
   * Pull public metadata from Tabroom into the form. Nothing is saved — the
   * officer reviews and edits before submitting.
   */
  async function importFromTabroom() {
    setImporting(true);
    setImportError(null);
    setImportNotice(null);
    try {
      const metadata = await api.post<{
        tabroomId: number;
        name: string;
        url: string;
        startDate?: string;
        endDate?: string;
        registrationOpensAt?: string;
        registrationDeadline?: string;
        location?: string;
        events: { name: string; abbreviation?: string; feeCents?: number }[];
      }>("/api/admin/tournaments/import", { reference: importRef });

      setDraft((current) => ({
        ...current,
        name: metadata.name || current.name,
        location: metadata.location || current.location,
        startDate: isoToWallClock(metadata.startDate, false) || current.startDate,
        endDate: isoToWallClock(metadata.endDate, false) || current.endDate,
        registrationOpensAt: isoToWallClock(metadata.registrationOpensAt, true) || current.registrationOpensAt,
        registrationDeadline: isoToWallClock(metadata.registrationDeadline, true) || current.registrationDeadline,
        tabroomId: String(metadata.tabroomId),
        tabroomUrl: metadata.url,
        divisions:
          metadata.events.length > 0
            ? metadata.events.map((event) => ({
                name: event.name,
                code: event.abbreviation ?? "",
                fee: event.feeCents != null ? (event.feeCents / 100).toFixed(2) : "",
                capacity: "",
              }))
            : current.divisions,
      }));

      setImportNotice(
        `Loaded "${metadata.name}" with ${metadata.events.length} event${metadata.events.length === 1 ? "" : "s"}. Review everything below, and delete any events the team is not entering.`,
      );
    } catch (caught) {
      setImportError(caught instanceof ApiError ? caught.message : "Could not reach Tabroom. Enter the details by hand.");
    } finally {
      setImporting(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setNotice(null);

    // The "Publish" button submits the same form but opens registration.
    const publishing = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "publish";
    const status = publishing ? "OPEN" : draft.status;

    const payload = {
      name: draft.name.trim(),
      startDate: wallClockToIso(draft.startDate),
      endDate: wallClockToIso(draft.endDate),
      location: draft.location.trim(),
      circuit: draft.circuit,
      status,
      registrationOpensAt: wallClockToIso(draft.registrationOpensAt),
      registrationDeadline: wallClockToIso(draft.registrationDeadline),
      description: draft.description.trim() || undefined,
      eligibility: draft.eligibility.trim() || undefined,
      memberNotes: draft.memberNotes.trim() || undefined,
      officerNotes: draft.officerNotes.trim() || undefined,
      externalRegistrationUrl: draft.externalRegistrationUrl.trim() || undefined,
      tabroomUrl: draft.tabroomUrl.trim() || undefined,
      tabroomId: draft.tabroomId ? Number(draft.tabroomId) : undefined,
      divisions: draft.divisions
        .filter((division) => division.name.trim())
        .map((division) => ({
          id: division.id,
          name: division.name.trim(),
          code: division.code.trim() || undefined,
          feeCents: division.fee ? Math.round(Number(division.fee) * 100) : undefined,
          capacity: division.capacity ? Number(division.capacity) : undefined,
        })),
    };

    try {
      if (mode === "create") {
        const created = await api.post<{ id: string }>("/api/admin/tournaments", payload);
        router.push(`/admin/tournaments/${created.id}`);
        router.refresh();
      } else {
        const result = await api.patch<{ keptDivisions: string[] }>(`/api/admin/tournaments/${tournamentId}`, payload);
        if (result.keptDivisions.length > 0) {
          setNotice(
            `Kept ${result.keptDivisions.join(", ")} because ${result.keptDivisions.length === 1 ? "it has" : "they have"} registrations. Withdraw those entries first if you really need to remove ${result.keptDivisions.length === 1 ? "it" : "them"}.`,
          );
        } else {
          setNotice(publishing ? "Published. Members can now register." : "Saved.");
        }
        set("status", status);
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

  return (
    <form onSubmit={submit} className="space-y-6">
      {notice ? <Alert tone="good">{notice}</Alert> : null}
      {error ? (
        <Alert tone="bad" title="Could not save">
          {error}
        </Alert>
      ) : null}

      {/* Tabroom import — a convenience, never a dependency. */}
      <section className="border-2 border-rule-faint bg-paper-sunk p-5">
        <h2 className="font-display text-base font-semibold text-ink">Prefill from Tabroom</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={importRef}
            onChange={(event) => setImportRef(event.target.value)}
            placeholder="https://www.tabroom.com/index/tourn/index.mhtml?tourn_id=34000"
            aria-label="Tabroom link or tournament id"
            className="min-w-[240px] flex-1 border-2 border-rule bg-paper-raised px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" onClick={importFromTabroom} disabled={importing || !importRef.trim()}>
            {importing ? "Loading…" : "Load from Tabroom"}
          </Button>
        </div>

        {importError ? (
          <div className="mt-3">
            <Alert tone="warn" title="Tabroom lookup failed">
              {importError}
            </Alert>
          </div>
        ) : null}
        {importNotice ? (
          <div className="mt-3">
            <Alert tone="good">{importNotice}</Alert>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-ink">Basics</h2>

        <Field label="Tournament name" required error={fieldErrors.name}>
          {({ id, invalid }) => (
            <TextInput id={id} invalid={invalid} value={draft.name} onChange={(e) => set("name", e.target.value)} required maxLength={200} />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" required error={fieldErrors.startDate}>
            {({ id, invalid }) => (
              <TextInput id={id} type="date" invalid={invalid} value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} required />
            )}
          </Field>
          <Field label="End date" hint="Leave blank for a single-day tournament." error={fieldErrors.endDate}>
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} type="date" aria-describedby={describedBy} invalid={invalid} value={draft.endDate} onChange={(e) => set("endDate", e.target.value)} />
            )}
          </Field>
          <Field label="Location" required error={fieldErrors.location}>
            {({ id, invalid }) => (
              <TextInput id={id} invalid={invalid} value={draft.location} onChange={(e) => set("location", e.target.value)} required placeholder="e.g. Alexandria, VA or Online" />
            )}
          </Field>
          <Field label="Circuit">
            {({ id }) => (
              <Select id={id} value={draft.circuit} onChange={(e) => set("circuit", e.target.value)}>
                {Object.entries(TOURNAMENT_CIRCUITS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-ink">Registration</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Visibility">
            {({ id, describedBy }) => (
              <Select id={id} aria-describedby={describedBy} value={draft.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(TOURNAMENT_STATUSES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Registration deadline" error={fieldErrors.registrationDeadline}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                type="datetime-local"
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.registrationDeadline}
                onChange={(e) => set("registrationDeadline", e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="External registration link" error={fieldErrors.externalRegistrationUrl}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} type="url" aria-describedby={describedBy} invalid={invalid} value={draft.externalRegistrationUrl} onChange={(e) => set("externalRegistrationUrl", e.target.value)} />
          )}
        </Field>

        <Field label="Tabroom link" error={fieldErrors.tabroomUrl}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} type="url" aria-describedby={describedBy} invalid={invalid} value={draft.tabroomUrl} onChange={(e) => set("tabroomUrl", e.target.value)} />
          )}
        </Field>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-6">
          <h2 className="font-display text-base font-semibold text-ink">Events &amp; divisions</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDraft((c) => ({ ...c, divisions: [...c.divisions, { name: "", code: "", fee: "", capacity: "" }] }))}
          >
            Add event
          </Button>
        </div>

        {fieldErrors.divisions ? <Alert tone="bad">{fieldErrors.divisions}</Alert> : null}

        <ul className="space-y-3">
          {draft.divisions.map((division, index) => (
            <li key={division.id ?? index} className="border-2 border-rule bg-paper-raised p-4">
              <div className="grid gap-6 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
                <Field label="Event name" required>
                  {({ id }) => (
                    <TextInput id={id} value={division.name} onChange={(e) => setDivision(index, { name: e.target.value })} placeholder="Policy — Varsity" required />
                  )}
                </Field>
                <Field label="Code">
                  {({ id }) => <TextInput id={id} value={division.code} onChange={(e) => setDivision(index, { code: e.target.value })} placeholder="VCX" />}
                </Field>
                <Field label="Fee (USD)">
                  {({ id }) => (
                    <TextInput id={id} type="number" min="0" step="0.01" value={division.fee} onChange={(e) => setDivision(index, { fee: e.target.value })} placeholder="40.00" />
                  )}
                </Field>
                <Field label="Cap">
                  {({ id }) => (
                    <TextInput id={id} type="number" min="1" value={division.capacity} onChange={(e) => setDivision(index, { capacity: e.target.value })} placeholder="—" />
                  )}
                </Field>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mb-0.5"
                  disabled={draft.divisions.length === 1}
                  onClick={() => setDraft((c) => ({ ...c, divisions: c.divisions.filter((_, i) => i !== index) }))}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-ink">Notes</h2>

        <Field label="Description">
          {({ id, describedBy }) => (
            <TextArea id={id} aria-describedby={describedBy} rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} />
          )}
        </Field>

        <Field label="Eligibility">
          {({ id, describedBy }) => (
            <TextArea id={id} aria-describedby={describedBy} rows={2} value={draft.eligibility} onChange={(e) => set("eligibility", e.target.value)} maxLength={2000} />
          )}
        </Field>

        <Field label="Note to members">
          {({ id, describedBy }) => (
            <TextArea id={id} aria-describedby={describedBy} rows={2} value={draft.memberNotes} onChange={(e) => set("memberNotes", e.target.value)} maxLength={2000} />
          )}
        </Field>

        <Field label="Officer notes" hint="Never shown to members.">
          {({ id, describedBy }) => (
            <TextArea id={id} aria-describedby={describedBy} rows={2} value={draft.officerNotes} onChange={(e) => set("officerNotes", e.target.value)} maxLength={2000} />
          )}
        </Field>
      </section>

      <div className="flex flex-wrap gap-2 border-t-2 border-rule-faint pt-5">
        {draft.status === "DRAFT" ? (
          <Button type="submit" value="publish" disabled={busy}>
            {busy ? "Saving…" : "Publish — open registration"}
          </Button>
        ) : null}
        <Button type="submit" variant={draft.status === "DRAFT" ? "outline" : "primary"} disabled={busy}>
          {busy ? "Saving…" : draft.status === "DRAFT" ? "Save as draft" : mode === "create" ? "Create tournament" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/tournaments")} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
