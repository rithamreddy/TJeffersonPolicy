import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Card, CardBody } from "@/components/ui/Card";
import { requireOfficerPage } from "@/lib/auth/guards";
import { FormBuilder } from "../FormBuilder";
import { emptyFormDraft } from "../formDraft";

export const metadata: Metadata = { title: "New form" };

export default async function NewFormPage() {
  await requireOfficerPage("/admin/forms/new");

  return (
    <>
      <Link href="/admin/forms" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All forms
      </Link>
      <PageHeading
        title="New form"
        description="Save it as a draft while you work. Members can't see it until you set it to Open."
      />
      <Card>
        <CardBody className="sm:p-8">
          <FormBuilder initial={emptyFormDraft} />
        </CardBody>
      </Card>
    </>
  );
}
