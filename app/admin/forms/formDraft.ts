/**
 * The shape the form builder edits, and the conversion from what the database
 * stores.
 *
 * No "use client" directive, on purpose: the edit page is a server component
 * that builds the initial draft during render, and a function exported from a
 * client module cannot be called from the server at all. This is the same
 * split as app/admin/tournaments/tournamentDraft.ts, for the same reason.
 */
import type { FormFieldType } from "@/lib/constants";
import { parseStringList } from "@/lib/json";
import { isoToWallClock } from "@/lib/utils/wall-clock";

export interface FieldDraft {
  /** Stable React key; not sent to the server. */
  key: string;
  /** Present for a question that already exists in the database. */
  id?: string;
  type: FormFieldType;
  label: string;
  helpText: string;
  required: boolean;
  /** One choice per line. */
  options: string;
}

export interface FormDraft {
  title: string;
  description: string;
  status: string;
  /** School-timezone wall clock, as a datetime-local input expects. */
  closesAt: string;
  fields: FieldDraft[];
}

export const emptyFormDraft: FormDraft = {
  title: "",
  description: "",
  status: "DRAFT",
  closesAt: "",
  fields: [{ key: "new-0", type: "SHORT_TEXT", label: "", helpText: "", required: true, options: "" }],
};

export function draftFromForm(form: {
  title: string;
  description: string | null;
  status: string;
  closesAt: Date | null;
  fields: { id: string; type: string; label: string; helpText: string | null; required: boolean; options: string }[];
}): FormDraft {
  return {
    title: form.title,
    description: form.description ?? "",
    status: form.status,
    closesAt: isoToWallClock(form.closesAt?.toISOString(), true),
    fields: form.fields.map((field) => ({
      key: field.id,
      id: field.id,
      type: field.type as FormFieldType,
      label: field.label,
      helpText: field.helpText ?? "",
      required: field.required,
      options: parseStringList(field.options).join("\n"),
    })),
  };
}
