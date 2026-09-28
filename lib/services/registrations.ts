/**
 * Tournament registration.
 *
 * A registration is an intent-to-compete recorded here; officers still enter
 * the team on Tabroom themselves. That boundary is deliberate — see
 * lib/integrations/tabroom.ts for why automated entry is not attempted.
 */
import { prisma } from "../db";
import { HttpError } from "../auth/guards";
import { isRegistrationOpen } from "./tournaments";
import { csvCell } from "../csv";

/** What a member sees about their own registrations. No officer notes. */
export async function listOwnRegistrations(userId: string) {
  return prisma.tournamentRegistration.findMany({
    where: { userId },
    select: {
      id: true,
      status: true,
      partnerName: true,
      partnerSchoolEmail: true,
      schoolEmail: true,
      tabroomEmail: true,
      phoneNumber: true,
      grade: true,
      memberNote: true,
      feePaid: true,
      createdAt: true,
      tournament: {
        select: { id: true, name: true, slug: true, startDate: true, endDate: true, location: true, circuit: true, status: true },
      },
      division: { select: { id: true, name: true, code: true, feeCents: true } },
    },
    orderBy: { tournament: { startDate: "desc" } },
  });
}

/**
 * The member's own most recent registration, used only to pre-fill the parts
 * of the registration form that rarely change (Tabroom email, phone, who they
 * usually partner with) — the member still confirms or edits every field, per
 * tournament, before submitting.
 */
export async function mostRecentRegistrationDefaults(userId: string) {
  return prisma.tournamentRegistration.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      partnerName: true,
      tabroomEmail: true,
      phoneNumber: true,
      partnerSchoolEmail: true,
    },
  });
}

export async function createRegistration(input: {
  userId: string;
  tournamentId: string;
  divisionId: string;
  partnerName: string;
  schoolEmail: string;
  tabroomEmail: string;
  phoneNumber: string;
  grade: number;
  partnerSchoolEmail: string;
  memberNote?: string;
}) {
  const division = await prisma.tournamentDivision.findUnique({
    where: { id: input.divisionId },
    include: { tournament: true },
  });

  if (!division || division.tournamentId !== input.tournamentId) {
    throw new HttpError(404, "That event is not part of this tournament.", "not_found");
  }
  if (!isRegistrationOpen(division.tournament)) {
    throw new HttpError(409, "Registration for this tournament is closed.", "registration_closed");
  }

  if (division.capacity != null) {
    // Waitlisted entries do not count against capacity — that is the point of
    // a waitlist.
    const takenSpots = await prisma.tournamentRegistration.count({
      where: { divisionId: division.id, status: { in: ["PENDING", "REGISTERED"] } },
    });
    if (takenSpots >= division.capacity) {
      throw new HttpError(409, "That event is full. Ask an officer about the waitlist.", "division_full");
    }
  }

  // Withdrawing deletes the row (see withdrawRegistration below), so any
  // surviving row for this member and division is necessarily still active.
  const duplicate = await prisma.tournamentRegistration.findUnique({
    where: { userId_divisionId: { userId: input.userId, divisionId: input.divisionId } },
    select: { id: true },
  });
  if (duplicate) {
    throw new HttpError(409, "You are already registered for that event.", "already_registered");
  }

  const [registration] = await prisma.$transaction([
    prisma.tournamentRegistration.create({
      data: {
        userId: input.userId,
        tournamentId: input.tournamentId,
        divisionId: input.divisionId,
        partnerName: input.partnerName,
        schoolEmail: input.schoolEmail,
        tabroomEmail: input.tabroomEmail,
        phoneNumber: input.phoneNumber,
        grade: input.grade,
        partnerSchoolEmail: input.partnerSchoolEmail,
        memberNote: input.memberNote ?? null,
      },
      include: { tournament: true, division: true },
    }),
    // Caches the phone number on the profile purely to pre-fill next time;
    // see the field comment on User in prisma/schema.prisma.
    prisma.user.update({ where: { id: input.userId }, data: { phoneNumber: input.phoneNumber } }),
  ]);

  return registration;
}

/**
 * Withdrawing removes the registration entirely rather than flagging it, so
 * there is no fourth status to track (see SIMPLE_STATUSES in lib/constants.ts)
 * and a freed division slot is immediately available to the next member.
 */
export async function withdrawRegistration(registrationId: string, actorUserId: string, actorIsOfficer: boolean) {
  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { tournament: true, division: true },
  });
  if (!registration) throw new HttpError(404, "That registration no longer exists.", "not_found");
  if (registration.userId !== actorUserId && !actorIsOfficer) {
    throw new HttpError(403, "You can only withdraw your own registration.", "forbidden");
  }

  await prisma.tournamentRegistration.delete({ where: { id: registrationId } });
  return registration;
}

export async function updateRegistrationAsOfficer(
  registrationId: string,
  data: { status: string; officerNote?: string; feePaid?: boolean },
) {
  return prisma.tournamentRegistration.update({
    where: { id: registrationId },
    data: {
      status: data.status,
      officerNote: data.officerNote ?? null,
      ...(data.feePaid !== undefined ? { feePaid: data.feePaid } : {}),
    },
    include: { tournament: true, division: true, user: true },
  });
}

export async function listRegistrationsForOfficers(filters: { tournamentId?: string; status?: string } = {}) {
  return prisma.tournamentRegistration.findMany({
    where: {
      ...(filters.tournamentId ? { tournamentId: filters.tournamentId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: { user: true, tournament: true, division: true },
    orderBy: [{ tournament: { startDate: "asc" } }, { createdAt: "asc" }],
  });
}

/** CSV export. Quoting handles names with commas or quotes. */
export function registrationsToCsv(
  rows: {
    user: { displayName: string; ionUsername: string; gradeNumber: number | null };
    tournament: { name: string; startDate: Date };
    division: { name: string; feeCents: number | null };
    status: string;
    partnerName: string;
    partnerSchoolEmail: string | null;
    schoolEmail: string | null;
    tabroomEmail: string | null;
    phoneNumber: string | null;
    grade: number | null;
    memberNote: string | null;
    feePaid: boolean;
    createdAt: Date;
  }[],
): string {
  const header = [
    "Name",
    "Ion username",
    "Grade",
    "Tournament",
    "Start date",
    "Event",
    "Status",
    "Fee",
    "Fee paid",
    "Partner",
    "Partner school email",
    "School email",
    "Tabroom email",
    "Phone",
    "Member note",
    "Registered at",
  ];
  const lines = rows.map((row) =>
    [
      row.user.displayName,
      row.user.ionUsername,
      String(row.grade ?? row.user.gradeNumber ?? ""),
      row.tournament.name,
      row.tournament.startDate.toISOString().slice(0, 10),
      row.division.name,
      row.status,
      row.division.feeCents != null ? (row.division.feeCents / 100).toFixed(2) : "",
      row.feePaid ? "Yes" : "No",
      row.partnerName,
      row.partnerSchoolEmail ?? "",
      row.schoolEmail ?? "",
      row.tabroomEmail ?? "",
      row.phoneNumber ?? "",
      row.memberNote ?? "",
      row.createdAt.toISOString(),
    ].map(csvCell).join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
}
