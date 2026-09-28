import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { fieldOptions, getFormForMember, isFormAcceptingResponses, parseAnswers } from "@/lib/services/forms";
import { formatDateTime } from "@/lib/utils/format";
import { ResponseForm } from "./ResponseForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Form" };

export default async function PortalFormPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUserPage(`/portal/forms/${id}`);

  const form = await getFormForMember(id, user.id);
  if (!form) notFound();

  const accepting = isFormAcceptingResponses(form);
  const answers = form.myResponse ? parseAnswers(form.myResponse.answers) : {};

  return (
    <>
      <Link href="/portal/forms" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All forms
      </Link>

      <PageHeading
        title={form.title}
        description={form.closesAt ? `${accepting ? "Closes" : "Closed"} ${formatDateTime(form.closesAt)}` : undefined}
        actions={form.myResponse ? <Badge tone="good">Answered</Badge> : undefined}
      />

      <Card>
        <CardBody className="space-y-8 sm:p-10">
          {form.description ? (
            <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-ink/80">{form.description}</p>
          ) : null}

          {!accepting ? (
            <Alert tone="info" title="This form is closed">
              {form.myResponse
                ? "Your answers are shown below. They can no longer be changed."
                : "It is no longer accepting answers. Ask an officer if you still need to respond."}
            </Alert>
          ) : form.myResponse ? (
            <Alert tone="good" title="You've answered this form">
              Last saved {formatDateTime(form.myResponse.updatedAt)}. You can change your answers until it closes.
            </Alert>
          ) : null}

          <ResponseForm
            formId={form.id}
            readOnly={!accepting}
            hasResponse={Boolean(form.myResponse)}
            fields={form.fields.map((field) => ({
              id: field.id,
              type: field.type,
              label: field.label,
              helpText: field.helpText,
              required: field.required,
              options: fieldOptions(field),
            }))}
            initial={answers}
          />
        </CardBody>
      </Card>
    </>
  );
}
