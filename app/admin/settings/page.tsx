import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { getSettings } from "@/lib/services/settings";
import { SettingsForm, type SettingGroup } from "./SettingsForm";

export const metadata: Metadata = { title: "Club settings" };

const GROUPS: SettingGroup[] = [
  {
    heading: "Contact",
    description: "Shown in the footer and on the public contact page.",
    fields: [
      { key: "club.email", label: "Team email", type: "email" },
      { key: "club.addressLine1", label: "Address line 1" },
      { key: "club.addressLine2", label: "Address line 2" },
    ],
  },
  {
    heading: "Social links",
    description: "Used in the footer, the contact page, and the join flow.",
    fields: [
      { key: "social.instagram", label: "Instagram", type: "url" },
      { key: "social.facebook", label: "Facebook group", type: "url" },
      { key: "social.discord", label: "Discord invite", type: "url" },
    ],
  },
  {
    heading: "Dues & payment",
    description:
      "This site never processes payments — these settings only point members to the right place. The amount each member owes is computed automatically from their tournament fees and orders; it is not set here.",
    fields: [
      { key: "links.myschoolbucks", label: "MySchoolBucks store link", type: "url" },
      {
        key: "dues.instructions",
        label: "Payment instructions",
        type: "textarea",
        hint: "Shown to members on their dues page.",
      },
    ],
  },
  {
    heading: "Links & figures",
    description: "Figures appear on the public home page. Keep them honest — they are the team's own published numbers.",
    fields: [
      { key: "links.lectureSlides", label: "Lecture slides folder", type: "url" },
      { key: "links.calendarEmbed", label: "Google Calendar embed URL", type: "url" },
      { key: "figures.activeDebaters", label: "Active debaters (home page)", hint: 'e.g. "50+"' },
      { key: "figures.tournamentsPerYear", label: "Tournaments a year (home page)", hint: 'e.g. "10+"' },
    ],
  },
];

export default async function AdminSettingsPage() {
  await requireOfficerPage("/admin/settings");
  const settings = await getSettings();

  return (
    <>
      <PageHeading
        title="Club settings"
      />

      <div className="mb-5">
        <Alert tone="warn" title="The home-page figures are claims">
          &ldquo;Active debaters&rdquo; and &ldquo;tournaments a year&rdquo; were carried over from the previous site and are
          shown to the public as the team&rsquo;s own numbers. Update them to something you can stand behind each season.
        </Alert>
      </div>

      <Card>
        <CardBody className="sm:p-6">
          <SettingsForm groups={GROUPS} initial={settings} />
        </CardBody>
      </Card>
    </>
  );
}
