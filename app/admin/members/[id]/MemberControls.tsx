"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { DEBATE_EVENTS, MEMBER_STATUSES, NSDA_STATUSES, ROLES } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";

export function MemberControls({
  userId,
  pinnedByConfig = false,
  initial,
}: {
  userId: string;
  /** True when OFFICER_USERNAMES holds this account's officer role. */
  pinnedByConfig?: boolean;
  initial: {
    role: string;
    status: string;
    events: string[];
    nsdaStatus: string;
    nsdaMemberId: string;
    gradeNumber: number | null;
  };
}) {
  const router = useRouter();
  const [role, setRole] = useState(initial.role);
  const [status, setStatus] = useState(initial.status);
  const [events, setEvents] = useState(initial.events);
  const [nsdaStatus, setNsdaStatus] = useState(initial.nsdaStatus);
  const [nsdaMemberId, setNsdaMemberId] = useState(initial.nsdaMemberId);
  const [gradeNumber, setGradeNumber] = useState(initial.gradeNumber ? String(initial.gradeNumber) : "");

  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const roleChanging = role !== initial.role;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    setError(null);

    try {
      await api.patch(`/api/admin/members/${userId}`, {
        role,
        status,
        events,
        nsdaStatus,
        nsdaMemberId: nsdaMemberId.trim() || undefined,
        gradeNumber: gradeNumber ? Number(gradeNumber) : undefined,
      });
      setState("saved");
      router.refresh();
    } catch (caught) {
      setState("idle");
      setError(caught instanceof ApiError ? caught.message : "Could not save. Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {state === "saved" ? <Alert tone="good">Member record updated.</Alert> : null}
      {error ? (
        <Alert tone="bad" title="Could not save">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Role"
          hint={pinnedByConfig ? "Set by the OFFICER_USERNAMES environment setting." : undefined}
        >
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={role}
              disabled={pinnedByConfig}
              onChange={(event) => {
                setRole(event.target.value);
                setState("idle");
              }}
            >
              {Object.entries(ROLES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Membership status">
          {({ id }) => (
            <Select
              id={id}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setState("idle");
              }}
            >
              {Object.entries(MEMBER_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="NSDA membership">
          {({ id }) => (
            <Select
              id={id}
              value={nsdaStatus}
              onChange={(event) => {
                setNsdaStatus(event.target.value);
                setState("idle");
              }}
            >
              {Object.entries(NSDA_STATUSES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="NSDA member ID">
          {({ id }) => (
            <TextInput
              id={id}
              value={nsdaMemberId}
              onChange={(event) => {
                setNsdaMemberId(event.target.value);
                setState("idle");
              }}
              maxLength={200}
            />
          )}
        </Field>

        <Field label="Grade">
          {({ id, describedBy }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={gradeNumber}
              onChange={(event) => {
                setGradeNumber(event.target.value);
                setState("idle");
              }}
            >
              <option value="">Not set</option>
              {[9, 10, 11, 12].map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Events</legend>
        <div className="mt-2.5 space-y-2">
          {(Object.keys(DEBATE_EVENTS) as (keyof typeof DEBATE_EVENTS)[]).map((key) => (
            <Checkbox
              key={key}
              label={DEBATE_EVENTS[key]}
              checked={events.includes(key)}
              onChange={() => {
                setEvents((current) => (current.includes(key) ? current.filter((e) => e !== key) : [...current, key]));
                setState("idle");
              }}
            />
          ))}
        </div>
      </fieldset>

      {pinnedByConfig ? (
        <Alert tone="info" title="This officer is set in configuration">
          Their Ion username is listed in <code>OFFICER_USERNAMES</code>, so the role is re-applied every time they sign
          in and cannot be changed here. Remove them from that setting to manage their role from this page.
        </Alert>
      ) : null}

      {roleChanging ? (
        <Alert tone="warn" title="Role change">
          Changing a role signs that person out of every browser, so the new permissions take effect straight away.
        </Alert>
      ) : null}

      <div className="border-t-2 border-rule-faint pt-5">
        <Button type="submit" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
