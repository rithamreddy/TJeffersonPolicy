/**
 * Member records and the account-provisioning path used at sign-in.
 */
import type { Prisma, User } from "@prisma/client";
import { prisma } from "../db";
import { isListedOfficer } from "../env";
import { parseStringList, serializeStringList } from "../json";
import type { ExternalProfile } from "../auth/provider";

/**
 * Fields safe to expose to a signed-in member about *themselves*. Anything not
 * listed here (audit metadata, officer notes) never leaves the server.
 */
export const memberSelfSelect = {
  id: true,
  ionUsername: true,
  firstName: true,
  lastName: true,
  displayName: true,
  tjEmail: true,
  contactEmail: true,
  graduationYear: true,
  gradeNumber: true,
  role: true,
  status: true,
  events: true,
  nsdaStatus: true,
  nsdaMemberId: true,
  partnerName: true,
} satisfies Prisma.UserSelect;

/**
 * Find-or-create the local account for an authenticated external profile.
 *
 * The provider is trusted for identity only. Role never comes from the
 * provider — Ion has no concept of a debate officer. It comes from one of two
 * places:
 *
 *   1. OFFICER_USERNAMES, a standing configuration list re-applied here on
 *      every sign-in, so adding a username grants access at their next sign-in
 *      even if their account already exists as a member.
 *   2. Whatever an officer has set in the dashboard.
 *
 * The list only ever promotes. Someone the dashboard promoted keeps their role
 * whether or not they are listed, and nobody is demoted by signing in.
 */
export async function upsertUserFromProfile(profile: ExternalProfile): Promise<{ user: User; created: boolean }> {
  const existing = await prisma.user.findUnique({ where: { ionUsername: profile.providerId } });
  const listed = isListedOfficer(profile.providerId);

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        // tjEmail is deliberately not touched here. Ion reports an
        // @tjhsst.edu mailbox the team does not use, so the school address is
        // entered by the member on their profile and never taken from Ion.
        graduationYear: profile.graduationYear ?? existing.graduationYear,
        gradeNumber: profile.gradeNumber ?? existing.gradeNumber,
        ionUserId: profile.numericId ?? existing.ionUserId,
        lastLoginAt: new Date(),
        // Promote only. Never write "MEMBER" here — that would undo a
        // promotion an officer made in the dashboard.
        ...(listed && existing.role !== "OFFICER" ? { role: "OFFICER" as const } : {}),
      },
    });
    return { user, created: false };
  }

  const user = await prisma.user.create({
    data: {
      ionUsername: profile.providerId,
      ionUserId: profile.numericId ?? null,
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      // Left empty on purpose — see the note in the update branch above.
      tjEmail: null,
      graduationYear: profile.graduationYear ?? null,
      gradeNumber: profile.gradeNumber ?? null,
      role: listed ? "OFFICER" : "MEMBER",
      lastLoginAt: new Date(),
    },
  });
  return { user, created: true };
}

/**
 * Whether this account's officer role is pinned by OFFICER_USERNAMES.
 *
 * Re-exported from the env module so callers that already import from the user
 * service do not need to reach into configuration themselves.
 */
export { isListedOfficer };

export interface MemberFilters {
  search?: string;
  role?: string;
  status?: string;
  gradeNumber?: number;
}

/**
 * Identity/role/status filters only. Dues status is computed, not stored —
 * see duesOverview() in lib/services/dues.ts for the balance behind the
 * "Dues" column on the members page.
 */
export async function listMembers(filters: MemberFilters = {}) {
  const where: Prisma.UserWhereInput = {};

  if (filters.search) {
    const term = filters.search.trim();
    where.OR = [
      { displayName: { contains: term } },
      { firstName: { contains: term } },
      { lastName: { contains: term } },
      { ionUsername: { contains: term } },
    ];
  }
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.gradeNumber) where.gradeNumber = filters.gradeNumber;

  return prisma.user.findMany({
    where,
    orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    include: {
      officer: true,
      _count: { select: { registrations: true, orders: true, awards: true } },
    },
  });
}

/** Everything the officer member-detail page needs, in one round trip. */
export async function getMemberDetail(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      dues: { orderBy: { seasonYear: "desc" } },
      officer: true,
      awards: { orderBy: { awardedOn: "desc" } },
      orders: { include: { item: true }, orderBy: { createdAt: "desc" } },
      registrations: {
        include: { tournament: true, division: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateMemberAsOfficer(
  userId: string,
  data: {
    role?: string;
    status?: string;
    events?: string[];
    nsdaStatus?: string;
    nsdaMemberId?: string;
    gradeNumber?: number;
    graduationYear?: number;
  },
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      role: data.role,
      status: data.status,
      events: data.events ? serializeStringList(data.events) : undefined,
      nsdaStatus: data.nsdaStatus,
      nsdaMemberId: data.nsdaMemberId ?? undefined,
      gradeNumber: data.gradeNumber,
      graduationYear: data.graduationYear,
    },
  });
}

/**
 * Self-service profile edit. Deliberately cannot touch role or status.
 *
 * Every field is written on every save — an omitted value clears the column —
 * so the profile form must always send the whole set.
 */
export async function updateOwnProfile(
  userId: string,
  data: {
    contactEmail?: string;
    tjEmail?: string;
    phoneNumber?: string;
    parentEmail?: string;
    parentPhone?: string;
    events: string[];
    partnerName?: string;
    nsdaMemberId?: string;
  },
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      contactEmail: data.contactEmail ?? null,
      tjEmail: data.tjEmail ?? null,
      phoneNumber: data.phoneNumber ?? null,
      parentEmail: data.parentEmail ?? null,
      parentPhone: data.parentPhone ?? null,
      events: serializeStringList(data.events),
      partnerName: data.partnerName ?? null,
      nsdaMemberId: data.nsdaMemberId ?? null,
    },
  });
}

export function userEvents(user: Pick<User, "events">): string[] {
  return parseStringList(user.events);
}

/** Count of officers, used to refuse removing the last one. */
export async function officerCount(): Promise<number> {
  return prisma.user.count({ where: { role: "OFFICER" } });
}

/**
 * Permanently remove a member and everything scoped to their account —
 * sessions, registrations, dues history, orders, awards, and their officer
 * profile if they have one. Enforced by the schema's `onDelete: Cascade` on
 * those relations, not by application code, so this is one query.
 *
 * News posts, resources, tournaments, and audit log entries they authored are
 * kept but detached (`onDelete: SetNull`) — deleting a member does not erase
 * content they created for the team.
 *
 * If they sign in again afterward, upsertUserFromProfile() provisions a fresh
 * account with no memory of this one.
 */
export async function deleteMember(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
