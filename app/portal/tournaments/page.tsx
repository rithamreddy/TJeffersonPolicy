import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { TOURNAMENT_CIRCUITS, labelFor } from "@/lib/constants";
import { listOwnRegistrations } from "@/lib/services/registrations";
import { isRegistrationOpen, listTournamentsForMembers } from "@/lib/services/tournaments";
import { formatDateRange, formatMoney, formatRelative } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Tournaments" };

interface PageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function TournamentsPage({ searchParams }: PageProps) {
  const user = await requireUserPage("/portal/tournaments");
  const { view } = await searchParams;
  const showPast = view === "past";

  const [tournaments, registrations] = await Promise.all([
    listTournamentsForMembers({ includePast: showPast }),
    listOwnRegistrations(user.id),
  ]);

  // Tournaments the member already has an entry in, for the "Registered" pill.
  // Withdrawing deletes the row, so every fetched registration is still live.
  const registeredTournamentIds = new Set(registrations.map((r) => r.tournament.id));

  const list = showPast ? onlyPast(tournaments) : tournaments;

  return (
    <>
      <PageHeading
        title="Tournaments"
        actions={
          <div className="flex border-2 border-rule">
            <TabLink href="/portal/tournaments" active={!showPast}>
              Upcoming
            </TabLink>
            <TabLink href="/portal/tournaments?view=past" active={showPast}>
              Past
            </TabLink>
          </div>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title={showPast ? "No past tournaments recorded" : "No tournaments scheduled yet"}
          action={showPast ? { href: "/portal/tournaments", label: "See upcoming" } : { href: "/portal", label: "Back to dashboard" }}
        />
      ) : (
        <ul className="space-y-5">
          {list.map((tournament) => {
            const open = isRegistrationOpen(tournament);
            const registered = registeredTournamentIds.has(tournament.id);
            const minFee = tournament.divisions
              .map((division) => division.feeCents)
              .filter((fee): fee is number => typeof fee === "number");

            return (
              <li key={tournament.id}>
                <Link href={`/portal/tournaments/${tournament.id}`} className="c-frame-link group block p-8">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="font-display text-[11px] font-extrabold uppercase tracking-[0.18em] text-navy-600">
                          {labelFor(TOURNAMENT_CIRCUITS, tournament.circuit)}
                        </span>
                        {registered ? <Badge tone="info">You are registered</Badge> : null}
                      </div>
                      <h2 className="t-h3 mt-4 text-ink">{tournament.name}</h2>
                      <p className="t-body t-muted mt-3">
                        {formatDateRange(tournament.startDate, tournament.endDate)} · {tournament.location}
                      </p>
                    </div>
                    <Badge tone={open ? "good" : "neutral"}>{open ? "Registration open" : "Registration closed"}</Badge>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 border-t-2 border-rule-faint pt-5 text-sm text-ink/60">
                    <span>
                      <span className="font-semibold text-ink">{tournament.divisions.length}</span>{" "}
                      {tournament.divisions.length === 1 ? "event" : "events"}
                    </span>
                    {minFee.length > 0 ? (
                      <span>
                        From <span className="font-semibold text-ink">{formatMoney(Math.min(...minFee))}</span>
                      </span>
                    ) : null}
                    {tournament.registrationDeadline && open ? (
                      <span>
                        Closes{" "}
                        <span className="font-semibold text-ink">{formatRelative(tournament.registrationDeadline)}</span>
                      </span>
                    ) : null}
                    <span className="ml-auto font-display text-xs font-bold uppercase tracking-[0.16em] text-navy-600">
                      View details →
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="c-panel on-dark mt-14 p-10">
        <p className="c-label">How it works</p>
        <h2 className="t-h3 mt-6 text-white">From signup to Tabroom</h2>
        <ol className="mt-8 grid gap-px border-2 border-white/20 bg-white/20 sm:grid-cols-3">
          {[
            "You register here for the event you want.",
            "An officer reviews entries and confirms yours.",
            "The officer team enters the squad on Tabroom and posts logistics in the Facebook group.",
          ].map((step, index) => (
            <li key={step} className="bg-navy-800 p-7">
              <span className="font-display text-2xl font-extrabold leading-none text-signal-bright" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="t-body mt-5 text-white/75">{step}</p>
            </li>
          ))}
        </ol>
        <p className="t-body mt-8 text-white/65">
          Plans changed? Withdraw from{" "}
          <Link
            href="/portal/registrations"
            className="border-b-2 border-signal font-semibold text-white hover:bg-signal hover:text-paper"
          >
            My registrations
          </Link>{" "}
          as early as you can so an officer can give the slot to someone else.
        </p>
      </div>
    </>
  );
}

/**
 * `now` is a parameter so the clock read happens outside the component body —
 * React treats an impure call during render as a correctness hazard.
 */
function onlyPast<T extends { startDate: Date }>(tournaments: T[], now = Date.now()): T[] {
  return tournaments.filter((tournament) => tournament.startDate.getTime() < now);
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex min-h-[48px] items-center bg-navy-800 px-6 font-display text-xs font-bold uppercase tracking-[0.12em] text-white"
          : "flex min-h-[48px] items-center px-6 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink/60 hover:bg-signal hover:text-paper"
      }
    >
      {children}
    </Link>
  );
}
