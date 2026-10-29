"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert, EmptyState } from "@/components/ui/States";
import { DEBATE_EVENTS, labelFor, seasonLabel } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";

export interface OfficerRow {
  userId: string;
  displayName: string;
  position: string;
  bio: string | null;
  publicEmail: string | null;
  photoUrl: string | null;
  events: string[];
  termYear: number;
  isPublic: boolean;
  sortOrder: number;
}

export interface MemberOption {
  id: string;
  displayName: string;
  role: string;
}

export function OfficerEditor({
  officers,
  members,
  currentSeason,
}: {
  officers: OfficerRow[];
  members: MemberOption[];
  currentSeason: number;
}) {
  const router = useRouter();
  const blank = {
    userId: members[0]?.id ?? "",
    position: "",
    bio: "",
    publicEmail: "",
    photoUrl: "",
    events: [] as string[],
    termYear: String(currentSeason),
    isPublic: true,
    sortOrder: "0",
  };

  const [draft, setDraft] = useState(blank);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<string | null>(null);

  function startNew() {
    setDraft(blank);
    setEditing(false);
    setOpen(true);
    setError(null);
    setFieldErrors({});
  }

  function startEdit(officer: OfficerRow) {
    setDraft({
      userId: officer.userId,
      position: officer.position,
      bio: officer.bio ?? "",
      publicEmail: officer.publicEmail ?? "",
      photoUrl: officer.photoUrl ?? "",
      events: officer.events,
      termYear: String(officer.termYear),
      isPublic: officer.isPublic,
      sortOrder: String(officer.sortOrder),
    });
    setEditing(true);
    setOpen(true);
    setError(null);
    setFieldErrors({});
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});

    try {
      await api.post("/api/admin/officers", {
        userId: draft.userId,
        position: draft.position.trim(),
        bio: draft.bio.trim() || undefined,
        publicEmail: draft.publicEmail.trim() || undefined,
        photoUrl: draft.photoUrl.trim() || undefined,
        events: draft.events,
        termYear: Number(draft.termYear),
        isPublic: draft.isPublic,
        sortOrder: Number(draft.sortOrder) || 0,
      });
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

  async function remove(userId: string, demote: boolean) {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/admin/officers/${userId}${demote ? "?demote=1" : ""}`);
      setRemoving(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not remove.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <Alert tone="bad" title="Something went wrong">
          {error}
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button size="sm" onClick={startNew} disabled={members.length === 0}>
          Add officer
        </Button>
      </div>

      {open ? (
        <Card>
          <CardBody className="sm:p-6">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">
              {editing ? "Edit officer profile" : "Add an officer"}
            </h2>

            <form onSubmit={submit} className="space-y-4">
              <Field
                label="Member"
                required
                hint="Saving grants officer access."
              >
                {({ id, describedBy }) => (
                  <Select
                    id={id}
                    aria-describedby={describedBy}
                    value={draft.userId}
                    onChange={(e) => setDraft({ ...draft, userId: e.target.value })}
                    disabled={editing}
                    required
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.displayName}
                        {member.role === "OFFICER" ? " (officer)" : ""}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Position" required error={fieldErrors.position}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput id={id} aria-describedby={describedBy} invalid={invalid} value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} required />
                  )}
                </Field>
                <Field label="Term" required hint="Start year — 2026 means the 2026–27 season.">
                  {({ id, describedBy }) => (
                    <TextInput id={id} type="number" min="2000" max="2100" aria-describedby={describedBy} value={draft.termYear} onChange={(e) => setDraft({ ...draft, termYear: e.target.value })} required />
                  )}
                </Field>
                <Field
                  label="Public email"
                  hint="Shown publicly."
                  error={fieldErrors.publicEmail}
                >
                  {({ id, describedBy, invalid }) => (
                    <TextInput id={id} type="email" aria-describedby={describedBy} invalid={invalid} value={draft.publicEmail} onChange={(e) => setDraft({ ...draft, publicEmail: e.target.value })} />
                  )}
                </Field>
                <Field label="Order" hint="Lower numbers appear first.">
                  {({ id, describedBy }) => (
                    <TextInput id={id} type="number" min="0" aria-describedby={describedBy} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
                  )}
                </Field>
              </div>

              <Field label="Biography" error={fieldErrors.bio}>
                {({ id, describedBy, invalid }) => (
                  <TextArea id={id} rows={3} aria-describedby={describedBy} invalid={invalid} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} maxLength={2000} />
                )}
              </Field>

              <Field label="Photo URL" error={fieldErrors.photoUrl}>
                {({ id, describedBy, invalid }) => (
                  <TextInput id={id} type="url" aria-describedby={describedBy} invalid={invalid} value={draft.photoUrl} onChange={(e) => setDraft({ ...draft, photoUrl: e.target.value })} />
                )}
              </Field>

              <fieldset>
                <legend className="text-sm font-medium text-ink">Events</legend>
                <div className="mt-2.5 space-y-2">
                  {(Object.keys(DEBATE_EVENTS) as (keyof typeof DEBATE_EVENTS)[]).map((key) => (
                    <Checkbox
                      key={key}
                      label={DEBATE_EVENTS[key]}
                      checked={draft.events.includes(key)}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          events: current.events.includes(key)
                            ? current.events.filter((e) => e !== key)
                            : [...current.events, key],
                        }))
                      }
                    />
                  ))}
                </div>
              </fieldset>

              <Checkbox
                label="Show on the public officers page"
                checked={draft.isPublic}
                onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })}
              />

              <div className="flex gap-2 border-t-2 border-rule-faint pt-4">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : editing ? "Save changes" : "Add officer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {officers.length === 0 ? (
        <EmptyState
          title="No officer profiles yet"
        />
      ) : (
        <ul className="space-y-3">
          {officers.map((officer) => (
            <li key={officer.userId}>
              <Card>
                <CardBody className="flex flex-wrap items-start gap-4">
                  <Avatar name={officer.displayName} photoUrl={officer.photoUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-ink">{officer.displayName}</h3>
                      <Badge tone={officer.isPublic ? "good" : "neutral"}>{officer.isPublic ? "Public" : "Hidden"}</Badge>
                      <span className="text-sm text-ink/60">{seasonLabel(officer.termYear)}</span>
                    </div>
                    <p className="mt-1.5 text-base font-medium text-navy-600">{officer.position}</p>
                    {officer.bio ? <p className="mt-2 text-base text-ink/60">{officer.bio}</p> : null}
                    <p className="mt-1.5 text-sm text-ink/60">
                      {officer.publicEmail ?? "No public email"}
                      {officer.events.length > 0 ? ` · ${officer.events.map((e) => labelFor(DEBATE_EVENTS, e)).join(", ")}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(officer)}>
                      Edit
                    </Button>
                    {removing === officer.userId ? (
                      <>
                        <Button size="sm" variant="danger" onClick={() => remove(officer.userId, true)} disabled={busy} autoFocus>
                          Remove &amp; revoke access
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remove(officer.userId, false)} disabled={busy}>
                          Remove from page only
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRemoving(null)} disabled={busy}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setRemoving(officer.userId)}>
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
