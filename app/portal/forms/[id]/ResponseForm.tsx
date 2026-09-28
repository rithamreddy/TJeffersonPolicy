"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { ApiError, api } from "@/lib/client/api";

export interface ResponseField {
  id: string;
  type: string;
  label: string;
  helpText: string | null;
  required: boolean;
  options: string[];
}

type Answers = Record<string, string | string[]>;

/**
 * Renders a form's questions and submits the member's answers.
 *
 * The required check here is only for fast feedback; the server re-validates
 * everything against the stored questions (lib/services/forms.ts), and its
 * per-question messages land next to the right question.
 */
export function ResponseForm({
  formId,
  fields,
  initial,
  readOnly,
  hasResponse,
}: {
  formId: string;
  fields: ResponseField[];
  initial: Answers;
  readOnly: boolean;
  hasResponse: boolean;
}) {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set(id: string, value: string | string[]) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setStatus("idle");
    // Clear this question's error as soon as it is edited.
    setFieldErrors((current) => {
      if (!current[id]) return current;
      const rest = { ...current };
      delete rest[id];
      return rest;
    });
  }

  function toggle(id: string, option: string) {
    const current = Array.isArray(answers[id]) ? (answers[id] as string[]) : [];
    set(id, current.includes(option) ? current.filter((value) => value !== option) : [...current, option]);
  }

  function showErrors(message: string, errors: Record<string, string>) {
    setError(message);
    setFieldErrors(errors);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly) return;

    const missing: Record<string, string> = {};
    for (const field of fields) {
      const value = answers[field.id];
      const empty = Array.isArray(value) ? value.length === 0 : !value?.trim();
      if (field.required && empty) missing[field.id] = "This question is required.";
    }
    if (Object.keys(missing).length) {
      showErrors("Some required questions are unanswered.", missing);
      return;
    }

    setStatus("saving");
    setError(null);
    setFieldErrors({});
    try {
      await api.put(`/api/forms/${formId}/response`, { answers });
      setStatus("saved");
      router.refresh();
    } catch (caught) {
      setStatus("idle");
      if (caught instanceof ApiError) {
        // Service errors are keyed by question id; zod shape errors arrive as
        // "answers.<id>". Normalise to the question id.
        const normalised: Record<string, string> = {};
        for (const [key, message] of Object.entries(caught.fields ?? {})) {
          normalised[key.replace(/^answers\./, "")] = message;
        }
        showErrors(caught.message, normalised);
      } else {
        showErrors("Could not save your answers. Please try again.", {});
      }
    }
  }

  return (
    <form onSubmit={submit} className="space-y-10" noValidate>
      <div ref={topRef} className="scroll-mt-24 space-y-4">
        {status === "saved" ? (
          <Alert tone="good">{hasResponse ? "Your answers are updated." : "Thanks — your answers are saved."}</Alert>
        ) : null}
        {error ? (
          <Alert tone="bad" title="Not saved">
            {error}
          </Alert>
        ) : null}
      </div>

      {fields.map((field, index) => (
        <Question
          key={field.id}
          number={index + 1}
          field={field}
          value={answers[field.id]}
          error={fieldErrors[field.id]}
          disabled={readOnly}
          onChange={(value) => set(field.id, value)}
          onToggle={(option) => toggle(field.id, option)}
        />
      ))}

      {readOnly ? null : (
        <div className="border-t-2 border-rule-faint pt-6">
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : hasResponse ? "Update answers" : "Submit"}
          </Button>
        </div>
      )}
    </form>
  );
}

function Question({
  number,
  field,
  value,
  error,
  disabled,
  onChange,
  onToggle,
}: {
  number: number;
  field: ResponseField;
  value: string | string[] | undefined;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: (option: string) => void;
}) {
  const label = `${number}. ${field.label}`;
  const text = typeof value === "string" ? value : "";

  // Radio and checkbox questions are groups of controls, so they get a
  // fieldset and legend; everything else is a single labelled control.
  if (field.type === "SINGLE_CHOICE" || field.type === "MULTI_CHOICE") {
    const picked = Array.isArray(value) ? value : [];
    return (
      <fieldset aria-invalid={Boolean(error) || undefined} className="space-y-3">
        <legend className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
          {label}
          {field.required ? (
            <span className="ml-1.5 text-bad" aria-hidden="true">
              *
            </span>
          ) : null}
        </legend>
        {field.helpText ? <p className="text-sm leading-relaxed text-ink/60">{field.helpText}</p> : null}
        <div className="space-y-1.5 pt-1">
          {field.options.map((option) =>
            field.type === "MULTI_CHOICE" ? (
              <Checkbox
                key={option}
                label={option}
                checked={picked.includes(option)}
                disabled={disabled}
                onChange={() => onToggle(option)}
              />
            ) : (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3.5 border-2 border-transparent py-1 text-base text-ink hover:border-rule-faint"
              >
                <input
                  type="radio"
                  name={field.id}
                  className="c-checkbox mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
                  checked={text === option}
                  disabled={disabled}
                  onChange={() => onChange(option)}
                />
                <span className="leading-snug">{option}</span>
              </label>
            ),
          )}
        </div>
        {error ? <p className="border-l-4 border-bad pl-3 text-sm font-semibold text-bad">{error}</p> : null}
      </fieldset>
    );
  }

  return (
    <Field label={label} hint={field.helpText ?? undefined} required={field.required} error={error}>
      {({ id, describedBy, invalid }) => {
        const common = { id, "aria-describedby": describedBy, invalid, disabled };
        switch (field.type) {
          case "LONG_TEXT":
            return <TextArea {...common} rows={5} maxLength={5000} value={text} onChange={(e) => onChange(e.target.value)} />;
          case "DROPDOWN":
            return (
              <Select {...common} value={text} onChange={(e) => onChange(e.target.value)}>
                <option value="">Choose…</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            );
          case "NUMBER":
            return <TextInput {...common} type="number" step="any" inputMode="decimal" value={text} onChange={(e) => onChange(e.target.value)} />;
          case "DATE":
            return <TextInput {...common} type="date" value={text} onChange={(e) => onChange(e.target.value)} />;
          default:
            return <TextInput {...common} maxLength={500} value={text} onChange={(e) => onChange(e.target.value)} />;
        }
      }}
    </Field>
  );
}
