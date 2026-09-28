import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, DuesBadge, NsdaBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { MEMBER_STATUSES, ROLES, currentSeasonYear, labelFor } from "@/lib/constants";
import { getOwnDues } from "@/lib/services/dues";
import { userEvents } from "@/lib/services/users";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUserPage("/portal/profile");

  const [dues, counts] = await Promise.all([
    getOwnDues(user.id, currentSeasonYear()),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { _count: { select: { registrations: true, orders: true, awards: true } } },
    }),
  ]);

  return (
    <>
      <PageHeading title="Profile" description="What officers see about you, and the few things you control yourself." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardBody className="text-center">
              <div className="flex justify-center">
                <Avatar name={user.displayName} size="xl" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink">{user.displayName}</h2>
              <p className="mt-1 text-base text-ink/60">{user.ionUsername}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge tone={user.role === "OFFICER" ? "info" : "neutral"}>{labelFor(ROLES, user.role, "Member")}</Badge>
                <Badge tone={user.status === "ACTIVE" ? "good" : "neutral"}>
                  {labelFor(MEMBER_STATUSES, user.status, "Active")}
                </Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>From your Ion account</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <Row label="Grade" value={user.gradeNumber ? `Grade ${user.gradeNumber}` : "Not reported"} />
              <Row label="Graduation year" value={user.graduationYear?.toString() ?? "Not reported"} />
              <Row label="First signed in" value={formatDate(user.firstSeenAt)} />
              <p className="border-t-2 border-rule-faint pt-3 text-base leading-relaxed text-ink/60">
                These come from Ion and refresh each time you sign in. To correct them, update your Ion profile. Your
                school email is edited on the right.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Set by officers</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-6">
                <span className="text-ink/60">Dues</span>
                <DuesBadge status={dues.status} />
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-ink/60">NSDA membership</span>
                <NsdaBadge status={user.nsdaStatus} />
              </div>
              <Row label="Registrations" value={String(counts?._count.registrations ?? 0)} />
              <Row label="Orders" value={String(counts?._count.orders ?? 0)} />
              <Row label="Awards" value={String(counts?._count.awards ?? 0)} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit your details</CardTitle>
            </CardHeader>
            <CardBody>
              <ProfileForm
                initial={{
                  contactEmail: user.contactEmail ?? "",
                  tjEmail: user.tjEmail ?? "",
                  phoneNumber: user.phoneNumber ?? "",
                  parentEmail: user.parentEmail ?? "",
                  parentPhone: user.parentPhone ?? "",
                  events: userEvents(user),
                  partnerName: user.partnerName ?? "",
                  nsdaMemberId: user.nsdaMemberId ?? "",
                }}
              />
            </CardBody>
          </Card>

          <Alert tone="info" title="What is private">
            Your contact details, your parent or guardian&rsquo;s details, dues, orders, registrations, and form answers are
            visible only to you and the officer team. They are never shown on the public site. The public officers page lists only people who have an officer profile,
            with the contact address they chose to publish.
          </Alert>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="text-ink/60">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink">{value}</span>
    </div>
  );
}
