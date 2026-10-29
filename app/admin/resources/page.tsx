import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { listResourcesForUser, resourceTags } from "@/lib/services/resources";
import { ResourceEditor } from "./ResourceEditor";

export const metadata: Metadata = { title: "Resources" };

export default async function AdminResourcesPage() {
  await requireOfficerPage("/admin/resources");
  const rows = await listResourcesForUser({ isOfficer: true });

  const resources = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    url: row.url,
    tags: resourceTags(row),
    visibility: row.visibility,
    addedBy: row.addedBy?.displayName ?? null,
  }));

  return (
    <>
      <PageHeading
        title="Resources"
        actions={
          <ButtonLink href="/portal/resources" size="sm" variant="outline">
            Member view
          </ButtonLink>
        }
      />

      <div className="mb-5">
        <Alert tone="info">
          These are links, not uploads. Host files wherever the team already does — Drive, a caselist, a shared folder —
          and make sure the sharing settings on the other end match who should see it here.
        </Alert>
      </div>

      <ResourceEditor resources={resources} />
    </>
  );
}
