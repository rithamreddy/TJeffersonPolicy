/**
 * Officer-built forms and member responses.
 *
 * Three rules shape this file:
 *
 *  1. Answers are validated against the stored questions, never against what
 *     the browser claims the questions are. A member cannot answer a choice
 *     question with a value that was never offered, or skip a required one.
 *
 *  2. Once a form has responses its structure is locked. Answers are keyed by
 *     question id, so deleting a question, changing its type, or editing its
 *     choices would orphan or silently reinterpret answers already given.
 *     Labels, help text, "required", and order stay editable — fixing a typo
 *     must not require rebuilding the form.
 *
 *  3. A form is accepting answers only while it is OPEN *and* before its close
 *     date. The date wins over the status, so nobody has to remember to flip a
 *     form to Closed at midnight.
 */
import type { Form, FormField } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../auth/guards";
import { CHOICE_FIELD_TYPES, type FormFieldType } from "../constants";
import { toCsv } from "../csv";
import { parseRecord, parseStringList, serializeStringList } from "../json";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function isFormAcceptingResponses(form: Pick<Form, "status" | "closesAt">, now = new Date()): boolean {
  return form.status === "OPEN" && (!form.closesAt || form.closesAt > now);
}

export function fieldOptions(field: Pick<FormField, "options">): string[] {
  return parseStringList(field.options);
}

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue>;

export function parseAnswers(raw: string): Answers {
  const record = parseRecord(raw);
  const out: Answers = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value)) out[key] = value.filter((v): v is string => typeof v === "string");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Answer validation (pure — see tests/forms.test.ts)
// ---------------------------------------------------------------------------

type FieldForValidation = Pick<FormField, "id" | "type" | "label" | "required" | "options">;

const TEXT_LIMITS: Partial<Record<FormFieldType, number>> = { SHORT_TEXT: 500, LONG_TEXT: 5_000 };

/**
 * Check a submission against the form's questions.
 *
 * Returns the cleaned answers (trimmed, de-duplicated, unknown ids dropped,
 * empty optional answers omitted) and a message per question that failed.
 */
export function validateAnswers(
  fields: readonly FieldForValidation[],
  submitted: Answers,
): { clean: Answers; errors: Record<string, string> } {
  const clean: Answers = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const type = field.type as FormFieldType;
    const raw = submitted[field.id];
    const options = fieldOptions(field);

    if (type === "MULTI_CHOICE") {
      const picked = Array.isArray(raw) ? [...new Set(raw.map((v) => v.trim()).filter(Boolean))] : [];
      const invalid = picked.filter((value) => !options.includes(value));
      if (invalid.length) {
        errors[field.id] = "Choose from the options given.";
        continue;
      }
      if (picked.length === 0) {
        if (field.required) errors[field.id] = "Choose at least one option.";
        continue;
      }
      // Keep the officer's option order rather than click order, so exports line up.
      clean[field.id] = options.filter((option) => picked.includes(option));
      continue;
    }

    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (field.required) errors[field.id] = "This question is required.";
      continue;
    }

    switch (type) {
      case "SINGLE_CHOICE":
      case "DROPDOWN":
        if (!options.includes(value)) {
          errors[field.id] = "Choose one of the options given.";
          continue;
        }
        break;
      case "NUMBER":
        if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) {
          errors[field.id] = "Enter a number.";
          continue;
        }
        break;
      case "DATE": {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        const date = match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])) : null;
        // Round-trip check rejects impossible dates such as 2026-02-31.
        if (!date || date.toISOString().slice(0, 10) !== value) {
          errors[field.id] = "Enter a valid date.";
          continue;
        }
        break;
      }
      default: {
        const limit = TEXT_LIMITS[type] ?? 500;
        if (value.length > limit) {
          errors[field.id] = `Keep this under ${limit.toLocaleString()} characters.`;
          continue;
        }
      }
    }

    clean[field.id] = value;
  }

  return { clean, errors };
}

