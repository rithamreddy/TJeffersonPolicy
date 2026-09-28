/**
 * Input validation.
 *
 * Every value that crosses the network boundary is parsed here before it
 * reaches a service. Unions are derived from lib/constants.ts so the accepted
 * values and the displayed labels cannot drift apart.
 */
import { z } from "zod";
import {
  ACHIEVEMENT_LEVELS,
  CHOICE_FIELD_TYPES,
  DEBATE_EVENTS,
  FORM_FIELD_TYPES,
  FORM_STATUSES,
  MEMBER_STATUSES,
  NEWS_STATUSES,
  NEWS_VISIBILITIES,
  NSDA_STATUSES,
  ORDER_CATEGORIES,
  ORDER_STATUSES,
  REGISTRATION_STATUSES,
  RESOURCE_CATEGORIES,
  RESOURCE_VISIBILITIES,
  ROLES,
  TOURNAMENT_CIRCUITS,
  TOURNAMENT_STATUSES,
} from "../constants";

const keysOf = <T extends Record<string, string>>(map: T) => Object.keys(map) as [keyof T & string, ...(keyof T & string)[]];

export const roleSchema = z.enum(keysOf(ROLES));
export const memberStatusSchema = z.enum(keysOf(MEMBER_STATUSES));
export const debateEventSchema = z.enum(keysOf(DEBATE_EVENTS));
export const nsdaStatusSchema = z.enum(keysOf(NSDA_STATUSES));
export const tournamentStatusSchema = z.enum(keysOf(TOURNAMENT_STATUSES));
export const tournamentCircuitSchema = z.enum(keysOf(TOURNAMENT_CIRCUITS));
export const registrationStatusSchema = z.enum(keysOf(REGISTRATION_STATUSES));
export const orderStatusSchema = z.enum(keysOf(ORDER_STATUSES));
export const orderCategorySchema = z.enum(keysOf(ORDER_CATEGORIES));
export const achievementLevelSchema = z.enum(keysOf(ACHIEVEMENT_LEVELS));
export const resourceCategorySchema = z.enum(keysOf(RESOURCE_CATEGORIES));
export const resourceVisibilitySchema = z.enum(keysOf(RESOURCE_VISIBILITIES));
export const newsStatusSchema = z.enum(keysOf(NEWS_STATUSES));
export const newsVisibilitySchema = z.enum(keysOf(NEWS_VISIBILITIES));
export const formStatusSchema = z.enum(keysOf(FORM_STATUSES));
export const formFieldTypeSchema = z.enum(keysOf(FORM_FIELD_TYPES));

export const idSchema = z.string().min(1).max(64);
const shortText = z.string().trim().min(1).max(200);
const mediumText = z.string().trim().max(2_000);
const longText = z.string().trim().max(50_000);
const optionalShort = z.string().trim().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined));

/**
 * Links are stored and later rendered as anchors, so the scheme allowlist is a
 * security control, not a formality: it blocks javascript: and data: URLs.
 */
