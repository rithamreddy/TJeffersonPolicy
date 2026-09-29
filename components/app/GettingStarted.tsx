import Link from "next/link";
import { IconCheck } from "@/components/ui/Icons";
import type { ChecklistTask } from "@/lib/services/onboarding";
import { DismissChecklistButton } from "./DismissChecklistButton";

/**
 * Getting-started checklist on the member dashboard.
 *
 * Each task ticks itself from real data (see lib/services/onboarding.ts), so a
 * member never has to mark anything done by hand, and the card disappears on
 * its own once everything is finished.
 */
export function GettingStarted({
  tasks,
  facebookUrl,
  discordUrl,
}: {
  tasks: ChecklistTask[];
  /** From club settings, so officers can change them without a deploy. */
  facebookUrl: string;
  discordUrl: string;
}) {
  const done = tasks.filter((task) => task.done).length;

  return (
    <section aria-labelledby="getting-started-title" className="mb-12 border-2 border-rule bg-paper-raised">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-rule px-7 py-5">
        <div>
          <h2 id="getting-started-title" className="t-h3 text-ink">
            Getting started
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            {done} of {tasks.length} done
          </p>
        </div>
        <div
          className="flex h-2 w-40 bg-rule-faint"
          role="progressbar"
          aria-label="Getting started progress"
          aria-valuemin={0}
          aria-valuemax={tasks.length}
          aria-valuenow={done}
        >
          <div className="h-full bg-signal" style={{ width: `${(done / tasks.length) * 100}%` }} />
        </div>
      </div>

      <ol className="divide-y-2 divide-rule-faint">
        {tasks.map((task) => (
          <li key={task.key} className="flex flex-wrap items-center gap-5 px-7 py-5 sm:flex-nowrap">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
                task.done ? "border-good bg-good text-paper" : "border-rule bg-paper"
              }`}
              aria-hidden="true"
            >
              {task.done ? <IconCheck className="h-4 w-4" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`font-display text-sm font-bold uppercase tracking-[0.08em] ${task.done ? "text-ink/50" : "text-ink"}`}>
                {task.title}
                <span className="sr-only">{task.done ? " — done" : " — to do"}</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/65">{task.detail}</p>
            </div>
            {task.done ? null : (
              <Link
                href={task.href}
                className="inline-flex min-h-[44px] shrink-0 items-center border-2 border-ink px-4 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ink hover:bg-signal hover:text-paper"
              >
                {task.cta} →
              </Link>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-rule px-7 py-4">
        <p className="text-sm text-ink/60">
          Also join the{" "}
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-600 hover:text-navy-500">
            Facebook group
          </a>{" "}
          and{" "}
          <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-600 hover:text-navy-500">
            Discord
          </a>{" "}
          — tournament logistics are posted there.
        </p>
        <DismissChecklistButton />
      </div>
    </section>
  );
}
