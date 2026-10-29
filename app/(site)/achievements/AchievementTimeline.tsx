"use client";

import { useMemo, useState } from "react";
import { ACHIEVEMENT_LEVELS, labelFor, seasonLabel } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/States";

export interface AchievementView {
  id: string;
  title: string;
  tournamentName: string;
  seasonYear: number;
  placement: string;
  eventName: string | null;
  description: string | null;
  participants: string[];
  level: string;
  isFeatured: boolean;
}

const LEVEL_ORDER = ["NATIONAL", "STATE", "REGIONAL", "INVITATIONAL", "LOCAL"] as const;

const levelStyles: Record<string, string> = {
  NATIONAL: "bg-signal text-paper",
  STATE: "bg-navy-600 text-white",
  REGIONAL: "bg-navy-500 text-white",
  INVITATIONAL: "bg-navy-100 text-navy-800",
  LOCAL: "bg-paper-sunk text-ink",
};

/**
 * Interactive achievements timeline.
 *
 * Filtering happens on the client over a list that is already fully rendered
 * server-side, so the page works with JavaScript disabled — the filter chips
 * are an enhancement, not the only route to the content.
 */
export function AchievementTimeline({ achievements }: { achievements: AchievementView[] }) {
  const [level, setLevel] = useState<string>("ALL");
  const [season, setSeason] = useState<number | "ALL">("ALL");

  const seasons = useMemo(
    () => [...new Set(achievements.map((a) => a.seasonYear))].sort((a, b) => b - a),
    [achievements],
  );

  const availableLevels = useMemo(
    () => LEVEL_ORDER.filter((candidate) => achievements.some((a) => a.level === candidate)),
    [achievements],
  );

  const filtered = useMemo(
    () =>
      achievements.filter(
        (achievement) =>
          (level === "ALL" || achievement.level === level) && (season === "ALL" || achievement.seasonYear === season),
      ),
    [achievements, level, season],
  );

  const grouped = useMemo(() => {
    const map = new Map<number, AchievementView[]>();
    for (const achievement of filtered) {
      const bucket = map.get(achievement.seasonYear) ?? [];
      bucket.push(achievement);
      map.set(achievement.seasonYear, bucket);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  return (
    <div>
      <div className="flex flex-col gap-10 border-y-2 border-rule py-8 sm:flex-row sm:items-end sm:justify-between">
        <fieldset>
          <legend className="c-label mb-5">Filter by level</legend>
          <div className="flex flex-wrap gap-3">
            <FilterChip active={level === "ALL"} onClick={() => setLevel("ALL")}>
              All
            </FilterChip>
            {availableLevels.map((option) => (
              <FilterChip key={option} active={level === option} onClick={() => setLevel(option)}>
                {labelFor(ACHIEVEMENT_LEVELS, option)}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        {seasons.length > 1 ? (
          <label className="flex items-center gap-4">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink/60">Season</span>
            <select
              value={String(season)}
              onChange={(event) => setSeason(event.target.value === "ALL" ? "ALL" : Number(event.target.value))}
              className="min-h-[52px] border-2 border-rule bg-paper-raised px-5 font-display text-sm font-bold uppercase tracking-[0.08em] text-ink"
            >
              <option value="ALL">All seasons</option>
              {seasons.map((year) => (
                <option key={year} value={year}>
                  {seasonLabel(year)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div aria-live="polite" className="mt-6 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink/55">
        {filtered.length === achievements.length
          ? `${achievements.length} result${achievements.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${achievements.length} results`}
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          className="mt-12"
          title="Nothing matches that filter"
        />
      ) : (
        <div className="mt-16 space-y-20">
          {grouped.map(([year, items]) => (
            <section key={year} aria-labelledby={`season-${year}`}>
              <div className="flex items-baseline gap-6">
                <h2 id={`season-${year}`} className="t-h2 text-ink">
                  {seasonLabel(year)}
                </h2>
                <span className="h-1 flex-1 bg-rule" aria-hidden="true" />
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-navy-600">
                  {items.length} result{items.length === 1 ? "" : "s"}
                </span>
              </div>

              <ul className="mt-10 border-l-4 border-navy-600 pl-8 sm:pl-10">
                {items.map((achievement, index) => (
                  <Reveal as="li" key={achievement.id} delay={index * 60} className="relative pb-8 last:pb-0">
                    <span
                      className={cn(
                        "absolute top-8 h-4 w-4",
                        achievement.level === "NATIONAL" ? "bg-signal" : "bg-navy-600",
                        "-left-[40px] sm:-left-[48px]",
                      )}
                      aria-hidden="true"
                    />
                    <article className="c-frame p-8 transition-colors hover:bg-paper-sunk">
                      <div className="flex flex-wrap items-center gap-4">
                        <span
                          className={cn(
                            "px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.16em]",
                            levelStyles[achievement.level] ?? levelStyles.LOCAL,
                          )}
                        >
                          {labelFor(ACHIEVEMENT_LEVELS, achievement.level)}
                        </span>
                        {achievement.eventName ? (
                          <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55">
                            {achievement.eventName}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="t-h3 mt-6 text-ink">{achievement.title}</h3>
                      <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.08em] text-navy-600">
                        {achievement.placement} · {achievement.tournamentName}
                      </p>
                      {achievement.description ? (
                        <p className="t-body t-muted mt-5">{achievement.description}</p>
                      ) : null}
                      {achievement.participants.length > 0 ? (
                        <ul className="mt-6 flex flex-wrap gap-2">
                          {achievement.participants.map((person) => (
                            <li
                              key={person}
                              className="border-2 border-rule-faint px-3 py-1.5 text-sm font-medium text-ink/75"
                            >
                              {person}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  </Reveal>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-[44px] border-2 px-5 font-display text-xs font-bold uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-ink bg-navy-800 text-white"
          : "border-rule-faint bg-paper-raised text-ink hover:border-ink hover:bg-signal hover:text-paper",
      )}
    >
      {children}
    </button>
  );
}
