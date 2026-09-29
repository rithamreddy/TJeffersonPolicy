"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client/api";

interface TourStep {
  title: string;
  body: string;
  /** The sidebar item this step explains, highlighted on desktop. */
  navHref?: string;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to the team portal",
    body: "Everything you need as a member of TJ Policy Debate lives here. This takes about a minute. Skip it if you like — you can replay it any time from your dashboard.",
  },
  {
    title: "Start with your profile",
    body: "Add your personal and school email, a phone number, a parent or guardian, and the events you compete in. Officers need these to enter you in tournaments, and team news is emailed to you and your parent.",
    navHref: "/portal/profile",
  },
  {
    title: "News",
    body: "Announcements from the officer team. Some posts are for members only and never appear on the public website. Every new post is emailed to you as well.",
    navHref: "/portal/news",
  },
  {
    title: "Tournaments",
    body: "See what's coming up and register for an event. Registering tells officers you want in — they confirm your entry and handle Tabroom. Track your entries under My registrations.",
    navHref: "/portal/tournaments",
  },
  {
    title: "Forms",
    body: "Permission slips, t-shirt sizes, weekend availability. When a form needs your answer a number appears next to Forms in the sidebar, and you can change your answers until it closes.",
    navHref: "/portal/forms",
  },
  {
    title: "Dues and orders",
    body: "What you owe for tournament fees and team orders. You pay on MySchoolBucks — this site never asks for card details — and an officer ticks each item off once it's paid.",
    navHref: "/portal/dues",
  },
  {
    title: "Resources",
    body: "Evidence, case files, and guides kept up to date by the officers. That's the tour. The checklist on your dashboard will walk you through the rest.",
    navHref: "/portal/resources",
  },
];

/**
 * First-visit walkthrough of the member portal.
 *
 * A native modal <dialog> opened with showModal(): the browser traps focus,
 * makes the page behind inert, and turns Escape into a close request, so none
 * of that is hand-rolled here. Every way out — Skip, Escape, Finish — ends in
 * the dialog's `close` event, and that single handler is what records the tour
 * as done, so there is exactly one place it can happen.
 *
 * On desktop the backdrop stops at the sidebar's edge (see .c-tour in
 * globals.css) and the item each step describes is outlined there, so the
 * member sees where the feature actually lives. On small screens the sidebar
 * sits behind the menu button, and the step says so instead.
 */
export function OnboardingTour({ firstName, profileComplete }: { firstName: string; profileComplete: boolean }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const recorded = useRef(false);
  const destination = useRef<string | null>(null);
  const [step, setStep] = useState(0);
  // A closed <dialog> stays mounted until the server stops rendering the tour,
  // so closing must switch the sidebar highlight off explicitly.
  const [closed, setClosed] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Outline the sidebar item this step is about. Only the desktop sidebar is
  // targeted; the mobile drawer is closed while the tour runs.
  useEffect(() => {
    if (closed || !current.navHref) return;
    const item = document.querySelector<HTMLElement>(`[data-app-sidebar] [data-nav-href="${current.navHref}"]`);
    if (!item) return;
    item.setAttribute("data-tour-highlight", "");
    item.scrollIntoView({ block: "nearest" });
    return () => item.removeAttribute("data-tour-highlight");
  }, [current.navHref, closed]);

  function handleClose() {
    setClosed(true);

    // Failing to record only means the tour shows again next visit, which is
    // harmless — so an error is swallowed. But the refresh must wait for the
    // write: refreshing first re-renders the dashboard from the database
    // before the "done" lands, and the checklist would still say "to do".
    const recording = recorded.current
      ? Promise.resolve()
      : ((recorded.current = true), api.post("/api/onboarding", { action: "tour-completed" }).catch(() => {}));

    void recording.then(() => {
      // Drop ?tour=1 so a refresh does not reopen it, and re-render the
      // dashboard so "Learn your way around" ticks itself.
      router.replace(destination.current ?? "/portal", { scroll: false });
      router.refresh();
    });
  }

  function finish() {
    destination.current = profileComplete ? null : "/portal/profile";
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      className="c-tour m-auto w-[min(36rem,calc(100vw-2rem))] border-2 border-ink bg-paper-raised p-0 text-ink shadow-[10px_10px_0_0_var(--color-signal)]"
    >
      <div className="border-b-4 border-signal bg-navy-900 px-7 py-5">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-paper">
          {step === 0 ? `Welcome${firstName ? `, ${firstName}` : ""}` : "Getting around"}
          <span className="float-right text-paper/60">
            {step + 1} of {STEPS.length}
          </span>
        </p>
      </div>

      <div className="px-7 py-7">
        {/* Announces each new step to screen readers while keyboard focus
            stays on the Next button, so repeated presses keep working. */}
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {STEPS.length}: {current.title}
        </p>

        <h2 id="tour-title" className="t-h3 text-ink">
          {current.title}
        </h2>
        <p id="tour-body" className="mt-4 text-base leading-relaxed text-ink/80">
          {current.body}
        </p>
        {current.navHref ? (
          <p className="mt-4 text-sm text-ink/55 lg:hidden">Find it in the ☰ menu at the top of the page.</p>
        ) : null}

        <ol className="mt-7 flex gap-2" aria-hidden="true">
          {STEPS.map((s, index) => (
            <li key={s.title} className={`h-2 flex-1 ${index <= step ? "bg-signal" : "bg-rule-faint"}`} />
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-rule-faint px-7 py-5">
        {isLast ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-[44px] px-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink/60 underline-offset-4 hover:text-ink hover:underline"
          >
            Skip tour
          </button>
        )}
        <div className="flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-[48px] border-2 border-ink px-5 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink hover:bg-paper-sunk"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            autoFocus
            onClick={() => (isLast ? finish() : setStep(step + 1))}
            className="min-h-[48px] border-2 border-ink bg-signal px-6 font-display text-xs font-bold uppercase tracking-[0.14em] text-paper transition-[transform,box-shadow] duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_0_var(--color-ink)] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
          >
            {isLast ? (profileComplete ? "Done" : "Finish your profile →") : step === 0 ? "Show me around →" : "Next →"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
