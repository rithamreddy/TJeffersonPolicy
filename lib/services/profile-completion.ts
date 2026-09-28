/**
 * What counts as a finished member profile.
 *
 * These are the details officers cannot run the team without: a working
 * personal address (news emails go there), a school address (Tabroom and
 * school forms), a phone for day-of contact, a parent or guardian for trips,
 * and at least one event so entries can be planned.
 *
 * Pure and dependency-free on purpose — it runs in two layouts on every page
 * load and is covered directly by tests/profile-completion.test.ts.
 */
import { parseStringList } from "../json";

export interface ProfileCompletionInput {
  contactEmail: string | null;
  tjEmail: string | null;
  phoneNumber: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  events: string;
}

export const REQUIRED_PROFILE_FIELDS = [
  { key: "contactEmail", label: "personal email" },
  { key: "tjEmail", label: "school email" },
  { key: "phoneNumber", label: "phone number" },
  { key: "parentEmail", label: "parent or guardian email" },
  { key: "parentPhone", label: "parent or guardian phone" },
  { key: "events", label: "the events you compete in" },
] as const;

export type RequiredProfileField = (typeof REQUIRED_PROFILE_FIELDS)[number];

/** The required fields this member has not filled in yet, in display order. */
export function missingProfileFields(user: ProfileCompletionInput): RequiredProfileField[] {
  return REQUIRED_PROFILE_FIELDS.filter((field) => {
    if (field.key === "events") return parseStringList(user.events).length === 0;
    return !user[field.key]?.trim();
  });
}

/** "a, b, and c" — reads naturally in the setup banner. */
export function listInEnglish(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
