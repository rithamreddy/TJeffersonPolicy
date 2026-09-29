import { describe, expect, it } from "vitest";
import { buildChecklist, checklistVisible } from "@/lib/services/onboarding";

const brandNew = { profileMissing: 5, tourCompleted: false, unansweredForms: 2, registrations: 0 };
const finished = { profileMissing: 0, tourCompleted: true, unansweredForms: 0, registrations: 1 };

describe("buildChecklist", () => {
  it("starts a brand-new member with every task open", () => {
    const tasks = buildChecklist(brandNew);
    expect(tasks.map((task) => task.key)).toEqual(["profile", "tour", "forms", "tournament"]);
    expect(tasks.every((task) => !task.done)).toBe(true);
  });

  it("ticks each task from the underlying facts, not from clicks", () => {
    const tasks = buildChecklist({ ...brandNew, profileMissing: 0, registrations: 3 });
    const done = Object.fromEntries(tasks.map((task) => [task.key, task.done]));
    expect(done).toEqual({ profile: true, tour: false, forms: false, tournament: true });
  });

  it("counts forms that are waiting", () => {
    const forms = buildChecklist({ ...brandNew, unansweredForms: 1 }).find((task) => task.key === "forms")!;
    expect(forms.detail).toMatch(/1 form needs your answer/);
  });

  it("treats having no open forms as done", () => {
    expect(buildChecklist({ ...brandNew, unansweredForms: 0 }).find((task) => task.key === "forms")!.done).toBe(true);
  });

  it("points the tour task at a replay of the tour", () => {
    expect(buildChecklist(brandNew).find((task) => task.key === "tour")!.href).toBe("/portal?tour=1");
  });
});

describe("checklistVisible", () => {
  it("shows while anything is left and it has not been hidden", () => {
    expect(checklistVisible(buildChecklist(brandNew), false)).toBe(true);
  });

  it("disappears by itself once everything is done", () => {
    expect(checklistVisible(buildChecklist(finished), false)).toBe(false);
  });

  it("stays hidden once the member hides it, even with tasks left", () => {
    expect(checklistVisible(buildChecklist(brandNew), true)).toBe(false);
  });
});
