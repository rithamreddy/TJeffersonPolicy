import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { FilterBar } from "@/components/app/FilterBar";
import { InlineStatus } from "@/components/app/InlineStatus";
import { ButtonLink } from "@/components/ui/Button";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { REGISTRATION_STATUSES } from "@/lib/constants";
import { listRegistrationsForOfficers } from "@/lib/services/registrations";
import { listTournamentsForOfficers } from "@/lib/services/tournaments";
import { formatDate, formatDateRange } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Registrations" };

interface PageProps {
  searchParams: Promise<{ tournamentId?: string; status?: string }>;
}

export default async function AdminRegistrationsPage({ searchParams }: PageProps) {
  await requireOfficerPage("/admin/registrations");
  const filters = await searchParams;

  const [registrations, tournaments] = await Promise.all([
    listRegistrationsForOfficers({ tournamentId: filters.tournamentId, status: filters.status }),
    listTournamentsForOfficers({ includeArchived: true }),
  ]);

  const exportQuery = new URLSearchParams();
  if (filters.tournamentId) exportQuery.set("tournamentId", filters.tournamentId);
  if (filters.status) exportQuery.set("status", filters.status);

  return (
    <>
      <PageHeading
        title="Registrations"
      />

      <FilterBar
        selects={[
          {
            name: "tournamentId",
            label: "All tournaments",
            options: tournaments.map((tournament) => ({ value: tournament.id, label: tournament.name })),
          },
          {
            name: "status",
            label: "Any status",
            options: Object.entries(REGISTRATION_STATUSES).map(([value, label]) => ({ value, label })),
          },
        ]}
        actions={
          <ButtonLink href={`/api/admin/registrations/export?${exportQuery.toString()}`} size="sm" variant="outline" external>
            Export CSV
          </ButtonLink>
        }
      />

      {registrations.length === 0 ? (
        <EmptyState
          title="No registrations match"
          action={{ href: "/admin/tournaments", label: "Manage tournaments" }}
        />
      ) : (
        <>
          <p className="mb-3 text-base text-ink/60">
            {registrations.length} registration{registrations.length === 1 ? "" : "s"}
          </p>
          <TableWrap label="Registrations">
            <Table className="min-w-[960px]">
              <thead>
                <tr>
                  <Th>Member</Th>
                  <Th>Tournament</Th>
                  <Th>Event</Th>
                  <Th>Partner</Th>
                  <Th>Contact</Th>
                  <Th>Registered</Th>
                  <Th className="w-44">Status</Th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <Tr key={registration.id}>
                    <Td>
                      <Link href={`/admin/members/${registration.userId}`} className="text-sm font-semibold text-ink hover:text-navy-600">
                        {registration.user.displayName}
                      </Link>
                      <span className="block text-sm text-ink/60">
                        {registration.grade ? `Grade ${registration.grade}` : registration.user.ionUsername}
                      </span>
                    </Td>
                    <Td>
                      <Link href={`/admin/tournaments/${registration.tournamentId}`} className="text-sm text-ink hover:text-navy-600">
                        {registration.tournament.name}
                      </Link>
                      <span className="block text-sm text-ink/60">
                        {formatDateRange(registration.tournament.startDate, registration.tournament.endDate)}
                      </span>
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
        </>
      )}
    </>
  );
}
