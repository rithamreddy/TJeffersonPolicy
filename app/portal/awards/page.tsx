import type { Metadata } from "next";
import { PageHeading } from "@/components/app/PageHeading";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { IconTrophy } from "@/components/ui/Icons";
import { requireUserPage } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Awards" };

export default async function AwardsPage() {
  const user = await requireUserPage("/portal/awards");

  const awards = await prisma.award.findMany({
    where: { userId: user.id },
    include: { achievement: { select: { level: true, seasonYear: true, eventName: true } } },
    orderBy: { awardedOn: "desc" },
  });

  return (
    <>
      <PageHeading
        title="Awards"
      />

      {awards.length === 0 ? (
        <EmptyState
          icon={<IconTrophy />}
          title="No awards recorded yet"
          action={{ href: "/achievements", label: "See the team record" }}
        />
      ) : (
        <ul className="space-y-3">
          {awards.map((award) => (
            <li key={award.id}>
              <Card>
                <CardBody className="flex flex-wrap items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-signal-pale text-signal-deep">
                    <IconTrophy />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold text-ink">{award.title}</h2>
                    <p className="mt-1 text-base text-ink/60">
                      {[award.placement, award.tournamentName, award.achievement?.eventName]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1.5 text-sm text-ink/60">{formatDate(award.awardedOn)}</p>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
