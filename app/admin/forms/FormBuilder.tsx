"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Alert } from "@/components/ui/States";
import { CHOICE_FIELD_TYPES, FORM_FIELD_TYPES, FORM_STATUSES, type FormFieldType } from "@/lib/constants";
import { ApiError, api } from "@/lib/client/api";
import { wallClockToIso } from "@/lib/utils/wall-clock";
import type { FieldDraft, FormDraft } from "./formDraft";

/**
 * Builds and edits a form.
 *
 * When `responseCount` is above zero the structure is locked — see the note in
 * lib/services/forms.ts. The server enforces that regardless; the controls are
 * disabled here only so an officer is not invited to make a change that would
 * be refused.
 */
export function FormBuilder({
  formId,
  initial,
  responseCount = 0,
}: {
  formId?: string;
  initial: FormDraft;
  responseCount?: number;
}) {
  const router = useRouter();
  const nextKey = useRef(initial.fields.length);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const locked = responseCount > 0;

  function update(patch: Partial<FormDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setNotice(null);
  }

  function updateField(index: number, patch: Partial<FieldDraft>) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    }));
    setNotice(null);
  }

  function addField() {
    const key = `new-${nextKey.current++}`;
    update({
      fields: [...draft.fields, { key, type: "SHORT_TEXT", label: "", helpText: "", required: false, options: "" }],
    });
  }

  function removeField(index: number) {
    update({ fields: draft.fields.filter((_, i) => i !== index) });
  }

  function moveField(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= draft.fields.length) return;
    const fields = [...draft.fields];
    [fields[index], fields[target]] = [fields[target], fields[index]];
    update({ fields });
  }

  async function save() {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setNotice(null);

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: draft.status,
      closesAt: wallClockToIso(draft.closesAt) ?? "",
      fields: draft.fields.map((field) => ({
        ...(field.id ? { id: field.id } : {}),
        type: field.type,
        label: field.label.trim(),
        helpText: field.helpText.trim(),
        required: field.required,
        options: CHOICE_FIELD_TYPES.includes(field.type)
          ? field.options
              .split("\n")
              .map((option) => option.trim())
              .filter(Boolean)
          : [],
      })),
    };

    try {
      if (formId) {
        await api.put(`/api/admin/forms/${formId}`, payload);
        setNotice(
          draft.status === "OPEN"
            ? "Saved. The form is open — members see it in their portal now."
            : draft.status === "CLOSED"
              ? "Saved. The form is closed to new answers."
              : "Saved as a draft. Members cannot see it until you open it.",
        );
        router.refresh();
      } else {
        const created = await api.post<{ id: string }>("/api/admin/forms", payload);
        router.push(`/admin/forms/${created.id}`);
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

  async function remove() {
    if (!formId) return;
    setBusy(true);
    try {
      await api.delete(`/api/admin/forms/${formId}`);
      router.push("/admin/forms");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="space-y-10"
        noValidate
      >
        {notice ? <Alert tone="good">{notice}</Alert> : null}
        {error ? (
          <Alert tone="bad" title="Could not save">
            {error}
          </Alert>
        ) : null}

        <div className="space-y-5">
          <Field label="Title" required error={fieldErrors.title}>
            {({ id, invalid }) => (
              <TextInput
                id={id}
                invalid={invalid}
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                maxLength={200}
                placeholder="e.g. Permission slip — Harvard tournament"
              />
            )}
          </Field>

          <Field label="Description" hint="Optional. Shown to members above the questions." error={fieldErrors.description}>
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                rows={3}
                aria-describedby={describedBy}
                invalid={invalid}
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
                maxLength={2000}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Status"
              hint="Members only see Open and Closed forms. Drafts are private to officers."
            >
              {({ id, describedBy }) => (
                <Select id={id} aria-describedby={describedBy} value={draft.status} onChange={(e) => update({ status: e.target.value })}>
                  {Object.entries(FORM_STATUSES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label="Closes at"
              hint="Optional, Eastern time. After this the form stops taking answers even if it is still marked Open."
              error={fieldErrors.closesAt}
            >
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  type="datetime-local"
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={draft.closesAt}
                  onChange={(e) => update({ closesAt: e.target.value })}
                />
              )}
            </Field>
          </div>
        </div>

        <section aria-labelledby="questions-heading" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-rule pb-3">
            <h2 id="questions-heading" className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Questions
            </h2>
            <span className="text-sm text-ink/60">
              {draft.fields.length} question{draft.fields.length === 1 ? "" : "s"}
            </span>
          </div>

          {locked ? (
            <Alert tone="warn" title="Questions are locked">
              {responseCount} member{responseCount === 1 ? " has" : "s have"} already answered. You can still fix wording,
              help text, and whether a question is required, and reorder questions — but not add, remove, or retype
              them, or change their choices, because that would scramble the answers already given.
            </Alert>
          ) : null}

          {fieldErrors.fields ? <Alert tone="bad">{fieldErrors.fields}</Alert> : null}

          <ol className="space-y-6">
            {draft.fields.map((field, index) => {
              const isChoice = CHOICE_FIELD_TYPES.includes(field.type);
              const err = (name: string) => fieldErrors[`fields.${index}.${name}`];
              return (
                <li key={field.key} className="border-2 border-rule bg-paper-raised p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-display text-xs font-bold uppercase tracking-[0.16em] text-ink/60">
                      Question {index + 1}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move question ${index + 1} up`}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => moveField(index, 1)}
                        disabled={index === draft.fields.length - 1}
                        aria-label={`Move question ${index + 1} down`}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => removeField(index)}
                        disabled={locked || draft.fields.length === 1}
                        aria-label={`Remove question ${index + 1}`}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
                    <Field label="Question" required error={err("label")}>
                      {({ id, invalid }) => (
                        <TextInput
                          id={id}
                          invalid={invalid}
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          maxLength={300}
                        />
                      )}
                    </Field>
                    <Field label="Type" error={err("type")}>
                      {({ id }) => (
                        <Select
                          id={id}
                          value={field.type}
                          disabled={locked && Boolean(field.id)}
                          onChange={(e) => updateField(index, { type: e.target.value as FormFieldType })}
                        >
                          {Object.entries(FORM_FIELD_TYPES).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>

                  {isChoice ? (
                    <Field
                      className="mt-5"
                      label="Choices"
                      required
                      hint={
                        field.type === "MULTI_CHOICE"
                          ? "One per line. A single choice works as an “I agree” checkbox."
                          : "One per line. At least two."
                      }
                      error={err("options")}
                    >
                      {({ id, describedBy, invalid }) => (
                        <TextArea
                          id={id}
                          rows={4}
                          aria-describedby={describedBy}
                          invalid={invalid}
                          value={field.options}
                          disabled={locked && Boolean(field.id)}
                          onChange={(e) => updateField(index, { options: e.target.value })}
                        />
                      )}
                    </Field>
                  ) : null}

                  <Field className="mt-5" label="Help text" hint="Optional. Shown under the question." error={err("helpText")}>
                    {({ id, describedBy, invalid }) => (
                      <TextInput
                        id={id}
                        aria-describedby={describedBy}
                        invalid={invalid}
                        value={field.helpText}
                        onChange={(e) => updateField(index, { helpText: e.target.value })}
                        maxLength={500}
                      />
                    )}
                  </Field>

                  <div className="mt-4">
                    <Checkbox
                      label="Required"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                    />
                  </div>
                </li>
              );
            })}
          </ol>

          <Button type="button" variant="outline" onClick={addField} disabled={locked || draft.fields.length >= 50}>
            + Add question
          </Button>
        </section>

        <div className="flex flex-wrap gap-3 border-t-2 border-rule-faint pt-6">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : formId ? "Save form" : "Create form"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/forms")} disabled={busy}>
            Back
          </Button>
        </div>
      </form>

      {formId ? (
        <div className="border-2 border-bad/40 bg-bad-pale/50 p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-bad">Delete this form</h2>
          <p className="mt-2 text-base text-ink/75">
            {responseCount > 0
              ? `Permanently deletes the form and all ${responseCount} response${responseCount === 1 ? "" : "s"}. Export the CSV first if you need them. Closing the form keeps the answers instead.`
              : "Permanent. Close the form instead if you might want it back."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {confirmingDelete ? (
              <>
                <Button variant="danger" onClick={remove} disabled={busy} autoFocus>
                  Yes, delete permanently
                </Button>
                <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                Delete form
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
