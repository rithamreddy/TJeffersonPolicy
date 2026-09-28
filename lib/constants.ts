/**
 * Domain vocabularies.
 *
 * SQLite cannot express enums, so every status column is a plain string. These
 * const maps are the single definition of the allowed values and their human
 * labels; lib/validation/schemas.ts derives its zod unions from them, so a new
 * value cannot be added in one place and forgotten in the other.
 */

export const ROLES = {
  MEMBER: "Member",
  OFFICER: "Officer",
} as const;
export type Role = keyof typeof ROLES;

export const MEMBER_STATUSES = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ALUMNI: "Alumni",
} as const;
export type MemberStatus = keyof typeof MEMBER_STATUSES;

/** Key order is display order: most to least experienced. */
export const DEBATE_EVENTS = {
  POLICY_VARSITY: "Policy Debate — Varsity",
  POLICY_JV: "Policy Debate — JV",
  POLICY_NOVICE: "Policy Debate — Novice",
} as const;
export type DebateEvent = keyof typeof DEBATE_EVENTS;

export const NSDA_STATUSES = {
  UNKNOWN: "Not recorded",
  NOT_MEMBER: "Not a member",
  PENDING: "Pending",
  ACTIVE: "Active",
} as const;
export type NsdaStatus = keyof typeof NSDA_STATUSES;

export const TOURNAMENT_STATUSES = {
  DRAFT: "Draft",
  OPEN: "Registration open",
  CLOSED: "Registration closed",
  ARCHIVED: "Archived",
} as const;
export type TournamentStatus = keyof typeof TOURNAMENT_STATUSES;

export const TOURNAMENT_CIRCUITS = {
  LOCAL: "Local",
  REGIONAL: "Regional",
  STATE: "State",
  NATIONAL: "National",
  ONLINE: "Online",
  SCRIMMAGE: "Scrimmage",
} as const;
export type TournamentCircuit = keyof typeof TOURNAMENT_CIRCUITS;

/**
 * The workflow status shared by registrations and orders: something is
 * requested, an officer may put it on hold, or it is settled.
 *
 * Withdrawing a registration or cancelling an order removes the row instead of
 * flagging it — see lib/services/registrations.ts and the order deletion path
 * in lib/services/orders.ts — so there is no fourth "withdrawn" or "cancelled"
 * value to track here.
 */
export const SIMPLE_STATUSES = {
  PENDING: "Pending",
  WAITLISTED: "Waitlisted",
  REGISTERED: "Registered",
} as const;

export const REGISTRATION_STATUSES = SIMPLE_STATUSES;
export type RegistrationStatus = keyof typeof REGISTRATION_STATUSES;

export const DUES_STATUSES = {
  UNPAID: "Unpaid",
  PENDING: "Pending",
  PAID: "Paid",
  WAIVED: "Waived",
} as const;
export type DuesStatus = keyof typeof DUES_STATUSES;

export const ORDER_STATUSES = SIMPLE_STATUSES;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export const ORDER_CATEGORIES = {
  APPAREL: "Apparel",
  MERCH: "Merchandise",
  MEMBERSHIP: "Membership",
  OTHER: "Other",
} as const;
export type OrderCategory = keyof typeof ORDER_CATEGORIES;

export const ACHIEVEMENT_LEVELS = {
  NATIONAL: "National",
  STATE: "State",
  REGIONAL: "Regional",
  INVITATIONAL: "Invitational",
  LOCAL: "Local",
} as const;
export type AchievementLevel = keyof typeof ACHIEVEMENT_LEVELS;

export const RESOURCE_CATEGORIES = {
  EVIDENCE: "Evidence",
  CASES: "Case files",
  RESEARCH: "Research",
  THEORY: "Debate theory",
  STRATEGY: "Strategy",
  GUIDES: "Guides",
  TEMPLATES: "Templates",
  EXTERNAL: "External resources",
} as const;
export type ResourceCategory = keyof typeof RESOURCE_CATEGORIES;

export const RESOURCE_VISIBILITIES = {
  MEMBER: "All members",
  OFFICER: "Officers only",
} as const;
export type ResourceVisibility = keyof typeof RESOURCE_VISIBILITIES;

export const NEWS_STATUSES = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
} as const;
export type NewsStatus = keyof typeof NEWS_STATUSES;

export const NEWS_VISIBILITIES = {
  PUBLIC: "Public website and members",
  MEMBERS: "Members only",
} as const;
export type NewsVisibility = keyof typeof NEWS_VISIBILITIES;

export const FORM_STATUSES = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
} as const;
export type FormStatus = keyof typeof FORM_STATUSES;

export const FORM_FIELD_TYPES = {
  SHORT_TEXT: "Short answer",
  LONG_TEXT: "Paragraph",
  SINGLE_CHOICE: "Multiple choice",
  MULTI_CHOICE: "Checkboxes",
  DROPDOWN: "Dropdown",
  NUMBER: "Number",
  DATE: "Date",
} as const;
export type FormFieldType = keyof typeof FORM_FIELD_TYPES;

/** Question types that need a list of choices. */
export const CHOICE_FIELD_TYPES: readonly FormFieldType[] = ["SINGLE_CHOICE", "MULTI_CHOICE", "DROPDOWN"];

/** Narrow an untrusted string from the database to a known key, with fallback. */
export function asKey<T extends Record<string, string>>(map: T, value: string, fallback: keyof T): keyof T {
  return (Object.prototype.hasOwnProperty.call(map, value) ? value : fallback) as keyof T;
}

/** Look up a display label without trusting the stored value. */
export function labelFor<T extends Record<string, string>>(map: T, value: string, fallback = "Unknown"): string {
  return Object.prototype.hasOwnProperty.call(map, value) ? map[value as keyof T] : fallback;
}

/**
 * Debate seasons run August–July. Returns the start year, so 2026 means the
 * 2026–27 season.
 */
export function currentSeasonYear(now = new Date()): number {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export function seasonLabel(startYear: number): string {
  return `${startYear}–${String(startYear + 1).slice(2)}`;
}
