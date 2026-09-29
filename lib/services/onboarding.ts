/**
 * Member onboarding: the welcome tour and the getting-started checklist.
 *
 * Every checklist task is derived from real data, never from a click on the
 * checklist itself, so it cannot drift from the truth: "Finish your profile"
 * ticks itself once the profile is actually complete, and un-ticks if a
 * required field is later cleared.
 *
 * Both flags start empty for everyone, existing members included, so the
 * whole team sees the tour once after this ships.
 */
import { prisma } from "../db";
import { countUnansweredForms } from "./forms";
import { missingProfileFields, type ProfileCompletionInput } from "./profile-completion";

export interface ChecklistTask {
  key: "profile" | "tour" | "forms" | "tournament";
  title: string;
  detail: string;
  href: string;
  cta: string;
  done: boolean;
}

export interface ChecklistFacts {
  profileMissing: number;
  tourCompleted: boolean;
  unansweredForms: number;
  registrations: number;
}

/** Pure: turns the facts into the ordered task list. See tests/onboarding.test.ts. */
export function buildChecklist(facts: ChecklistFacts): ChecklistTask[] {
  return [
    {
      key: "profile",
      title: "Finish your profile",
      detail:
        facts.profileMissing > 0
          ? `${facts.profileMissing} detail${facts.profileMissing === 1 ? "" : "s"} still missing — your contact info, a parent or guardian, and your events.`
          : "Your contact details, parent or guardian, and events are all in.",
      href: "/portal/profile",
      cta: "Open profile",
      done: facts.profileMissing === 0,
    },
    {
      key: "tour",
      title: "Learn your way around",
      detail: "A one-minute tour of where everything lives.",
      href: "/portal?tour=1",
      cta: "Take the tour",
      done: facts.tourCompleted,
    },
    {
      key: "forms",
      title: "Answer open forms",
      detail:
        facts.unansweredForms > 0
          ? `${facts.unansweredForms} form${facts.unansweredForms === 1 ? " needs" : "s need"} your answer.`
          : "Nothing waiting. New forms appear here and in the sidebar.",
      href: "/portal/forms",
      cta: "Go to forms",
      done: facts.unansweredForms === 0,
    },
    {
      key: "tournament",
      title: "Register for a tournament",
      detail: "Pick an event and register — an officer confirms your entry and handles Tabroom.",
      href: "/portal/tournaments",
      cta: "See tournaments",
      done: facts.registrations > 0,
    },
  ];
}

/** Whether the checklist should render at all. */
export function checklistVisible(tasks: readonly ChecklistTask[], dismissed: boolean): boolean {
  return !dismissed && tasks.some((task) => !task.done);
}

export async function getChecklist(
  user: ProfileCompletionInput & { id: string; onboardingTourCompletedAt: Date | null },
): Promise<ChecklistTask[]> {
  const [unansweredForms, registrations] = await Promise.all([
    countUnansweredForms(user.id),
    prisma.tournamentRegistration.count({ where: { userId: user.id } }),
  ]);

  return buildChecklist({
    profileMissing: missingProfileFields(user).length,
    tourCompleted: Boolean(user.onboardingTourCompletedAt),
    unansweredForms,
    registrations,
  });
}

/** Record that the member has finished or skipped the tour. Idempotent. */
export async function markTourCompleted(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, onboardingTourCompletedAt: null },
    data: { onboardingTourCompletedAt: new Date() },
  });
}

export async function dismissChecklist(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, onboardingChecklistDismissedAt: null },
    data: { onboardingChecklistDismissedAt: new Date() },
  });
}
