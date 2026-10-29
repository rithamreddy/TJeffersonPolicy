import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconBook } from "@/components/ui/Icons";
import { isOfficer, requireUserPage } from "@/lib/auth/guards";
import { currentSeasonYear } from "@/lib/constants";
import { openCaselist } from "@/lib/integrations/opencaselist";
import { EXTERNAL_LINKS } from "@/lib/content/club";
import { listResourcesForUser, resourceTags } from "@/lib/services/resources";
import { getSettings } from "@/lib/services/settings";
import { ResourceBrowser, type ResourceView } from "./ResourceBrowser";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const user = await requireUserPage("/portal/resources");
  const officer = isOfficer(user);

  const [rows, settings] = await Promise.all([
    listResourcesForUser({ isOfficer: officer }),
    getSettings(),
  ]);

  const resources: ResourceView[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    url: row.url,
    tags: resourceTags(row),
    visibility: row.visibility,
    addedBy: row.addedBy?.displayName ?? null,
  }));

  const season = currentSeasonYear();

  return (
    <>
      <PageHeading
        title="Resources"
        actions={officer ? <ButtonLink href="/admin/resources" size="sm" variant="outline">Manage resources</ButtonLink> : undefined}
      />

      {resources.length === 0 ? (
        <EmptyState
          icon={<IconBook />}
          title="The library is empty"
          action={officer ? { href: "/admin/resources", label: "Add a resource" } : { href: "/portal", label: "Back to dashboard" }}
        />
      ) : (
        <ResourceBrowser resources={resources} />
      )}

      {/* Standing external references. These are links, not integrations —
          see lib/integrations/opencaselist.ts for why. */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Standing references</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-base leading-relaxed text-ink/60">
            These sites need your own account. We link you straight through rather than proxying them, so you stay
            signed in as yourself.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { href: openCaselist.caselist(season), label: "openCaselist — HS Policy", note: "Published affs, negs, and cites" },
              { href: openCaselist.openEvidence, label: "Open Evidence Project", note: "Free camp evidence archives" },
              { href: EXTERNAL_LINKS.tabroom, label: "Tabroom", note: "Entries, pairings, and results" },
              { href: settings["links.lectureSlides"], label: "Lecture slides", note: "Meeting materials from past lectures" },
            ].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col border-2 border-rule-faint px-6 py-4 transition-colors hover:border-navy-300 hover:bg-navy-100"
                >
                  <span className="text-sm font-semibold text-ink">{link.label}</span>
                  <span className="mt-1.5 text-sm text-ink/60">{link.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
