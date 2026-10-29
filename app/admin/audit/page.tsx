import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { auditActionFacets, listAuditLog } from "@/lib/services/audit";
import { formatDateTime, formatRelative } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ action?: string; page?: string }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  await requireOfficerPage("/admin/audit");
  const filters = await searchParams;

  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const [{ entries, total }, actions] = await Promise.all([
    listAuditLog({ take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, action: filters.action }),
    auditActionFacets(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/admin/audit?${query}` : "/admin/audit";
  }

  return (
    <>
      <PageHeading title="Audit log" />

      <div className="mb-10">
        <Alert tone="info">
          Sign-ins, role changes, dues updates, publishing, and every other administrative action is recorded here. This
          is the record to check first if something looks wrong.
        </Alert>
      </div>

      {actions.length > 0 ? (
        <div className="mb-10 flex flex-wrap items-center gap-3 border-2 border-rule bg-paper-raised p-5">
          <span className="mr-2 font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink/60">
            Filter
          </span>
          <Link href="/admin/audit" className={chip(!filters.action)}>
            All
          </Link>
          {actions.map((action) => (
            <Link
              key={action}
              href={`/admin/audit?action=${encodeURIComponent(action)}`}
              className={chip(filters.action === action)}
            >
              {action}
            </Link>
          ))}
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          action={filters.action ? { href: "/admin/audit", label: "Clear filter" } : undefined}
        />
      ) : (
        <>
          <Card>
            <CardBody className="p-0">
              <ol className="divide-y-2 divide-rule-faint">
                {entries.map((entry) => (
                  <li key={entry.id} className="px-7 py-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-4">
                      <p className="t-body text-ink">{entry.summary}</p>
                      <time
                        dateTime={entry.createdAt.toISOString()}
                        title={formatDateTime(entry.createdAt)}
                        className="shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-navy-600"
                      >
                        {formatRelative(entry.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 text-base text-ink/60">
                      <span className="font-semibold text-ink/75">{entry.actorLabel}</span> · {entry.action} ·{" "}
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <nav className="mt-8 flex flex-wrap items-center justify-between gap-6" aria-label="Audit log pages">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
              Page {page} of {totalPages} · {total} entr{total === 1 ? "y" : "ies"}
            </p>
            <div className="flex gap-3">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className={chip(false)}>
                  ← Newer
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className={chip(false)}>
                  Older →
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      )}
    </>
  );
}

/** Square filter/pager chip. Active reads as a solid navy block. */
function chip(active: boolean) {
  return [
    "inline-flex min-h-[44px] items-center border-2 px-4 font-display text-[11px] font-bold uppercase tracking-[0.12em]",
    active
      ? "border-ink bg-navy-800 text-white"
      : "border-rule-faint bg-paper-raised text-ink hover:border-ink hover:bg-signal hover:text-paper",
  ].join(" ");
}
