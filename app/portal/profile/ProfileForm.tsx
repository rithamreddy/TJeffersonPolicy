"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { DEBATE_EVENTS } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";

export interface ProfileFormValues {
  contactEmail: string;
  tjEmail: string;
  phoneNumber: string;
  parentEmail: string;
  parentPhone: string;
  events: string[];
  partnerName: string;
  nsdaMemberId: string;
}

type TextKey = Exclude<keyof ProfileFormValues, "events">;

/**
 * Fields marked * are the ones the setup banner asks for (see
 * lib/services/profile-completion.ts). They are not enforced on save, so a
 * member can fill the form in over several visits — the banner is what keeps
 * nudging until it is done.
 */
export function ProfileForm({ initial }: { initial: ProfileFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set(key: TextKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  function toggleEvent(key: string) {
    setValues((current) => ({
      ...current,
      events: current.events.includes(key) ? current.events.filter((e) => e !== key) : [...current.events, key],
    }));
    setStatus("idle");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    setFieldErrors({});

    try {
      // Every field is sent on every save: the server treats a blank as
      // "clear this", so omitting one would wipe it.
      await api.patch("/api/profile", {
        contactEmail: values.contactEmail.trim(),
        tjEmail: values.tjEmail.trim(),
        phoneNumber: values.phoneNumber.trim(),
        parentEmail: values.parentEmail.trim(),
        parentPhone: values.parentPhone.trim(),
        events: values.events,
        partnerName: values.partnerName.trim(),
        nsdaMemberId: values.nsdaMemberId.trim(),
      });
      setStatus("saved");
      router.refresh();
    } catch (caught) {
      setStatus("idle");
      if (caught instanceof ApiError) {
        setError(caught.message);
        if (caught.fields) setFieldErrors(caught.fields);
      } else {
        setError("Could not save your changes. Please try again.");
      }
    }
  }

  const text = (key: TextKey, props: { label: string; hint?: string; type?: string; required?: boolean; autoComplete?: string }) => (
    <Field label={props.label} hint={props.hint} required={props.required} error={fieldErrors[key]}>
      {({ id, describedBy, invalid }) => (
        <TextInput
          id={id}
          type={props.type ?? "text"}
          autoComplete={props.autoComplete}
          aria-describedby={describedBy}
          invalid={invalid}
          value={values[key]}
          onChange={(event) => set(key, event.target.value)}
          maxLength={200}
        />
      )}
    </Field>
  );

  return (
    <form onSubmit={submit} className="space-y-10" noValidate>
      {status === "saved" ? <Alert tone="good">Profile updated.</Alert> : null}
      {error ? (
        <Alert tone="bad" title="Could not save">
          {error}
        </Alert>
      ) : null}

      <p className="text-sm text-ink/60">
        <span className="text-bad" aria-hidden="true">
          *
        </span>{" "}
        Needed to finish setting up your profile. You can save partway through.
      </p>

      <Section title="Your contact details">
        {text("contactEmail", {
          label: "Personal email",
          type: "email",
          autoComplete: "email",
          required: true,
          hint: "Team news is emailed here. Use an address you actually check — school accounts filter a lot of outside mail.",
        })}
        {text("tjEmail", {
          label: "School email",
          type: "email",
          required: true,
          hint: "Filled in from Ion the first time you sign in. Change it if it's wrong — Ion won't overwrite your edit.",
        })}
        {text("phoneNumber", {
          label: "Phone number",
          type: "tel",
          autoComplete: "tel",
          required: true,
          hint: "For day-of contact at tournaments.",
        })}
      </Section>

      <Section title="Parent or guardian">
        {text("parentEmail", {
          label: "Parent or guardian email",
          type: "email",
          required: true,
          hint: "Gets a copy of every team news email.",
        })}
        {text("parentPhone", {
          label: "Parent or guardian phone",
          type: "tel",
          required: true,
          hint: "Officers call this only for tournament logistics or an emergency.",
        })}
      </Section>

      <Section title="Debate">
        <fieldset>
          <legend className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
            Events you compete in
            <span className="ml-1.5 text-bad" aria-hidden="true">
              *
            </span>
          </legend>
          <p className="mt-1 text-sm text-ink/60">Officers use this when planning entries and practice groups.</p>
          <div className="mt-3 space-y-2.5">
            {(Object.keys(DEBATE_EVENTS) as (keyof typeof DEBATE_EVENTS)[]).map((key) => (
              <Checkbox
                key={key}
                label={DEBATE_EVENTS[key]}
                checked={values.events.includes(key)}
                onChange={() => toggleEvent(key)}
              />
            ))}
          </div>
          {fieldErrors.events ? (
            <p className="mt-2 border-l-4 border-bad pl-3 text-sm font-semibold text-bad">{fieldErrors.events}</p>
          ) : null}
        </fieldset>

        {text("partnerName", {
          label: "Preferred partner",
          hint: "Who you usually debate with. Leave blank if you would like officers to pair you.",
        })}
        {text("nsdaMemberId", {
          label: "NSDA member ID",
          hint: "If you know it. Officers verify membership status separately.",
        })}
      </Section>

      <div className="flex items-center gap-6 border-t-2 border-rule-faint pt-5">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-5 w-full border-b-2 border-rule pb-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
