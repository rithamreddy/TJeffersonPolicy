/**
 * The shape the tournament form edits, and the conversions between it and what
 * the database stores.
 *
 * This module deliberately carries no "use client" directive: the edit page is
 * a server component and builds the initial draft during render, while the
 * form itself is a client component that reads it back. A function exported
 * from a client module cannot be called from the server at all, so this has to
 * live outside TournamentForm.tsx.
 *
 * Times are anchored to the school's timezone rather than the machine's. A
 * `datetime-local` input has no timezone of its own, so without this an
 * officer editing from a different timezone — or a server running in UTC,
 * which is the normal case once deployed — would see and save times shifted by
 * several hours.
 */

import { isoToWallClock, wallClockToIso } from "@/lib/utils/wall-clock";

// Re-exported so existing imports keep working; the implementation lives in
// lib/utils/wall-clock.ts, shared with the form builder.
export { isoToWallClock, wallClockToIso };

export interface DivisionDraft {
  id?: string;
  name: string;
  code: string;
  fee: string;
  capacity: string;
}

export interface TournamentDraft {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  circuit: string;
  status: string;
  registrationOpensAt: string;
  registrationDeadline: string;
  description: string;
  eligibility: string;
  memberNotes: string;
  officerNotes: string;
  externalRegistrationUrl: string;
  tabroomUrl: string;
  tabroomId: string;
  divisions: DivisionDraft[];
}

export const emptyDraft: TournamentDraft = {
  name: "",
  startDate: "",
  endDate: "",
  location: "",
  circuit: "LOCAL",
  status: "DRAFT",
  registrationOpensAt: "",
  registrationDeadline: "",
  description: "",
  eligibility: "",
  memberNotes: "",
  officerNotes: "",
  externalRegistrationUrl: "",
  tabroomUrl: "",
  tabroomId: "",
  divisions: [{ name: "Policy — Varsity", code: "VCX", fee: "", capacity: "" }],
};

export function draftFromTournament(tournament: {
  name: string;
  startDate: string;
  endDate: string | null;
  location: string;
  circuit: string;
  status: string;
  registrationOpensAt: string | null;
  registrationDeadline: string | null;
  description: string | null;
  eligibility: string | null;
  memberNotes: string | null;
  officerNotes: string | null;
  externalRegistrationUrl: string | null;
  tabroomUrl: string | null;
  tabroomId: number | null;
  divisions: { id: string; name: string; code: string | null; feeCents: number | null; capacity: number | null }[];
}): TournamentDraft {
  return {
    name: tournament.name,
    startDate: isoToWallClock(tournament.startDate, false),
    endDate: isoToWallClock(tournament.endDate, false),
    location: tournament.location,
    circuit: tournament.circuit,
    status: tournament.status,
    registrationOpensAt: isoToWallClock(tournament.registrationOpensAt, true),
    registrationDeadline: isoToWallClock(tournament.registrationDeadline, true),
    description: tournament.description ?? "",
    eligibility: tournament.eligibility ?? "",
    memberNotes: tournament.memberNotes ?? "",
    officerNotes: tournament.officerNotes ?? "",
    externalRegistrationUrl: tournament.externalRegistrationUrl ?? "",
    tabroomUrl: tournament.tabroomUrl ?? "",
    tabroomId: tournament.tabroomId ? String(tournament.tabroomId) : "",
    divisions: tournament.divisions.map((division) => ({
      id: division.id,
      name: division.name,
      code: division.code ?? "",
      fee: division.feeCents != null ? (division.feeCents / 100).toFixed(2) : "",
      capacity: division.capacity != null ? String(division.capacity) : "",
    })),
  };
}
