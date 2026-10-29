import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { RegistrationBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { listOwnRegistrations } from "@/lib/services/registrations";
import { formatDate, formatDateRange, formatMoney } from "@/lib/utils/format";
import { WithdrawButton } from "./WithdrawButton";

export const metadata: Metadata = { title: "My registrations" };

export default async function RegistrationsPage() {
  const user = await requireUserPage("/portal/registrations");
  const registrations = await listOwnRegistrations(user.id);

  const { upcoming, past } = partition(registrations);

  return (
    <>
      <PageHeading
        title="My registrations"
      />

      {registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          action={{ href: "/portal/tournaments", label: "Browse tournaments" }}
        />
      ) : (
        <div className="space-y-6">
          <Group title="Upcoming" registrations={upcoming} allowWithdraw emptyText="Nothing coming up right now." />
          <Group title="Past" registrations={past} emptyText="No completed tournaments yet." />
        </div>
      )}
    </>
  );
}

type RegistrationRow = Awaited<ReturnType<typeof listOwnRegistrations>>[number];

/**
 * Split a member's entries into upcoming and past.
 *
 * Withdrawing deletes the row entirely (see withdrawRegistration in
 * lib/services/registrations.ts), so every row here is still live — there is
 * no separate "withdrawn" group to render.
 *
 * `now` is a parameter rather than a `Date.now()` call inside the component so
 * the read stays out of the render path and the grouping can be tested.
 */
function partition(registrations: RegistrationRow[], now = Date.now()) {
  const endOf = (r: RegistrationRow) => (r.tournament.endDate ?? r.tournament.startDate).getTime();

  return {
    upcoming: registrations.filter((r) => endOf(r) >= now),
    past: registrations.filter((r) => endOf(r) < now),
  };
}

function Group({
  title,
  registrations,
  allowWithdraw = false,
  emptyText,
}: {
  title: string;
  registrations: RegistrationRow[];
  allowWithdraw?: boolean;
  emptyText: string;
}) {
  if (registrations.length === 0 && !emptyText) return null;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-6">
        <CardTitle>{title}</CardTitle>
        <span className="text-sm font-medium text-ink/60">
          {registrations.length} {registrations.length === 1 ? "entry" : "entries"}
        </span>
      </CardHeader>
      <CardBody className={registrations.length === 0 ? undefined : "p-0"}>
        {registrations.length === 0 ? (
          <p className="text-base text-ink/60">{emptyText}</p>
        ) : (
          <ul className="divide-y-2 divide-rule-faint">
            {registrations.map((registration) => (
              <li key={registration.id} className="grid gap-6 px-7 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/portal/tournaments/${registration.tournament.id}`}
                      className="truncate text-sm font-semibold text-ink hover:text-navy-600"
                    >
                      {registration.tournament.name}
                    </Link>
                    <RegistrationBadge status={registration.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    {registration.division.name} ·{" "}
                    {formatDateRange(registration.tournament.startDate, registration.tournament.endDate)}
                    {registration.division.feeCents ? ` · ${formatMoney(registration.division.feeCents)}` : ""}
                  </p>
                  {registration.partnerName ? (
                    <p className="mt-1 text-sm text-ink/60">Partner: {registration.partnerName}</p>
                  ) : null}
                  {registration.memberNote ? (
                    <p className="mt-1 text-sm italic text-ink/60">&ldquo;{registration.memberNote}&rdquo;</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-ink/60">Registered {formatDate(registration.createdAt)}</p>
                </div>

                {allowWithdraw ? (
                  <WithdrawButton registrationId={registration.id} tournamentName={registration.tournament.name} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
