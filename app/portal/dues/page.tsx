import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { DuesBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { Alert, EmptyState } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { currentSeasonYear, seasonLabel } from "@/lib/constants";
import { getOwnDues, listOwnDuesHistory, listOwnUnpaidItems } from "@/lib/services/dues";
import { getSettings } from "@/lib/services/settings";
import { formatDate, formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dues" };

export default async function DuesPage() {
  const user = await requireUserPage("/portal/dues");
  const season = currentSeasonYear();

  const [dues, unpaidItems, history, settings] = await Promise.all([
    getOwnDues(user.id, season),
    listOwnUnpaidItems(user.id, season),
    listOwnDuesHistory(user.id),
    getSettings(),
  ]);

  const status = dues.status;
  const amount = dues.owedCents;
  const settled = amount === 0;
  const pastHistory = history.filter((record) => record.seasonYear !== season);

  return (
    <>
      <PageHeading
        title="Dues"
        description={`${seasonLabel(season)} season`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>This season</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink/60">Status</span>
              <DuesBadge status={status} />
            </div>
            <div className="flex items-center justify-between border-t-2 border-rule-faint pt-4">
              <span className="text-sm text-ink/60">Amount owed</span>
              <span className="font-display text-2xl font-bold tabular-nums text-ink">{formatMoney(amount)}</span>
            </div>
            {dues.waived ? (
              <p className="text-base leading-relaxed text-ink/60">
                An officer has excused you from dues for this season.
                {dues.note ? " Their note is below." : ""}
              </p>
            ) : (
              <p className="text-base leading-relaxed text-ink/60">
                This drops as each tournament fee or order is checked off paid — see what&rsquo;s still outstanding on
                the right.
              </p>
            )}
            {dues.note ? (
              <div className="border-t-2 border-rule-faint pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/60">Note from officers</p>
                <p className="mt-1.5 text-base leading-relaxed text-ink/75">{dues.note}</p>
              </div>
            ) : null}
            {dues.updatedAt ? (
              <p className="border-t-2 border-rule-faint pt-4 text-sm text-ink/60">Last updated {formatDate(dues.updatedAt)}</p>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-6">
          {settled ? (
            <Alert tone="good" title="You are settled for this season">
              Nothing to pay. If you think this is wrong, tell the treasurer.
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>What you still owe for</CardTitle>
              </CardHeader>
              <CardBody className={unpaidItems.length === 0 ? undefined : "space-y-4 p-0"}>
                {unpaidItems.length === 0 ? (
                  <p className="text-base text-ink/60">Nothing itemised, but ask the treasurer if this looks wrong.</p>
                ) : (
                  <ul className="divide-y-2 divide-rule-faint">
                    {unpaidItems.map((item) => (
                      <li key={item.key} className="flex items-center justify-between gap-6 px-7 py-5">
                        <span className="text-sm text-ink">{item.label}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                          {formatMoney(item.amountCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-4 px-5 pb-5 pt-1">
                  <p className="text-base leading-relaxed text-ink/60">{settings["dues.instructions"]}</p>
                  <ButtonLink href={settings["links.myschoolbucks"]} external>
                    Pay on MySchoolBucks
                  </ButtonLink>
                  <div className="border-2 border-rule-faint bg-paper-sunk p-3.5">
                    <p className="text-base leading-relaxed text-ink/60">
                      This site never asks for card or bank details and does not process payments. An officer checks
                      each item off after confirming payment, so there may be a short delay between paying and seeing
                      it disappear here.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Past seasons</CardTitle>
            </CardHeader>
            <CardBody className={pastHistory.length === 0 ? undefined : "p-0"}>
              {pastHistory.length === 0 ? (
                <EmptyState
                  title="No past seasons yet"
                  className="border-0 bg-transparent py-6"
                />
              ) : (
                <TableWrap label="Dues history" className="border-0">
                  <Table className="min-w-[380px]">
                    <thead>
                      <tr>
                        <Th>Season</Th>
                        <Th>Total</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastHistory.map((record) => (
                        <Tr key={record.seasonYear}>
                          <Td className="font-medium">{seasonLabel(record.seasonYear)}</Td>
                          <Td className="tabular-nums">{formatMoney(record.totalCents)}</Td>
                          <Td>
                            <DuesBadge status={record.status} />
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
