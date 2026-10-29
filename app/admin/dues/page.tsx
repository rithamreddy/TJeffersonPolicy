import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading, StatTile } from "@/components/app/PageHeading";
import { DuesBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { Alert, EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { currentSeasonYear, seasonLabel } from "@/lib/constants";
import { duesOverview } from "@/lib/services/dues";
import { formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dues" };

interface PageProps {
  searchParams: Promise<{ season?: string; status?: string; grade?: string }>;
}

export default async function AdminDuesPage({ searchParams }: PageProps) {
  await requireOfficerPage("/admin/dues");
  const filters = await searchParams;

  const parsedSeason = filters.season ? Number.parseInt(filters.season, 10) : Number.NaN;
  const season = Number.isFinite(parsedSeason) ? parsedSeason : currentSeasonYear();

  const overview = await duesOverview(season);

  const grade = filters.grade ? Number.parseInt(filters.grade, 10) : undefined;
  const rows = overview.rows.filter((row) => {
    if (filters.status && row.balance.status !== filters.status) return false;
    if (Number.isFinite(grade) && row.user.gradeNumber !== grade) return false;
    return true;
  });

  return (
    <>
      <PageHeading
        title="Dues"
        description={`${seasonLabel(season)} season`}
      />

      <div className="mb-6">
        <Alert tone="info" title="This page is a roster, not an editor">
          Payments are recorded per fee and per order, on each member&rsquo;s own profile — click through to a name to
          mark something paid or to waive a season&rsquo;s dues.
        </Alert>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Paid" value={overview.totals.paid} tone="good" />
        <StatTile label="Pending" value={overview.totals.pending} tone={overview.totals.pending > 0 ? "warn" : "default"} />
        <StatTile label="Unpaid" value={overview.totals.unpaid} tone={overview.totals.unpaid > 0 ? "bad" : "default"} />
        <StatTile label="Outstanding" value={formatMoney(overview.totals.outstandingCents)} hint={`${overview.totals.waived} waived`} />
      </div>

      <div className="my-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-ink/60">Filter:</span>
        {[
          { label: "Everyone", href: `/admin/dues?season=${season}` },
          { label: "Unpaid", href: `/admin/dues?season=${season}&status=UNPAID` },
          { label: "Pending", href: `/admin/dues?season=${season}&status=PENDING` },
          { label: "Paid", href: `/admin/dues?season=${season}&status=PAID` },
        ].map((filter) => (
          <Link
            key={filter.label}
            href={filter.href}
            className="border-2 border-rule bg-paper-raised px-3 py-1.5 text-[13px] font-medium text-ink/75 hover:border-navy-300 hover:text-navy-600"
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nobody matches"
          action={{ href: `/admin/dues?season=${season}`, label: "Show everyone" }}
        />
      ) : (
        <TableWrap label="Dues by member">
          <Table className="min-w-[640px]">
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Grade</Th>
                <Th>Owed</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={row.user.id}>
                  <Td>
                    <Link href={`/admin/members/${row.user.id}`} className="text-sm font-semibold text-ink hover:text-navy-600">
                      {row.user.displayName}
                    </Link>
                  </Td>
                  <Td className="text-ink/60">{row.user.gradeNumber ?? "—"}</Td>
                  <Td>
                    <DuesBadge status={row.balance.status} />
                    <span className="ml-2 text-sm tabular-nums text-ink/60">{formatMoney(row.balance.owedCents)}</span>
                  </Td>
                  <Td className="text-right">
                    <ButtonLink href={`/admin/members/${row.user.id}`} size="sm" variant="outline">
                      Check off items
                    </ButtonLink>
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
