import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { EmptyState } from "@/components/ui/States";
import { achievementParticipants, achievementStats, listAchievements } from "@/lib/services/achievements";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { AchievementTimeline, type AchievementView } from "./AchievementTimeline";

export const metadata: Metadata = pageMetadata({
  title: "Achievements",
  description:
    "Tournament results, state and national qualifications, and individual awards earned by TJ Policy Debate.",
  path: "/achievements",
});

export default async function AchievementsPage() {
  const rows = await listAchievements();
  const stats = achievementStats(rows);

  const achievements: AchievementView[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    tournamentName: row.tournamentName,
    seasonYear: row.seasonYear,
    placement: row.placement,
    eventName: row.eventName,
    description: row.description,
    participants: achievementParticipants(row),
    level: row.level,
    isFeatured: row.isFeatured,
  }));

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Achievements", path: "/achievements" }])} />

      <PageHero
        eyebrow="The record"
        title="Results, season by season"
        description="Every entry on this page is recorded by the officer team from an actual tournament result."
        index="03"
      >
        {rows.length > 0 ? (
          <dl className="grid max-w-4xl grid-cols-2 gap-px border-2 border-white/25 bg-white/25 sm:grid-cols-4">
            <Stat label="Results recorded" value={stats.total} />
            <Stat label="National level" value={stats.national} />
            <Stat label="State level" value={stats.state} />
            <Stat label="Seasons covered" value={stats.seasons} />
          </dl>
        ) : null}
      </PageHero>

      <Section tone="raised">
        {achievements.length === 0 ? (
          <EmptyState
            title="The record is still being entered"
            action={{ href: "/news", label: "Read team news" }}
          />
        ) : (
          <AchievementTimeline achievements={achievements} />
        )}
      </Section>

      <Section tone="navy" tight>
        <div className="u-grid-12 items-center">
          <div className="col-span-12 lg:col-span-8">
            <p className="c-label">Corrections</p>
            <h2 className="t-h2 mt-8 text-white">Missing a result?</h2>
            <p className="t-body-lg mt-8 max-w-2xl text-white/70">
              Officers maintain this page from the team dashboard. If a placement is missing or wrong, tell an officer
              and it can be corrected in a minute.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:flex lg:justify-end">
            <ButtonLink href="/contact" variant="primary" size="lg">
              Contact the team
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-navy-900 px-7 py-8">
      <dd className="font-display text-5xl font-extrabold tabular-nums leading-none text-white">
        <CountUp value={value} />
      </dd>
      <dt className="mt-5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-signal-bright">{label}</dt>
    </div>
  );
}
