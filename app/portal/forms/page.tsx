import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { listFormsForMember } from "@/lib/services/forms";
import { formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Forms" };

export default async function PortalFormsPage() {
  const user = await requireUserPage("/portal/forms");
  const forms = await listFormsForMember(user.id);

  const toDo = forms.filter((form) => form.accepting && !form.myResponse);
  const done = forms.filter((form) => !(form.accepting && !form.myResponse));

  return (
    <>
      <PageHeading
        title="Forms"
        description="Permission slips, sign-ups, and anything else officers need from you. You can change an answer until the form closes."
      />

      {forms.length === 0 ? (
        <EmptyState title="Nothing to fill in" description="When officers open a form it will appear here." />
      ) : (
        <div className="space-y-12">
          <FormGroup title="To do" forms={toDo} empty="You're all caught up." />
          {done.length > 0 ? <FormGroup title="Answered or closed" forms={done} /> : null}
        </div>
      )}
    </>
  );
}

type MemberForm = Awaited<ReturnType<typeof listFormsForMember>>[number];

function FormGroup({ title, forms, empty }: { title: string; forms: MemberForm[]; empty?: string }) {
  return (
    <section>
      <h2 className="mb-4 border-b-2 border-rule pb-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
        {title} · {forms.length}
      </h2>
      {forms.length === 0 ? (
        <p className="text-base text-ink/60">{empty}</p>
      ) : (
        <ul className="space-y-4">
          {forms.map((form) => (
            <li key={form.id}>
              <Link
                href={`/portal/forms/${form.id}`}
                className="group flex flex-col gap-4 border-2 border-rule bg-paper-raised p-6 transition-colors hover:bg-paper-sunk sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="t-h3 text-ink group-hover:text-navy-600">{form.title}</p>
                  <p className="mt-2 text-sm text-ink/60">
                    {form._count.fields} question{form._count.fields === 1 ? "" : "s"}
                    {form.closesAt ? ` · ${form.accepting ? "Closes" : "Closed"} ${formatDateTime(form.closesAt)}` : ""}
                  </p>
                </div>
                <div className="shrink-0">
                  {form.myResponse ? (
                    <Badge tone="good">Answered</Badge>
                  ) : form.accepting ? (
                    <Badge tone="warn">Needs your answer</Badge>
                  ) : (
                    <Badge tone="neutral">Closed</Badge>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
