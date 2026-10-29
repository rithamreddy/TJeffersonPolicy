import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Card, CardBody } from "@/components/ui/Card";
import { requireOfficerPage } from "@/lib/auth/guards";
import { NewsEditor, emptyNewsDraft } from "../NewsEditor";

export const metadata: Metadata = { title: "New post" };

export default async function NewNewsPage() {
  await requireOfficerPage("/admin/news/new");

  return (
    <>
      <Link href="/admin/news" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All posts
      </Link>
      <PageHeading title="Write a post" />
      <Card>
        <CardBody className="sm:p-6">
          <NewsEditor initial={emptyNewsDraft} />
        </CardBody>
      </Card>
    </>
  );
}
