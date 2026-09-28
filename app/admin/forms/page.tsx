import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { isFormAcceptingResponses, listFormsForOfficers } from "@/lib/services/forms";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Forms" };

export default async function AdminFormsPage() {
  await requireOfficerPage("/admin/forms");
  const [forms, activeMembers] = await Promise.all([
    listFormsForOfficers(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <>
      <PageHeading
        title="Forms"
        description="Permission slips, sign-ups, sizes, availability. Open a form and every member sees it in their portal; export the answers as CSV for Google Sheets."
        actions={
          <ButtonLink href="/admin/forms/new" size="sm">
            New form
          </ButtonLink>
        }
      />

      {forms.length === 0 ? (
        <EmptyState
          title="No forms yet"
          description="Build a form, open it, and members can answer from the portal. You'll see who has and hasn't responded."
          action={{ href: "/admin/forms/new", label: "Build the first form" }}
        />
      ) : (
        <TableWrap label="Forms">
          <Table className="min-w-[720px]">
            <thead>
              <tr>
                <Th>Form</Th>
                <Th>Status</Th>
                <Th>Responses</Th>
                <Th>Closes</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => {
                const accepting = isFormAcceptingResponses(form);
                // An OPEN form past its close date is closed in practice.
                const statusLabel = form.status === "OPEN" && !accepting ? "Closed (date passed)" : null;
                return (
                  <Tr key={form.id}>
                    <Td>
                      <Link href={`/admin/forms/${form.id}`} className="block">
                        <span className="block text-sm font-semibold text-ink hover:text-navy-600">{form.title}</span>
                        <span className="block text-sm text-ink/60">
                          {form._count.fields} question{form._count.fields === 1 ? "" : "s"}
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={accepting ? "good" : form.status === "DRAFT" ? "warn" : "neutral"}>
                        {statusLabel ?? (form.status === "OPEN" ? "Open" : form.status === "DRAFT" ? "Draft" : "Closed")}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums text-ink/80">
                      {form._count.responses}
                      {form.status !== "DRAFT" ? <span className="text-ink/50"> / {activeMembers}</span> : null}
                    </Td>
                    <Td className="whitespace-nowrap text-ink/60">{form.closesAt ? formatDateTime(form.closesAt) : "—"}</Td>
                    <Td className="whitespace-nowrap text-ink/60">{formatDate(form.updatedAt)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
