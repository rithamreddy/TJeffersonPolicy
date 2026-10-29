import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Card, CardBody } from "@/components/ui/Card";
import { requireOfficerPage } from "@/lib/auth/guards";
import { TournamentForm } from "../TournamentForm";
import { emptyDraft } from "../tournamentDraft";

export const metadata: Metadata = { title: "New tournament" };

export default async function NewTournamentPage() {
  await requireOfficerPage("/admin/tournaments/new");

  return (
    <>
      <Link href="/admin/tournaments" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All tournaments
      </Link>

      <PageHeading
        title="New tournament"
      />

      <Card>
        <CardBody className="sm:p-6">
          <TournamentForm mode="create" initial={emptyDraft} />
        </CardBody>
      </Card>
    </>
  );
}