// ---------------------------------------------------------------------------
// Officer side
// ---------------------------------------------------------------------------

export interface FormFieldInput {
  id?: string;
  type: FormFieldType;
  label: string;
  helpText?: string;
  required: boolean;
  options: string[];
}

export interface FormInput {
  title: string;
  description?: string;
  status: string;
  closesAt?: Date;
  fields: FormFieldInput[];
}

export async function listFormsForOfficers() {
  return prisma.form.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { responses: true, fields: true } } },
  });
}

export async function getFormForOfficer(id: string) {
  return prisma.form.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { position: "asc" } },
      responses: {
        orderBy: { submittedAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              ionUsername: true,
              gradeNumber: true,
              contactEmail: true,
              tjEmail: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Throw if `incoming` would change the structure of a form that already has
 * answers. Pure, so the rule is testable without a database.
 */
export function assertStructureUnchanged(
  existing: readonly Pick<FormField, "id" | "type" | "options">[],
  incoming: readonly FormFieldInput[],
): void {
  const reason = structureChange(existing, incoming);
  if (reason) {
    throw new HttpError(
      409,
      `${reason} Members have already answered this form, so its questions can no longer be added, removed, retyped, or have their choices changed — only relabelled or reordered. Close it and create a new form if the questions need to change.`,
      "form_locked",
    );
  }
}

export function structureChange(
  existing: readonly Pick<FormField, "id" | "type" | "options">[],
  incoming: readonly FormFieldInput[],
): string | null {
  if (incoming.some((field) => !field.id)) return "A new question was added.";

  const byId = new Map(existing.map((field) => [field.id, field]));
  if (incoming.length !== existing.length || incoming.some((field) => !byId.has(field.id!))) {
    return "A question was removed.";
  }

  for (const field of incoming) {
    const before = byId.get(field.id!)!;
    if (before.type !== field.type) return `"${field.label}" changed type.`;
    const beforeOptions = parseStringList(before.options);
    if (JSON.stringify(beforeOptions) !== JSON.stringify(field.options)) return `The choices for "${field.label}" changed.`;
  }
  return null;
}

/** Choice lists are meaningless on non-choice questions; drop them there. */
function normalisedOptions(field: FormFieldInput): string {
  return serializeStringList(CHOICE_FIELD_TYPES.includes(field.type) ? field.options : []);
}

export async function createForm(input: FormInput, createdById: string) {
  return prisma.form.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      closesAt: input.closesAt ?? null,
      createdById,
      fields: {
        create: input.fields.map((field, position) => ({
          position,
          type: field.type,
          label: field.label,
          helpText: field.helpText ?? null,
          required: field.required,
          options: normalisedOptions(field),
        })),
      },
    },
  });
}

export async function updateForm(id: string, input: FormInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.form.findUnique({
      where: { id },
      include: { fields: true, _count: { select: { responses: true } } },
    });
    if (!existing) throw new HttpError(404, "That form no longer exists.", "not_found");

    // Every incoming id must belong to *this* form. Without the check, a
    // crafted request could rewrite a question on some other form.
    const ownIds = new Set(existing.fields.map((field) => field.id));
    const foreign = input.fields.find((field) => field.id && !ownIds.has(field.id));
    if (foreign) throw new HttpError(400, "That question does not belong to this form.", "bad_field");

    if (existing._count.responses > 0) assertStructureUnchanged(existing.fields, input.fields);

    const keptIds = new Set(input.fields.map((field) => field.id).filter(Boolean) as string[]);
    const removed = existing.fields.filter((field) => !keptIds.has(field.id)).map((field) => field.id);
    if (removed.length) await tx.formField.deleteMany({ where: { formId: id, id: { in: removed } } });

    for (const [position, field] of input.fields.entries()) {
      const data = {
        position,
        type: field.type,
        label: field.label,
        helpText: field.helpText ?? null,
        required: field.required,
        options: normalisedOptions(field),
      };
      if (field.id) await tx.formField.update({ where: { id: field.id }, data });
      else await tx.formField.create({ data: { ...data, formId: id } });
    }

    return tx.form.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        closesAt: input.closesAt ?? null,
      },
    });
  });
}

