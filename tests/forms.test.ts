import { describe, expect, it } from "vitest";
import { structureChange, validateAnswers, isFormAcceptingResponses } from "@/lib/services/forms";
import { formFieldInputSchema, formSchema } from "@/lib/validation/schemas";
import { csvCell, toCsv } from "@/lib/csv";

const field = (id: string, type: string, extra: Partial<{ required: boolean; options: string[] }> = {}) => ({
  id,
  type,
  label: id,
  required: extra.required ?? false,
  options: JSON.stringify(extra.options ?? []),
});

describe("validateAnswers", () => {
  it("rejects a missing required answer and accepts a missing optional one", () => {
    const { clean, errors } = validateAnswers(
      [field("name", "SHORT_TEXT", { required: true }), field("note", "LONG_TEXT")],
      { name: "   " },
    );
    expect(errors.name).toMatch(/required/i);
    expect(errors.note).toBeUndefined();
    expect(clean).toEqual({});
  });

  it("only accepts choices the form actually offers", () => {
    const fields = [field("size", "DROPDOWN", { options: ["S", "M", "L"] }), field("go", "SINGLE_CHOICE", { options: ["Yes", "No"] })];
    expect(validateAnswers(fields, { size: "XXL" }).errors.size).toBeDefined();
    expect(validateAnswers(fields, { go: "Maybe" }).errors.go).toBeDefined();
    expect(validateAnswers(fields, { size: "M", go: "Yes" })).toEqual({ clean: { size: "M", go: "Yes" }, errors: {} });
  });

  it("de-duplicates checkbox answers and keeps the officer's option order", () => {
    const fields = [field("days", "MULTI_CHOICE", { options: ["Fri", "Sat", "Sun"] })];
    const { clean } = validateAnswers(fields, { days: ["Sun", "Fri", "Sun"] });
    expect(clean.days).toEqual(["Fri", "Sun"]);
  });

  it("rejects a checkbox value that was never offered", () => {
    const fields = [field("days", "MULTI_CHOICE", { options: ["Fri", "Sat"] })];
    expect(validateAnswers(fields, { days: ["Fri", "Mon"] }).errors.days).toBeDefined();
  });

  it("requires at least one ticked box on a required checkbox question", () => {
    const fields = [field("agree", "MULTI_CHOICE", { required: true, options: ["I agree"] })];
    expect(validateAnswers(fields, { agree: [] }).errors.agree).toBeDefined();
    expect(validateAnswers(fields, { agree: ["I agree"] }).errors).toEqual({});
  });

  it("validates numbers and real calendar dates", () => {
    const fields = [field("n", "NUMBER"), field("d", "DATE")];
    expect(validateAnswers(fields, { n: "12.5" }).errors).toEqual({});
    expect(validateAnswers(fields, { n: "twelve" }).errors.n).toBeDefined();
    expect(validateAnswers(fields, { d: "2026-10-03" }).errors).toEqual({});
    // Not a real date: February has no 31st.
    expect(validateAnswers(fields, { d: "2026-02-31" }).errors.d).toBeDefined();
  });

  it("drops answers to questions that are not on the form", () => {
    const { clean } = validateAnswers([field("a", "SHORT_TEXT")], { a: "x", injected: "y" });
    expect(clean).toEqual({ a: "x" });
  });

  it("caps answer length", () => {
    const { errors } = validateAnswers([field("a", "SHORT_TEXT")], { a: "x".repeat(501) });
    expect(errors.a).toMatch(/500/);
  });
});

describe("structure lock once a form has answers", () => {
  const existing = [
    { id: "q1", type: "SHORT_TEXT", options: "[]" },
    { id: "q2", type: "DROPDOWN", options: JSON.stringify(["A", "B"]) },
  ];
  const same = [
    { id: "q1", type: "SHORT_TEXT" as const, label: "Renamed", required: true, options: [] },
    { id: "q2", type: "DROPDOWN" as const, label: "Pick", required: false, options: ["A", "B"] },
  ];

  it("allows relabelling, toggling required, and reordering", () => {
    expect(structureChange(existing, same)).toBeNull();
    expect(structureChange(existing, [...same].reverse())).toBeNull();
  });

  it("refuses adding, removing, retyping, or changing choices", () => {
    expect(structureChange(existing, [...same, { type: "SHORT_TEXT", label: "New", required: false, options: [] }])).toMatch(/added/);
    expect(structureChange(existing, [same[0]])).toMatch(/removed/);
    expect(structureChange(existing, [{ ...same[0], type: "LONG_TEXT" }, same[1]])).toMatch(/type/);
    expect(structureChange(existing, [same[0], { ...same[1], options: ["A", "C"] }])).toMatch(/choices/);
  });
});

describe("isFormAcceptingResponses", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  it("needs OPEN status and an unpassed close date", () => {
    expect(isFormAcceptingResponses({ status: "OPEN", closesAt: null }, now)).toBe(true);
    expect(isFormAcceptingResponses({ status: "DRAFT", closesAt: null }, now)).toBe(false);
    expect(isFormAcceptingResponses({ status: "CLOSED", closesAt: null }, now)).toBe(false);
    // The date wins over the status.
    expect(isFormAcceptingResponses({ status: "OPEN", closesAt: new Date("2026-09-30T12:00:00Z") }, now)).toBe(false);
  });
});

describe("form builder validation", () => {
  it("requires two choices for multiple choice, but allows a single agreement checkbox", () => {
    expect(formFieldInputSchema.safeParse({ type: "SINGLE_CHOICE", label: "Q", options: ["Only"] }).success).toBe(false);
    expect(formFieldInputSchema.safeParse({ type: "MULTI_CHOICE", label: "Q", options: ["I agree"] }).success).toBe(true);
  });

  it("rejects duplicate choices regardless of case", () => {
    expect(formFieldInputSchema.safeParse({ type: "DROPDOWN", label: "Q", options: ["Yes", "yes"] }).success).toBe(false);
  });

  it("requires at least one question", () => {
    expect(formSchema.safeParse({ title: "T", fields: [] }).success).toBe(false);
  });
});

describe("CSV export", () => {
  it("neutralises spreadsheet formulas in member-typed answers", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell("+1 703 555 0100")).toBe(`"'+1 703 555 0100"`);
    expect(csvCell("plain")).toBe(`"plain"`);
  });

  it("joins rows with CRLF", () => {
    expect(toCsv(["a", "b"], [["1", "2"]])).toBe(`"a","b"\r\n"1","2"`);
  });
});
