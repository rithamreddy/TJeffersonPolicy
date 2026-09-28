import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { getFormForOfficer, isFormAcceptingResponses, listNonResponders, parseAnswers } from "@/lib/services/forms";
import { formatDateTime } from "@/lib/utils/format";
import { FormBuilder } from "../FormBuilder";
import { draftFromForm } from "../formDraft";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const form = await getFormForOfficer(id);
  return { title: form ? `Form: ${form.title}` : "Form" };
}

export default async function AdminFormPage({ params }: PageProps) {
  await requireOfficerPage("/admin/forms");
  const { id } = await params;

  const form = await getFormForOfficer(id);
  if (!form) notFound();

  const nonResponders = form.status === "DRAFT" ? [] : await listNonResponders(form.id);
  const accepting = isFormAcceptingResponses(form);
  const responseCount = form.responses.length;

  return (
    <>
      <Link href="/admin/forms" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All forms
      </Link>

      <PageHeading
        title={form.title}
        description={
          form.closesAt
            ? `${accepting ? "Closes" : "Closed"} ${formatDateTime(form.closesAt)}`
            : accepting
              ? "Open, with no close date"
              : undefined
        }
        actions={
          <>
            <Badge tone={accepting ? "good" : form.status === "DRAFT" ? "warn" : "neutral"}>
              {accepting ? "Accepting answers" : form.status === "DRAFT" ? "Draft" : "Closed"}
            </Badge>
            {responseCount > 0 ? (
              <ButtonLink href={`/api/admin/forms/${form.id}/export`} size="sm" variant="outline" external>
                Export CSV
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="space-y-10">
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Responses · {responseCount}</CardTitle>
            {form.status !== "DRAFT" && nonResponders.length > 0 ? (
              <span className="text-sm text-ink/60">{nonResponders.length} active members still to respond</span>
            ) : null}
          </CardHeader>
          <CardBody className={responseCount === 0 ? undefined : "p-0"}>
            {responseCount === 0 ? (
              <EmptyState
                className="border-0 bg-transparent py-8"
                title={form.status === "DRAFT" ? "Not open yet" : "No responses yet"}
                description={
                  form.status === "DRAFT"
                    ? "Set the status to Open below and members will see this form in their portal."
                    : "Answers appear here as members submit them."
                }
              />
            ) : (
              <TableWrap label={`Responses to ${form.title}`} className="border-0">
                <Table className="min-w-[720px]">
                  <thead>
                    <tr>
                      <Th>Member</Th>
                      <Th>Submitted</Th>
                      {form.fields.map((field) => (
                        <Th key={field.id}>{field.label}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.responses.map((response) => {
                      const answers = parseAnswers(response.answers);
                      return (
                        <Tr key={response.id}>
                          <Td className="whitespace-nowrap">
                            <Link href={`/admin/members/${response.user.id}`} className="font-semibold text-ink hover:text-navy-600">
                              {response.user.displayName}
                            </Link>
                            <span className="block text-sm text-ink/60">
                              {response.user.gradeNumber ? `Grade ${response.user.gradeNumber}` : response.user.ionUsername}
                            </span>
                          </Td>
                          <Td className="whitespace-nowrap text-sm text-ink/60">
                            {formatDateTime(response.updatedAt)}
                          </Td>
                          {form.fields.map((field) => {
                            const value = answers[field.id];
                            const shown = Array.isArray(value) ? value.join(", ") : value;
                            return (
                              <Td key={field.id} className="max-w-xs align-top text-sm text-ink/80">
                                {shown ? <span className="line-clamp-4 whitespace-pre-line">{shown}</span> : <span className="text-ink/35">—</span>}
                              </Td>
                            );
                          })}
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </CardBody>
        </Card>

        {nonResponders.length > 0 ? (
          <details className="border-2 border-rule bg-paper-raised">
            <summary className="cursor-pointer px-7 py-5 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Haven&rsquo;t responded · {nonResponders.length}
            </summary>
            <ul className="grid gap-x-8 gap-y-2 border-t-2 border-rule-faint px-7 py-5 sm:grid-cols-2 lg:grid-cols-3">
              {nonResponders.map((member) => (
                <li key={member.id} className="text-base">
                  <Link href={`/admin/members/${member.id}`} className="text-ink hover:text-navy-600">
                    {member.displayName}
                  </Link>
                  {member.gradeNumber ? <span className="text-ink/50"> · {member.gradeNumber}</span> : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Edit form</CardTitle>
          </CardHeader>
          <CardBody className="sm:p-8">
            <FormBuilder formId={form.id} initial={draftFromForm(form)} responseCount={responseCount} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