export async function deleteForm(id: string) {
  await prisma.form.delete({ where: { id } });
}

/** Active members who have not answered — the list officers chase. */
export async function listNonResponders(formId: string) {
  return prisma.user.findMany({
    where: { status: "ACTIVE", formResponses: { none: { formId } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, displayName: true, ionUsername: true, gradeNumber: true },
  });
}

type FormWithResponses = NonNullable<Awaited<ReturnType<typeof getFormForOfficer>>>;

export function formResponsesToCsv(form: FormWithResponses): string {
  const header = [
    "Submitted",
    "Last updated",
    "Name",
    "Ion username",
    "Grade",
    "Personal email",
    "School email",
    ...form.fields.map((field) => field.label),
  ];

  const rows = form.responses.map((response) => {
    const answers = parseAnswers(response.answers);
    return [
      response.submittedAt.toISOString(),
      response.updatedAt.toISOString(),
      response.user.displayName,
      response.user.ionUsername,
      response.user.gradeNumber ? String(response.user.gradeNumber) : "",
      response.user.contactEmail ?? "",
      response.user.tjEmail ?? "",
      ...form.fields.map((field) => {
        const value = answers[field.id];
        return Array.isArray(value) ? value.join("; ") : (value ?? "");
      }),
    ];
  });

  return toCsv(header, rows);
}

// ---------------------------------------------------------------------------
// Member side
// ---------------------------------------------------------------------------

/**
 * What a member sees in the portal: every form still accepting answers, plus
 * closed ones they answered (so they can look back at what they said). Drafts
 * never appear.
 */
export async function listFormsForMember(userId: string, now = new Date()) {
  const forms = await prisma.form.findMany({
    where: {
      status: { in: ["OPEN", "CLOSED"] },
      OR: [{ status: "OPEN" }, { responses: { some: { userId } } }],
    },
    orderBy: [{ closesAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: {
      _count: { select: { fields: true } },
      responses: { where: { userId }, select: { id: true, updatedAt: true } },
    },
  });

  return forms.map((form) => ({
    ...form,
    accepting: isFormAcceptingResponses(form, now),
    myResponse: form.responses[0] ?? null,
  }));
}

export async function getFormForMember(formId: string, userId: string) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      fields: { orderBy: { position: "asc" } },
      responses: { where: { userId } },
    },
  });
  if (!form || form.status === "DRAFT") return null;
  return { ...form, myResponse: form.responses[0] ?? null };
}

/** Sidebar badge: open forms this member has not answered. */
export async function countUnansweredForms(userId: string, now = new Date()): Promise<number> {
  return prisma.form.count({
    where: {
      status: "OPEN",
      OR: [{ closesAt: null }, { closesAt: { gt: now } }],
      responses: { none: { userId } },
    },
  });
}

export async function submitFormResponse(formId: string, userId: string, submitted: Answers) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: { orderBy: { position: "asc" } } },
  });
  if (!form || form.status === "DRAFT") throw new HttpError(404, "That form is not available.", "not_found");
  if (!isFormAcceptingResponses(form)) {
    throw new HttpError(409, "This form has closed and is no longer accepting answers.", "form_closed");
  }

  const { clean, errors } = validateAnswers(form.fields, submitted);
  if (Object.keys(errors).length) {
    throw new HttpError(422, "Some answers need attention.", "invalid_answers", errors);
  }

  const answers = JSON.stringify(clean);
  return prisma.formResponse.upsert({
    where: { formId_userId: { formId, userId } },
    create: { formId, userId, answers },
    update: { answers },
  });
}
