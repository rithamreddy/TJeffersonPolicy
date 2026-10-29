import type { Metadata } from "next";
import { PageHeading, StatTile } from "@/components/app/PageHeading";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { REGISTRATION_STATUSES, currentSeasonYear, labelFor, seasonLabel } from "@/lib/constants";
import { dashboardSummary, participationAnalytics } from "@/lib/services/analytics";
import { formatDate, formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireOfficerPage("/admin/analytics");
  const season = currentSeasonYear();

  const [summary, analytics] = await Promise.all([dashboardSummary(season), participationAnalytics(season)]);

  const maxEntries = Math.max(1, ...analytics.tournaments.map((tournament) => tournament.entries));
  const maxGrade = Math.max(1, ...analytics.byGrade.map((row) => row.count));

  return (
    <>
      <PageHeading
        title="Analytics"
        description={`${seasonLabel(season)} season`}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active members" value={summary.activeMembers} hint={`${summary.totalMembers} total accounts`} />
        <StatTile label="Season entries" value={analytics.seasonRegistrations} />
        <StatTile label="Tournaments" value={analytics.tournaments.length} />
        <StatTile label="Dues outstanding" value={formatMoney(summary.outstandingCents)} tone={summary.outstandingCents > 0 ? "warn" : "good"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Roster by grade</CardTitle>
          </CardHeader>
          <CardBody>
            {analytics.byGrade.length === 0 ? (
              <EmptyState title="No active members" className="border-0 bg-transparent py-4" />
            ) : (
              <ul className="space-y-3">
                {analytics.byGrade.map((row) => (
                  <li key={row.grade ?? "unknown"}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-ink">{row.grade ? `Grade ${row.grade}` : "Not recorded"}</span>
                      <span className="tabular-nums text-ink/60">{row.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden bg-paper-sunk">
                      <div
                        className="h-full bg-navy-600 transition-all duration-500"
                        style={{ width: `${(row.count / maxGrade) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrations by status</CardTitle>
          </CardHeader>
          <CardBody>
            {analytics.byRegistrationStatus.length === 0 ? (
              <EmptyState title="No registrations yet" className="border-0 bg-transparent py-4" />
            ) : (
              <ul className="space-y-2.5">
                {analytics.byRegistrationStatus.map((row) => (
                  <li key={row.status} className="flex items-center justify-between border-b-2 border-rule-faint pb-2.5 text-sm last:border-0 last:pb-0">
                    <span className="text-ink">{labelFor(REGISTRATION_STATUSES, row.status)}</span>
                    <span className="font-semibold tabular-nums text-ink">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entries per tournament</CardTitle>
          </CardHeader>
          <CardBody>
            {analytics.tournaments.length === 0 ? (
              <EmptyState
                title="No tournaments this season"
                action={{ href: "/admin/tournaments/new", label: "New tournament" }}
                className="border-0 bg-transparent py-4"
              />
            ) : (
              <ul className="space-y-3">
                {analytics.tournaments.map((tournament) => (
                  <li key={tournament.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-ink">{tournament.name}</span>
                      <span className="text-sm text-ink/60">
                        {formatDate(tournament.startDate)} · {tournament.entries} entries
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden bg-paper-sunk">
                      <div
                        className="h-full bg-signal transition-all duration-500"
                        style={{ width: `${(tournament.entries / maxEntries) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Most active competitors</CardTitle>
          </CardHeader>
          <CardBody className={analytics.topEntrants.length === 0 ? undefined : "p-0"}>
            {analytics.topEntrants.length === 0 ? (
              <p className="text-base text-ink/60">No entries recorded yet.</p>
            ) : (
              <ol className="divide-y-2 divide-rule-faint">
                {analytics.topEntrants.map((entrant, index) => (
                  <li key={entrant.name} className="flex items-center gap-6 px-7 py-5">
                    <span className="w-5 text-sm font-semibold tabular-nums text-ink/60">{index + 1}</span>
                    <span className="flex-1 text-sm font-medium text-ink">{entrant.name}</span>
                    <span className="text-sm tabular-nums text-ink/60">
                      {entrant.entries} {entrant.entries === 1 ? "entry" : "entries"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
