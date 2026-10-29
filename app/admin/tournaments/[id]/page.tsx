import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/PageHeading";
import { InlineStatus } from "@/components/app/InlineStatus";
import { TournamentBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { REGISTRATION_STATUSES } from "@/lib/constants";
import { getTournamentForOfficer } from "@/lib/services/tournaments";
import { formatDate, formatDateRange, formatDateTime } from "@/lib/utils/format";
import { DangerZone } from "./DangerZone";
import { TournamentForm } from "../TournamentForm";
import { draftFromTournament } from "../tournamentDraft";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tournament = await getTournamentForOfficer(id);
  return { title: tournament?.name ?? "Tournament" };
}

export default async function AdminTournamentDetailPage({ params }: PageProps) {
  await requireOfficerPage("/admin/tournaments");
  const { id } = await params;

  const tournament = await getTournamentForOfficer(id);
  if (!tournament) notFound();

  return (
    <>
      <Link href="/admin/tournaments" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All tournaments
      </Link>

      <PageHeading
        title={tournament.name}
        description={`${formatDateRange(tournament.startDate, tournament.endDate)} · ${tournament.location}`}
        actions={
          <>
            <TournamentBadge status={tournament.status} />
            <ButtonLink href={`/api/admin/registrations/export?tournamentId=${tournament.id}`} size="sm" variant="outline" external>
              Export CSV
            </ButtonLink>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-wrap items-center justify-between gap-6">
          <CardTitle>
            Registrations{" "}
            <span className="ml-1 font-sans text-sm font-normal text-ink/60">({tournament.registrations.length})</span>
          </CardTitle>
          {tournament.registrationDeadline ? (
            <span className="text-sm text-ink/60">Deadline {formatDateTime(tournament.registrationDeadline)}</span>
          ) : null}
        </CardHeader>
        <CardBody className={tournament.registrations.length === 0 ? undefined : "p-0"}>
          {tournament.registrations.length === 0 ? (
            <EmptyState
              title="Nobody has registered yet"
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <TableWrap label="Registrations" className="border-0">
              <Table className="min-w-[860px]">
                <thead>
                  <tr>
                    <Th>Member</Th>
                    <Th>Event</Th>
                    <Th>Partner</Th>
                    <Th>Contact</Th>
                    <Th>Registered</Th>
                    <Th className="w-44">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.registrations.map((registration) => (
                    <Tr key={registration.id}>
                      <Td>
                        <Link
                          href={`/admin/members/${registration.userId}`}
                          className="text-sm font-semibold text-ink hover:text-navy-600"
                        >
                          {registration.user.displayName}
                        </Link>
                        <span className="block text-sm text-ink/60">
                          {registration.grade ? `Grade ${registration.grade}` : registration.user.ionUsername}
                        </span>
                        {registration.memberNote ? (
                          <span className="mt-1 block text-sm italic text-ink/60">&ldquo;{registration.memberNote}&rdquo;</span>
                        ) : null}
                      </Td>
                      <Td className="text-ink/60">{registration.division.name}</Td>
                      <Td className="text-ink/60">
                        {registration.partnerName}
                        {registration.partnerSchoolEmail ? (
                          <span className="block text-sm">{registration.partnerSchoolEmail}</span>
                        ) : null}
                      </Td>
                      <Td className="text-ink/60">
                        {registration.phoneNumber ? <span className="block">{registration.phoneNumber}</span> : null}
                        {registration.tabroomEmail ? <span className="block text-sm">{registration.tabroomEmail}</span> : null}
                      </Td>
                      <Td className="whitespace-nowrap text-ink/60">{formatDate(registration.createdAt)}</Td>
                      <Td>
                        <InlineStatus
                          endpoint={`/api/admin/registrations/${registration.id}`}
                          value={registration.status}
                          options={REGISTRATION_STATUSES}
                          label={`Status for ${registration.user.displayName}`}
                        />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Edit tournament</CardTitle>
        </CardHeader>
        <CardBody className="sm:p-6">
          <TournamentForm
            mode="edit"
            tournamentId={tournament.id}
            initial={draftFromTournament({
              name: tournament.name,
              startDate: tournament.startDate.toISOString(),
              endDate: tournament.endDate?.toISOString() ?? null,
              location: tournament.location,
              circuit: tournament.circuit,
              status: tournament.status,
              registrationOpensAt: tournament.registrationOpensAt?.toISOString() ?? null,
              registrationDeadline: tournament.registrationDeadline?.toISOString() ?? null,
              description: tournament.description,
              eligibility: tournament.eligibility,
              memberNotes: tournament.memberNotes,
              officerNotes: tournament.officerNotes,
              externalRegistrationUrl: tournament.externalRegistrationUrl,
              tabroomUrl: tournament.tabroomUrl,
              tabroomId: tournament.tabroomId,
              divisions: tournament.divisions,
            })}
          />
        </CardBody>
      </Card>

      <DangerZone
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        registrationCount={tournament.registrations.length}
      />
    </>
  );
}