export const externalUrlSchema = z
  .url()
  .max(2_000)
  .refine((value) => {
    try {
      return ["http:", "https:", "mailto:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Link must be an http(s) or mailto address.");

const optionalUrl = externalUrlSchema.optional().or(z.literal("")).transform((v) => (v ? v : undefined));

const optionalDate = z.coerce.date().optional().or(z.literal("")).transform((v) => (v instanceof Date ? v : undefined));

const centsSchema = z.number().int().min(0).max(1_000_000);

// ---------------------------------------------------------------------------
// Member-facing input
// ---------------------------------------------------------------------------

const phoneNumberSchema = z
  .string()
  .trim()
  .min(7, "Enter a phone number.")
  .max(30)
  .regex(/^[0-9+()\-.\s]+$/, "Use only digits and phone punctuation.");

/**
 * Blank or omitted means "clear this field"; anything else must be a real
 * address. The service writes `undefined` as null, so the profile form always
 * sends every field.
 */
const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => v || undefined)
  .pipe(z.email("Enter a valid email address.").optional());

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined)
  .pipe(phoneNumberSchema.optional());

/**
 * Every field is optional on save, so a member can fill the form in over
 * several visits. Which fields are *required* for a complete profile is a
 * separate question, answered by missingProfileFields() in
 * lib/services/profile-completion.ts — that is what drives the setup banner.
 */
export const updateProfileSchema = z.object({
  contactEmail: optionalEmail,
  tjEmail: optionalEmail,
  phoneNumber: optionalPhone,
  parentEmail: optionalEmail,
  parentPhone: optionalPhone,
  events: z.array(debateEventSchema).max(4).default([]),
  partnerName: optionalShort,
  nsdaMemberId: optionalShort,
});

/*
 * Registrations: collected fresh at every registration — see the comment on
 * TournamentRegistration in prisma/schema.prisma for why this isn't just read
 * from the member's profile. Everything except the note officers might want is
 * required: policy is a two-person event, and officers need working contact
 * information and a partner to actually enter the team.
 */

export const createRegistrationSchema = z.object({
  tournamentId: idSchema,
  divisionId: idSchema,
  partnerName: shortText,
  schoolEmail: z.email().max(200),
  tabroomEmail: z.email().max(200),
  phoneNumber: phoneNumberSchema,
  grade: z.number().int().min(9).max(12),
  partnerSchoolEmail: z.email().max(200),
  memberNote: z.string().trim().max(1_000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export const withdrawRegistrationSchema = z.object({ registrationId: idSchema });

export const createOrderSchema = z.object({
  itemId: idSchema,
  quantity: z.number().int().min(1).max(20).default(1),
  size: optionalShort,
  memberNote: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

// ---------------------------------------------------------------------------
// Officer input
// ---------------------------------------------------------------------------

export const tournamentDivisionSchema = z.object({
  id: idSchema.optional(),
  name: shortText,
  code: optionalShort,
  feeCents: centsSchema.optional(),
  capacity: z.number().int().min(1).max(500).optional(),
});

export const tournamentSchema = z.object({
  name: shortText,
  startDate: z.coerce.date(),
  endDate: optionalDate,
  location: shortText,
  circuit: tournamentCircuitSchema.default("LOCAL"),
  description: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  eligibility: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  memberNotes: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  officerNotes: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  registrationOpensAt: optionalDate,
  registrationDeadline: optionalDate,
  status: tournamentStatusSchema.default("DRAFT"),
  externalRegistrationUrl: optionalUrl,
  tabroomUrl: optionalUrl,
  tabroomId: z.number().int().positive().max(9_999_999).optional(),
  divisions: z.array(tournamentDivisionSchema).min(1, "Add at least one event or division.").max(20),
});

export const updateRegistrationSchema = z.object({
  status: registrationStatusSchema,
  officerNote: z.string().trim().max(1_000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  /** Whether this division's fee has been paid. Toggled from the member's profile. */
  feePaid: z.boolean().optional(),
});

export const updateMemberSchema = z.object({
  role: roleSchema.optional(),
  status: memberStatusSchema.optional(),
  events: z.array(debateEventSchema).max(4).optional(),
  nsdaStatus: nsdaStatusSchema.optional(),
  nsdaMemberId: optionalShort,
  gradeNumber: z.number().int().min(9).max(12).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

/**
 * Excuses a member from dues for a season regardless of what they would
 * otherwise owe. There is no amount or paid/unpaid status here — that is
 * derived from the member's own registrations and orders. See
 * lib/services/dues.ts.
 */
export const setDuesWaiverSchema = z.object({
  userId: idSchema,
  seasonYear: z.number().int().min(2000).max(2100),
  waived: z.boolean(),
  note: optionalShort,
});

export const updateOrderSchema = z.object({
  status: orderStatusSchema,
  officerNote: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  /** Whether this order has been paid for. Toggled from the member's profile. */
  paid: z.boolean().optional(),
});

export const orderItemSchema = z.object({
  name: shortText,
  description: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  priceCents: centsSchema.optional(),
  category: orderCategorySchema.default("MERCH"),
  externalUrl: optionalUrl,
  externalLabel: optionalShort,
  sizes: z.array(z.string().trim().min(1).max(20)).max(15).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const newsPostSchema = z.object({
  title: shortText,
  excerpt: z.string().trim().min(1).max(400),
  body: longText.min(1),
  imageUrl: optionalUrl,
  status: newsStatusSchema.default("DRAFT"),
  visibility: newsVisibilitySchema.default("PUBLIC"),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
});

export const formFieldInputSchema = z
  .object({
    /** Present when editing an existing question; absent for a new one. */
    id: idSchema.optional(),
    type: formFieldTypeSchema,
    label: z.string().trim().min(1, "Every question needs a label.").max(300),
    helpText: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  })
  .superRefine((field, ctx) => {
    const isChoice = CHOICE_FIELD_TYPES.includes(field.type);
    if (!isChoice) return;

    // A single checkbox is legitimate ("I have permission to attend"); a
    // multiple-choice or dropdown question with one option is not a question.
    const minimum = field.type === "MULTI_CHOICE" ? 1 : 2;
    if (field.options.length < minimum) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: minimum === 1 ? "Add at least one choice." : "Add at least two choices.",
      });
    }
    const lowered = field.options.map((option) => option.toLowerCase());
    if (new Set(lowered).size !== lowered.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Each choice must be different." });
    }
  });

export const formSchema = z.object({
  title: z.string().trim().min(1, "Give the form a title.").max(200),
  description: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  status: formStatusSchema.default("DRAFT"),
  closesAt: optionalDate,
  fields: z.array(formFieldInputSchema).min(1, "Add at least one question.").max(50),
});

/**
 * Shape only. Whether each answer actually fits its question — required,
 * one of the offered choices, a real number — depends on the stored form, so
 * that is checked in lib/services/forms.ts against the database copy.
 */
export const formResponseSchema = z.object({
  answers: z.record(idSchema, z.union([z.string().max(10_000), z.array(z.string().max(200)).max(50)])),
});

export const achievementSchema = z.object({
  title: shortText,
  tournamentName: shortText,
  seasonYear: z.number().int().min(1980).max(2100),
  placement: shortText,
  eventName: optionalShort,
  description: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  participants: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  level: achievementLevelSchema.default("LOCAL"),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const resourceSchema = z.object({
  title: shortText,
  description: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  category: resourceCategorySchema,
  url: externalUrlSchema,
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  visibility: resourceVisibilitySchema.default("MEMBER"),
});

export const officerProfileSchema = z.object({
  userId: idSchema,
  position: shortText,
  bio: mediumText.optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  publicEmail: z.email().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  photoUrl: optionalUrl,
  events: z.array(debateEventSchema).max(4).default([]),
  termYear: z.number().int().min(2000).max(2100),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const clubSettingsSchema = z.object({
  settings: z.record(z.string().min(1).max(80), z.string().max(2_000)),
});

export const tabroomImportSchema = z.object({
  /** Either a full tabroom.com URL or a bare numeric tournament id. */
  reference: z.string().trim().min(1).max(500),
});
