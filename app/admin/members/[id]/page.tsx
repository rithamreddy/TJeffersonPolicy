import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/PageHeading";
import { InlineCheckbox } from "@/components/app/InlineCheckbox";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, DuesBadge, OrderBadge, RegistrationBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { DEBATE_EVENTS, MEMBER_STATUSES, ROLES, currentSeasonYear, labelFor, seasonLabel } from "@/lib/constants";
import { getOwnDues } from "@/lib/services/dues";
import { getMemberDetail, isListedOfficer, userEvents } from "@/lib/services/users";
import { formatDate, formatDateRange, formatMoney } from "@/lib/utils/format";
import { DeleteMemberControl } from "./DeleteMemberControl";
import { DuesWaiverControl } from "./DuesWaiverControl";
import { MemberControls } from "./MemberControls";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberDetail(id);
  return { title: member?.displayName ?? "Member" };
}

export default async function MemberDetailPage({ params }: PageProps) {
  const actor = await requireOfficerPage("/admin/members");
  const { id } = await params;

  const member = await getMemberDetail(id);
  if (!member) notFound();

  const season = currentSeasonYear();
  const balance = await getOwnDues(member.id, season);

  const events = userEvents(member);
  const pinnedByConfig = isListedOfficer(member.ionUsername);

  return (
    <>
      <Link href="/admin/members" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All members
      </Link>

      <PageHeading
        title={member.displayName}
        description={`${member.ionUsername}${member.gradeNumber ? ` · Grade ${member.gradeNumber}` : ""}${
          member.graduationYear ? ` · Class of ${member.graduationYear}` : ""
        }`}
        actions={
          <>
            <Badge tone={member.role === "OFFICER" ? "info" : "neutral"}>{labelFor(ROLES, member.role, "Member")}</Badge>
            {pinnedByConfig ? <Badge tone="warn">Set in configuration</Badge> : null}
            <Badge tone={member.status === "ACTIVE" ? "good" : "neutral"}>
              {labelFor(MEMBER_STATUSES, member.status, "Active")}
            </Badge>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Card>
            <CardBody className="flex items-center gap-4">
              <Avatar name={member.displayName} size="xl" />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-ink">{member.displayName}</p>
                <p className="mt-1.5 truncate text-base text-ink/60">{member.ionUsername}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <ContactRow label="Personal email" value={member.contactEmail} href={member.contactEmail ? `mailto:${member.contactEmail}` : undefined} />
              <ContactRow label="School email" value={member.tjEmail} href={member.tjEmail ? `mailto:${member.tjEmail}` : undefined} />
              <ContactRow label="Phone" value={member.phoneNumber} href={member.phoneNumber ? `tel:${member.phoneNumber}` : undefined} />
              <div className="border-t-2 border-rule-faint pt-3" />
              <ContactRow label="Parent email" value={member.parentEmail} href={member.parentEmail ? `mailto:${member.parentEmail}` : undefined} />
              <ContactRow label="Parent phone" value={member.parentPhone} href={member.parentPhone ? `tel:${member.parentPhone}` : undefined} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <Row label="Events" value={events.length > 0 ? events.map((e) => labelFor(DEBATE_EVENTS, e)).join(", ") : "None recorded"} />
              <Row label="Preferred partner" value={member.partnerName ?? "Not set"} />
              <Row label="First signed in" value={formatDate(member.firstSeenAt)} />
              <Row label="Last signed in" value={member.lastLoginAt ? formatDate(member.lastLoginAt) : "Never"} />
              {member.officer ? <Row label="Officer position" value={`${member.officer.position} (${member.officer.termYear})`} /> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Awards</CardTitle>
            </CardHeader>
            <CardBody className={member.awards.length === 0 ? undefined : "p-0"}>
              {member.awards.length === 0 ? (
                <p className="text-base text-ink/60">No awards recorded.</p>
              ) : (
                <ul className="divide-y-2 divide-rule-faint">
                  {member.awards.map((award) => (
                    <li key={award.id} className="px-7 py-5">
                      <p className="text-base font-medium text-ink">{award.title}</p>
                      <p className="text-sm text-ink/60">{formatDate(award.awardedOn)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage this member</CardTitle>
            </CardHeader>
            <CardBody>
              <MemberControls
                userId={member.id}
                pinnedByConfig={pinnedByConfig}
                initial={{
                  role: member.role,
                  status: member.status,
                  events,
                  nsdaStatus: member.nsdaStatus,
                  nsdaMemberId: member.nsdaMemberId ?? "",
                  gradeNumber: member.gradeNumber,
                }}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-6">
              <CardTitle>Balance</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink/60">{seasonLabel(season)}</span>
                <DuesBadge status={balance.status} />
              </div>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="flex items-center justify-between border-2 border-rule-faint bg-paper-sunk px-6 py-4">
                <span className="text-sm font-medium text-ink">Owed this season</span>
                <span className="font-display text-xl font-bold tabular-nums text-ink">
                  {formatMoney(balance.owedCents)}
                </span>
              </div>

              <p className="text-base leading-relaxed text-ink/60">
                Check off each fee and order below as payment comes in on MySchoolBucks. The amount above drops to $0
                automatically once everything is checked — there is nothing else to &ldquo;settle.&rdquo;
              </p>

              <DuesWaiverControl userId={member.id} initialWaived={balance.waived} initialNote={balance.note ?? ""} />

              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60">
                  Tournament fees
                </h3>
                {member.registrations.length === 0 ? (
                  <EmptyState
                    title="No registrations"
                    description="This member has not entered a tournament yet."
                    className="border-0 bg-transparent py-6"
                  />
                ) : (
                  <ul className="divide-y-2 divide-rule-faint border-2 border-rule-faint">
                    {member.registrations.map((registration) => (
                      <li key={registration.id} className="flex flex-wrap items-center gap-6 px-6 py-4">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/tournaments/${registration.tournamentId}`}
                            className="block truncate text-sm font-semibold text-ink hover:text-navy-600"
                          >
                            {registration.tournament.name}
                          </Link>
                          <p className="truncate text-sm text-ink/60">
                            {registration.division.name} ·{" "}
                            {formatDateRange(registration.tournament.startDate, registration.tournament.endDate)}
                          </p>
                        </div>
                        <RegistrationBadge status={registration.status} />
                        {registration.division.feeCents ? (
                          <div className="flex shrink-0 items-center gap-6">
                            <span className="text-sm font-semibold tabular-nums text-ink">
                              {formatMoney(registration.division.feeCents)}
                            </span>
                            <InlineCheckbox
                              endpoint={`/api/admin/registrations/${registration.id}`}
                              field="feePaid"
                              checked={registration.feePaid}
                              label="Paid"
                              extraBody={{ status: registration.status }}
                            />
                          </div>
                        ) : (
                          <span className="shrink-0 text-sm text-ink/60">No fee</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60">Orders</h3>
                {member.orders.length === 0 ? (
                  <p className="text-base text-ink/60">No orders.</p>
                ) : (
                  <ul className="divide-y-2 divide-rule-faint border-2 border-rule-faint">
                    {member.orders.map((order) => (
                      <li key={order.id} className="flex flex-wrap items-center gap-6 px-6 py-4">
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {order.quantity} × {order.item.name}
                        </span>
                        <OrderBadge status={order.status} />
                        {order.item.priceCents ? (
                          <div className="flex shrink-0 items-center gap-6">
                            <span className="text-sm font-semibold tabular-nums text-ink">
                              {formatMoney(order.item.priceCents * order.quantity)}
                            </span>
                            <InlineCheckbox
                              endpoint={`/api/admin/orders/${order.id}`}
                              field="paid"
                              checked={order.paid}
                              label="Paid"
                              extraBody={{ status: order.status }}
                            />
                          </div>
                        ) : (
                          <span className="shrink-0 text-sm text-ink/60">No price set</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>

          <DeleteMemberControl userId={member.id} displayName={member.displayName} isSelf={member.id === actor.id} />
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="shrink-0 text-ink/60">{label}</span>
      <span className="min-w-0 text-right font-medium text-ink">{value}</span>
    </div>
  );
}

/** A contact detail, linked when present and flagged plainly when missing. */
function ContactRow({ label, value, href }: { label: string; value: string | null; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="shrink-0 text-ink/60">{label}</span>
      {value ? (
        <a href={href} className="min-w-0 truncate text-right font-medium text-navy-600 hover:text-navy-500">
          {value}
        </a>
      ) : (
        <span className="text-right text-ink/40">Not provided</span>
      )}
    </div>
  );
}
