import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { FilterBar } from "@/components/app/FilterBar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, DuesBadge } from "@/components/ui/Badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { DUES_STATUSES, MEMBER_STATUSES, ROLES, currentSeasonYear, labelFor, seasonLabel } from "@/lib/constants";
import { duesOverview } from "@/lib/services/dues";
import { listMembers } from "@/lib/services/users";

export const metadata: Metadata = { title: "Members" };

interface PageProps {
  searchParams: Promise<{ q?: string; role?: string; status?: string; grade?: string; dues?: string }>;
}

export default async function AdminMembersPage({ searchParams }: PageProps) {
  await requireOfficerPage("/admin/members");
  const filters = await searchParams;
  const season = currentSeasonYear();

  const grade = filters.grade ? Number.parseInt(filters.grade, 10) : undefined;

  const [members, balances] = await Promise.all([
    listMembers({
      search: filters.q,
      role: filters.role,
      status: filters.status,
      gradeNumber: Number.isFinite(grade) ? grade : undefined,
    }),
    duesOverview(season),
  ]);

  const balanceByUser = new Map(balances.rows.map((row) => [row.user.id, row.balance]));

  const visible = filters.dues
    ? members.filter((member) => (balanceByUser.get(member.id)?.status ?? "UNPAID") === filters.dues)
    : members;

  return (
    <>
      <PageHeading
        title="Members"
        description={`${seasonLabel(season)} season`}
      />

      <FilterBar
        searchPlaceholder="Search by name or Ion username…"
        selects={[
          { name: "role", label: "Any role", options: Object.entries(ROLES).map(([value, label]) => ({ value, label })) },
          {
            name: "status",
            label: "Any status",
            options: Object.entries(MEMBER_STATUSES).map(([value, label]) => ({ value, label })),
          },
          {
            name: "grade",
            label: "Any grade",
            options: [9, 10, 11, 12].map((g) => ({ value: String(g), label: `Grade ${g}` })),
          },
          {
            name: "dues",
            label: "Any dues status",
            options: Object.entries(DUES_STATUSES).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          title="No members match"
          action={{ href: "/admin/members", label: "Clear filters" }}
        />
      ) : (
        <>
          <p className="mb-3 text-base text-ink/60">
            {visible.length} member{visible.length === 1 ? "" : "s"}
          </p>
          <TableWrap label="Members">
            <Table className="min-w-[760px]">
              <thead>
                <tr>
                  <Th>Member</Th>
                  <Th>Grade</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Dues</Th>
                  <Th className="text-right">Activity</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => {
                  const balance = balanceByUser.get(member.id);
                  return (
                    <Tr key={member.id}>
                      <Td>
                        <Link href={`/admin/members/${member.id}`} className="flex items-center gap-4 group">
                          <Avatar name={member.displayName} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink group-hover:text-navy-600">
                              {member.displayName}
                            </span>
                            <span className="block truncate text-sm text-ink/60">{member.ionUsername}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td className="text-ink/60">{member.gradeNumber ?? "—"}</Td>
                      <Td>
                        <Badge tone={member.role === "OFFICER" ? "info" : "neutral"}>
                          {labelFor(ROLES, member.role, "Member")}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={member.status === "ACTIVE" ? "good" : "neutral"}>
                          {labelFor(MEMBER_STATUSES, member.status, "Active")}
                        </Badge>
                      </Td>
                      <Td>
                        <DuesBadge status={balance?.status ?? "UNPAID"} />
                      </Td>
                      <Td className="text-right text-sm text-ink/60">
                        {member._count.registrations} entries · {member._count.orders} orders
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </>
      )}
    </>
  );
}
