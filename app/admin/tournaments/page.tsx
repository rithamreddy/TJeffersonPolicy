import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { TournamentBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { TOURNAMENT_CIRCUITS, labelFor } from "@/lib/constants";
import { listTournamentsForOfficers } from "@/lib/services/tournaments";
import { formatDate, formatDateRange } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Tournaments" };

interface PageProps {
  searchParams: Promise<{ archived?: string }>;
}

export default async function AdminTournamentsPage({ searchParams }: PageProps) {
  await requireOfficerPage("/admin/tournaments");
  const { archived } = await searchParams;
  const includeArchived = archived === "1";

  const tournaments = await listTournamentsForOfficers({ includeArchived });

  return (
    <>
      <PageHeading
        title="Tournaments"
        actions={
          <>
            <ButtonLink href="/admin/tournaments/new" size="sm">
              New tournament
            </ButtonLink>
            <ButtonLink href={includeArchived ? "/admin/tournaments" : "/admin/tournaments?archived=1"} size="sm" variant="outline">
              {includeArchived ? "Hide archived" : "Show archived"}
            </ButtonLink>
          </>
        }
      />

      {tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments yet"
          action={{ href: "/admin/tournaments/new", label: "Create a tournament" }}
        />
      ) : (
        <TableWrap label="Tournaments">
          <Table className="min-w-[780px]">
            <thead>
              <tr>
                <Th>Tournament</Th>
                <Th>Dates</Th>
                <Th>Circuit</Th>
                <Th>Status</Th>
                <Th className="text-right">Entries</Th>
                <Th>Deadline</Th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => (
                <Tr key={tournament.id}>
                  <Td>
                    <Link href={`/admin/tournaments/${tournament.id}`} className="block">
                      <span className="block text-sm font-semibold text-ink hover:text-navy-600">{tournament.name}</span>
                      <span className="block text-sm text-ink/60">
                        {tournament.location} · {tournament.divisions.length} event
                        {tournament.divisions.length === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-ink/60">
                    {formatDateRange(tournament.startDate, tournament.endDate)}
                  </Td>
                  <Td className="text-ink/60">{labelFor(TOURNAMENT_CIRCUITS, tournament.circuit)}</Td>
                  <Td>
                    <TournamentBadge status={tournament.status} />
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">{tournament._count.registrations}</Td>
                  <Td className="whitespace-nowrap text-ink/60">
                    {tournament.registrationDeadline ? formatDate(tournament.registrationDeadline) : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
