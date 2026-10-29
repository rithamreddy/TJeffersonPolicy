import Link from "next/link";
import { PageHeading, StatTile } from "@/components/app/PageHeading";
import { Badge, OrderBadge, RegistrationBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { seasonLabel } from "@/lib/constants";
import { dashboardSummary, recentActivity } from "@/lib/services/analytics";
import { formatDateTime, formatMoney, formatRelative } from "@/lib/utils/format";

export default async function AdminDashboard() {
  await requireOfficerPage("/admin");

  const [summary, activity] = await Promise.all([dashboardSummary(), recentActivity()]);

  return (
    <>
      <PageHeading
        title="Officer dashboard"
        description={`${seasonLabel(summary.seasonYear)} season`}
        actions={
          <>
            <ButtonLink href="/admin/tournaments/new" size="sm">
              New tournament
            </ButtonLink>
            <ButtonLink href="/admin/news/new" size="sm" variant="outline">
              Write a post
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Members" value={summary.totalMembers} hint={`${summary.activeMembers} active · ${summary.officers} officers`} href="/admin/members" />
        <StatTile
          label="Pending registrations"
          value={summary.pendingRegistrations}
          tone={summary.pendingRegistrations > 0 ? "warn" : "default"}
          href="/admin/registrations"
        />
        <StatTile
          label="Dues outstanding"
          value={formatMoney(summary.outstandingCents)}
          hint={`${summary.duesUnsettled} member${summary.duesUnsettled === 1 ? "" : "s"} unsettled`}
          tone={summary.outstandingCents > 0 ? "warn" : "good"}
          href="/admin/dues"
        />
        <StatTile
          label="Open orders"
          value={summary.openOrders}
          href="/admin/orders"
        />
      </div>

      <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Upcoming tournaments" value={summary.upcomingTournaments} hint={`${summary.openTournaments} open for registration`} href="/admin/tournaments" />
        <StatTile label="Resources" value={summary.resources} href="/admin/resources" />
        <StatTile label="Draft posts" value={summary.draftNews} href="/admin/news" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between gap-6">
            <CardTitle>Recent registrations</CardTitle>
            <Link href="/admin/registrations" className="text-sm font-semibold text-navy-600 hover:text-navy-500">
              All →
            </Link>
          </CardHeader>
          <CardBody className={activity.registrations.length === 0 ? undefined : "p-0"}>
            {activity.registrations.length === 0 ? (
              <EmptyState title="No registrations yet" className="border-0 bg-transparent py-6" />
            ) : (
              <ul className="divide-y-2 divide-rule-faint">
                {activity.registrations.map((registration) => (
                  <li key={registration.id} className="flex items-center gap-6 px-7 py-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-ink">{registration.user.displayName}</p>
                      <p className="truncate text-sm text-ink/60">
                        {registration.tournament.name} · {registration.division.name}
                      </p>
                    </div>
                    <RegistrationBadge status={registration.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-6">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/admin/orders" className="text-sm font-semibold text-navy-600 hover:text-navy-500">
              All →
            </Link>
          </CardHeader>
          <CardBody className={activity.orders.length === 0 ? undefined : "p-0"}>
            {activity.orders.length === 0 ? (
              <EmptyState title="No orders yet" className="border-0 bg-transparent py-6" />
            ) : (
              <ul className="divide-y-2 divide-rule-faint">
                {activity.orders.map((order) => (
                  <li key={order.id} className="flex items-center gap-6 px-7 py-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-ink">{order.user.displayName}</p>
                      <p className="truncate text-sm text-ink/60">
                        {order.quantity} × {order.item.name}
                      </p>
                    </div>
                    <OrderBadge status={order.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-6">
            <CardTitle>News</CardTitle>
            <Link href="/admin/news" className="text-sm font-semibold text-navy-600 hover:text-navy-500">
              Manage →
            </Link>
          </CardHeader>
          <CardBody className={activity.news.length === 0 ? undefined : "p-0"}>
            {activity.news.length === 0 ? (
              <EmptyState
                title="Nothing written yet"
                action={{ href: "/admin/news/new", label: "Write the first post" }}
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="divide-y-2 divide-rule-faint">
                {activity.news.map((post) => (
                  <li key={post.id} className="flex items-center gap-6 px-7 py-5">
                    <Link href={`/admin/news/${post.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink hover:text-navy-600">
                      {post.title}
                    </Link>
                    <Badge tone={post.status === "PUBLISHED" ? "good" : "warn"}>
                      {post.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-6">
            <CardTitle>Recent activity</CardTitle>
            <Link href="/admin/audit" className="text-sm font-semibold text-navy-600 hover:text-navy-500">
              Audit log →
            </Link>
          </CardHeader>
          <CardBody className={activity.audit.length === 0 ? undefined : "p-0"}>
            {activity.audit.length === 0 ? (
              <EmptyState title="No recorded activity" className="border-0 bg-transparent py-6" />
            ) : (
              <ul className="divide-y-2 divide-rule-faint">
                {activity.audit.map((entry) => (
                  <li key={entry.id} className="px-7 py-5">
                    <p className="text-base text-ink">{entry.summary}</p>
                    <p className="mt-1.5 text-sm text-ink/60" title={formatDateTime(entry.createdAt)}>
                      {entry.actorLabel} · {formatRelative(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
