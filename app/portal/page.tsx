import Link from "next/link";
import { GettingStarted } from "@/components/app/GettingStarted";
import { OnboardingTour } from "@/components/app/OnboardingTour";
import { PageHeading, StatTile } from "@/components/app/PageHeading";
import { Badge, DuesBadge, NsdaBadge, RegistrationBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/States";
import { IconBook, IconBox, IconTicket, IconWallet } from "@/components/ui/Icons";
import { requireUserPage } from "@/lib/auth/guards";
import { DEBATE_EVENTS, currentSeasonYear, labelFor, seasonLabel } from "@/lib/constants";
import { getOwnDues } from "@/lib/services/dues";
import { checklistVisible, getChecklist } from "@/lib/services/onboarding";
import { missingProfileFields } from "@/lib/services/profile-completion";
import { listOwnRegistrations } from "@/lib/services/registrations";
import { getSettings } from "@/lib/services/settings";
import { listTournamentsForMembers } from "@/lib/services/tournaments";
import { userEvents } from "@/lib/services/users";
import { prisma } from "@/lib/db";
import { formatDateRange, formatMoney, formatRelative } from "@/lib/utils/format";

interface PageProps {
  searchParams: Promise<{ denied?: string; tour?: string }>;
}

export default async function PortalDashboard({ searchParams }: PageProps) {
  const user = await requireUserPage("/portal");
  const { denied, tour } = await searchParams;
  const season = currentSeasonYear();

  const [dues, registrations, upcoming, awards, settings] = await Promise.all([
    getOwnDues(user.id, season),
    listOwnRegistrations(user.id),
    listTournamentsForMembers(),
    prisma.award.findMany({ where: { userId: user.id }, orderBy: { awardedOn: "desc" }, take: 3 }),
    getSettings(),
  ]);

  // Onboarding: the tour opens once for everyone who has not finished or
  // skipped it, and again on demand via ?tour=1 (the checklist links there).
  const checklist = await getChecklist(user);
  const showChecklist = checklistVisible(checklist, Boolean(user.onboardingChecklistDismissedAt));
  const showTour = !user.onboardingTourCompletedAt || tour === "1";

  const events = userEvents(user);
  const activeRegistrations = registrations.filter((r) => r.status === "PENDING" || r.status === "REGISTERED");
  const nextTournament = upcoming[0];
  const openNow = upcoming.filter((t) => t.status === "OPEN");
  const duesStatus = dues.status;
  const duesOutstanding = duesStatus === "UNPAID" || duesStatus === "PENDING";

  return (
    <>
      {showTour ? (
        <OnboardingTour
          // Remounting on ?tour=1 restarts a replay from the first step.
          key={tour ?? "first-visit"}
          firstName={user.firstName}
          profileComplete={missingProfileFields(user).length === 0}
        />
      ) : null}

      {denied === "officer" ? (
        <div className="mb-6">
          <Alert tone="warn" title="Officers only">
            That area of the site is restricted to the officer team. If you think you should have access, ask a captain.
          </Alert>
        </div>
      ) : null}

      <PageHeading
        title={`Welcome, ${user.firstName || user.displayName}`}
        description={`${seasonLabel(season)} season · ${
          events.length > 0 ? events.map((event) => labelFor(DEBATE_EVENTS, event)).join(", ") : "No events recorded yet"
        }`}
        actions={
          <>
            <ButtonLink href="/portal/tournaments" size="sm">
              Register for a tournament
            </ButtonLink>
            <ButtonLink href="/portal/profile" size="sm" variant="outline">
              Edit profile
            </ButtonLink>
          </>
        }
      />

      {showChecklist ? (
        <GettingStarted
          tasks={checklist}
          facebookUrl={settings["social.facebook"]}
          discordUrl={settings["social.discord"]}
        />
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Dues"
          value={<DuesBadge status={duesStatus} />}
          hint={formatMoney(dues.owedCents)}
          tone={duesStatus === "PAID" || duesStatus === "WAIVED" ? "good" : duesOutstanding ? "warn" : "default"}
          href="/portal/dues"
        />
        <StatTile
          label="NSDA membership"
          value={<NsdaBadge status={user.nsdaStatus} />}
          hint={user.nsdaMemberId ? `Member ID ${user.nsdaMemberId}` : "Ask an officer if this looks wrong"}
        />
        <StatTile
          label="Active entries"
          value={activeRegistrations.length}
          hint={activeRegistrations.length === 0 ? "Nothing entered right now" : "Submitted or confirmed"}
          href="/portal/registrations"
        />
        <StatTile
          label="Open registrations"
          value={openNow.length}
          hint={openNow.length === 0 ? "Nothing open at the moment" : "Tournaments accepting entries"}
          href="/portal/tournaments"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Next tournament */}
          <Card>
            <CardHeader className="flex items-center justify-between gap-6">
              <CardTitle>Next up</CardTitle>
              <Link href="/portal/tournaments" className="text-sm font-semibold text-navy-600 hover:text-navy-500">
                All tournaments →
              </Link>
            </CardHeader>
            <CardBody>
              {!nextTournament ? (
                <EmptyState
                  title="No tournaments scheduled"
                  description="Once officers publish the next tournament it will appear here with its registration deadline."
                  className="border-0 bg-transparent py-6"
                />
              ) : (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-ink">{nextTournament.name}</h3>
                      <p className="mt-1 text-base text-ink/60">
                        {formatDateRange(nextTournament.startDate, nextTournament.endDate)} · {nextTournament.location}
                      </p>
                    </div>
                    <Badge tone={nextTournament.status === "OPEN" ? "good" : "neutral"}>
                      {nextTournament.status === "OPEN" ? "Registration open" : "Registration closed"}
                    </Badge>
                  </div>

                  {nextTournament.registrationDeadline ? (
                    <p className="mt-4 bg-paper-sunk px-3.5 py-2.5 text-base text-ink/75">
                      Registration closes{" "}
                      <strong className="font-semibold">
                        {formatRelative(nextTournament.registrationDeadline)}
                      </strong>{" "}
                      <span className="text-ink/60">
                        ({formatDateRange(nextTournament.registrationDeadline)})
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <ButtonLink href={`/portal/tournaments/${nextTournament.id}`} size="sm">
                      {nextTournament.status === "OPEN" ? "Register" : "View details"}
                    </ButtonLink>
                    {nextTournament.tabroomUrl ? (
                      <ButtonLink href={nextTournament.tabroomUrl} size="sm" variant="outline" external>
                        Tabroom page
                      </ButtonLink>
                    ) : null}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Registrations */}
          <Card>
            <CardHeader className="flex items-center justify-between gap-6">
              <CardTitle>Your registrations</CardTitle>
              <Link href="/portal/registrations" className="text-sm font-semibold text-navy-600 hover:text-navy-500">
                Full history →
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {registrations.length === 0 ? (
                <EmptyState
                  title="You have not registered for anything yet"
                  description="Browse open tournaments and enter an event — it takes a moment, and you can withdraw later if plans change."
                  action={{ href: "/portal/tournaments", label: "Browse tournaments" }}
                  className="m-4 border-0 bg-transparent"
                />
              ) : (
                <ul className="divide-y-2 divide-rule-faint">
                  {registrations.slice(0, 5).map((registration) => (
                    <li key={registration.id} className="flex flex-wrap items-center gap-6 px-7 py-5">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/portal/tournaments/${registration.tournament.id}`}
                          className="block truncate text-sm font-semibold text-ink hover:text-navy-600"
                        >
                          {registration.tournament.name}
                        </Link>
                        <p className="mt-1.5 truncate text-sm text-ink/60">
                          {registration.division.name} ·{" "}
                          {formatDateRange(registration.tournament.startDate, registration.tournament.endDate)}
                        </p>
                      </div>
                      <RegistrationBadge status={registration.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Money */}
          <Card>
            <CardHeader>
              <CardTitle>Dues &amp; payment</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">Status</span>
                <DuesBadge status={duesStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink/60">Amount</span>
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {formatMoney(dues.owedCents)}
                </span>
              </div>
              {duesOutstanding ? (
                <>
                  <p className="text-base leading-relaxed text-ink/60">{settings["dues.instructions"]}</p>
                  <ButtonLink href={settings["links.myschoolbucks"]} size="sm" className="w-full" external>
                    Pay on MySchoolBucks
                  </ButtonLink>
                </>
              ) : (
                <p className="text-base leading-relaxed text-ink/60">
                  You are settled for the {seasonLabel(season)} season. Thank you.
                </p>
              )}
              <Link href="/portal/dues" className="block text-sm font-semibold text-navy-600 hover:text-navy-500">
                Dues detail →
              </Link>
            </CardBody>
          </Card>

          {/* Awards */}
          <Card>
            <CardHeader>
              <CardTitle>Your awards</CardTitle>
            </CardHeader>
            <CardBody className={awards.length === 0 ? undefined : "p-0"}>
              {awards.length === 0 ? (
                <p className="text-base leading-relaxed text-ink/60">
                  Nothing recorded yet. Officers add awards after results are confirmed.
                </p>
              ) : (
                <ul className="divide-y-2 divide-rule-faint">
                  {awards.map((award) => (
                    <li key={award.id} className="px-7 py-5">
                      <p className="text-base font-semibold text-ink">{award.title}</p>
                      <p className="mt-1.5 text-sm text-ink/60">
                        {[award.placement, award.tournamentName].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardBody className="p-2">
              <ul className="space-y-0.5">
                {[
                  { href: "/portal/tournaments", label: "Register for a tournament", icon: <IconTicket /> },
                  { href: "/portal/resources", label: "Browse resources", icon: <IconBook /> },
                  { href: "/portal/orders", label: "View orders", icon: <IconBox /> },
                  { href: "/portal/dues", label: "Check dues", icon: <IconWallet /> },
                ].map((action) => (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className="flex items-center gap-6 px-3 py-2.5 text-sm font-medium text-ink/75 transition-colors hover:bg-navy-100 hover:text-navy-700"
                    >
                      <span className="text-ink/60" aria-hidden="true">
                        {action.icon}
                      </span>
                      {action.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
