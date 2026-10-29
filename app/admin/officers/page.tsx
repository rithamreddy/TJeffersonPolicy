import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { currentSeasonYear } from "@/lib/constants";
import { listOfficerProfiles, officerEvents } from "@/lib/services/officers";
import { listMembers } from "@/lib/services/users";
import { OfficerEditor } from "./OfficerEditor";

export const metadata: Metadata = { title: "Officer team" };

export default async function AdminOfficersPage() {
  await requireOfficerPage("/admin/officers");

  const [profiles, members] = await Promise.all([listOfficerProfiles(), listMembers()]);

  return (
    <>
      <PageHeading
        title="Officer team"
        actions={
          <ButtonLink href="/officers" size="sm" variant="outline" external>
            View public page
          </ButtonLink>
        }
      />

      <div className="mb-5">
        <Alert tone="info" title="Adding someone here grants officer access">
          Saving an officer profile also gives that person the officer role. Removing them offers two choices: take them
          off the public page only, or also revoke their dashboard access.
        </Alert>
      </div>

      <OfficerEditor
        currentSeason={currentSeasonYear()}
        officers={profiles.map((profile) => ({
          userId: profile.userId,
          displayName: profile.user.displayName,
          position: profile.position,
          bio: profile.bio,
          publicEmail: profile.publicEmail,
          photoUrl: profile.photoUrl,
          events: officerEvents(profile),
          termYear: profile.termYear,
          isPublic: profile.isPublic,
          sortOrder: profile.sortOrder,
        }))}
        members={members.map((member) => ({ id: member.id, displayName: member.displayName, role: member.role }))}
      />
    </>
  );
}
