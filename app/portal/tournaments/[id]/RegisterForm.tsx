"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { ApiError, api } from "@/lib/client/api";
import { formatMoney } from "@/lib/utils/format";

export interface DivisionOption {
  id: string;
  name: string;
  code: string | null;
  feeCents: number | null;
  /** Present when the member already holds a live entry in this division. */
  alreadyRegistered: boolean;
  full: boolean;
}

export interface RegisterFormDefaults {
  partnerName: string;
  schoolEmail: string;
  tabroomEmail: string;
  phoneNumber: string;
  grade: number | null;
  partnerSchoolEmail: string;
}

/**
 * Collected fresh at every tournament, not read silently from the profile —
 * officers need an exact, current snapshot for Tabroom entry and day-of
 * contact. Everything here pre-fills from the member's profile or their most
 * recent registration purely as a convenience; every field still has to be
 * confirmed or edited before it can be submitted.
 */
export function RegisterForm({
  tournamentId,
  divisions,
  defaults,
}: {
  tournamentId: string;
  divisions: DivisionOption[];
  defaults: RegisterFormDefaults;
}) {
  const router = useRouter();
  const selectable = divisions.filter((division) => !division.alreadyRegistered && !division.full);

  const [divisionId, setDivisionId] = useState(selectable[0]?.id ?? "");
  const [partnerName, setPartnerName] = useState(defaults.partnerName);
  const [schoolEmail, setSchoolEmail] = useState(defaults.schoolEmail);
  const [tabroomEmail, setTabroomEmail] = useState(defaults.tabroomEmail);
  const [phoneNumber, setPhoneNumber] = useState(defaults.phoneNumber);
  const [grade, setGrade] = useState(defaults.grade ? String(defaults.grade) : "");
  const [partnerSchoolEmail, setPartnerSchoolEmail] = useState(defaults.partnerSchoolEmail);
  const [memberNote, setMemberNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (selectable.length === 0) {
    return (
      <Alert tone="info" title="Nothing left to enter">
        You are already registered for every event at this tournament, or the remaining events are full. Manage your
        entries from My registrations.
      </Alert>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    setFieldErrors({});

    try {
      await api.post("/api/registrations", {
        tournamentId,
        divisionId,
        partnerName: partnerName.trim(),
        schoolEmail: schoolEmail.trim(),
        tabroomEmail: tabroomEmail.trim(),
        phoneNumber: phoneNumber.trim(),
        grade: grade ? Number(grade) : undefined,
        partnerSchoolEmail: partnerSchoolEmail.trim(),
        memberNote: memberNote.trim() || undefined,
      });
      setStatus("done");
      setMemberNote("");
      router.refresh();
    } catch (caught) {
      setStatus("idle");
      if (caught instanceof ApiError) {
        setError(caught.message);
        if (caught.fields) setFieldErrors(caught.fields);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {status === "done" ? (
        <Alert tone="good" title="Registration submitted">
          An officer will confirm your entry. You can withdraw from My registrations if plans change.
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="bad" title="Could not register">
          {error}
        </Alert>
      ) : null}

      <Field label="Event" required error={fieldErrors.divisionId}>
        {({ id, describedBy, invalid }) => (
          <Select
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={divisionId}
            onChange={(event) => setDivisionId(event.target.value)}
            required
          >
            {selectable.map((division) => (
              <option key={division.id} value={division.id}>
                {division.name}
                {division.feeCents ? ` — ${formatMoney(division.feeCents)}` : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Partner" required error={fieldErrors.partnerName}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={partnerName}
              onChange={(event) => setPartnerName(event.target.value)}
              placeholder="e.g. Alex Rivera"
              maxLength={200}
              required
            />
          )}
        </Field>

        <Field label="Your grade" required error={fieldErrors.grade}>
          {({ id, invalid }) => (
            <Select id={id} invalid={invalid} value={grade} onChange={(event) => setGrade(event.target.value)} required>
              <option value="" disabled>
                Select a grade
              </option>
              {[9, 10, 11, 12].map((option) => (
                <option key={option} value={option}>
                  Grade {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your school email" required error={fieldErrors.schoolEmail}>
          {({ id, invalid }) => (
            <TextInput
              id={id}
              type="email"
              invalid={invalid}
              value={schoolEmail}
              onChange={(event) => setSchoolEmail(event.target.value)}
              maxLength={200}
              required
            />
          )}
        </Field>

        <Field label="Your Tabroom email" required error={fieldErrors.tabroomEmail}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="email"
              aria-describedby={describedBy}
              invalid={invalid}
              value={tabroomEmail}
              onChange={(event) => setTabroomEmail(event.target.value)}
              maxLength={200}
              required
            />
          )}
        </Field>
      </div>

      <Field label="Your phone number" required error={fieldErrors.phoneNumber}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="tel"
            aria-describedby={describedBy}
            invalid={invalid}
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="e.g. (555) 123-4567"
            maxLength={30}
            required
          />
        )}
      </Field>

      <Field label="Partner's school email" required error={fieldErrors.partnerSchoolEmail}>
        {({ id, invalid }) => (
          <TextInput
            id={id}
            type="email"
            invalid={invalid}
            value={partnerSchoolEmail}
            onChange={(event) => setPartnerSchoolEmail(event.target.value)}
            maxLength={200}
            required
          />
        )}
      </Field>

      <Field
        label="Anything officers should know"
        hint="Optional."
        error={fieldErrors.memberNote}
      >
        {({ id, describedBy, invalid }) => (
          <TextArea
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            value={memberNote}
            onChange={(event) => setMemberNote(event.target.value)}
            maxLength={1000}
            rows={3}
          />
        )}
      </Field>

      <div className="flex items-center gap-6">
        <Button type="submit" disabled={status === "saving" || !divisionId}>
          {status === "saving" ? "Submitting…" : "Submit registration"}
        </Button>
        <p className="text-sm text-ink/60">You can withdraw later.</p>
      </div>
    </form>
  );
}
