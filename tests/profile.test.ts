import { describe, expect, it } from "vitest";
import { listInEnglish, missingProfileFields } from "@/lib/services/profile-completion";
import { updateProfileSchema } from "@/lib/validation/schemas";
import { DEBATE_EVENTS } from "@/lib/constants";

const complete = {
  contactEmail: "kid@gmail.com",
  tjEmail: "kid@tjhsst.edu",
  phoneNumber: "703-555-0100",
  parentEmail: "parent@gmail.com",
  parentPhone: "703-555-0199",
  events: JSON.stringify(["POLICY_JV"]),
};

describe("missingProfileFields", () => {
  it("is empty for a complete profile", () => {
    expect(missingProfileFields(complete)).toEqual([]);
  });

  it("names every missing field, treating whitespace as missing", () => {
    const missing = missingProfileFields({ ...complete, parentPhone: "  ", events: "[]" }).map((f) => f.key);
    expect(missing).toEqual(["parentPhone", "events"]);
  });

  it("treats a malformed events column as no events rather than throwing", () => {
    expect(missingProfileFields({ ...complete, events: "not json" }).map((f) => f.key)).toEqual(["events"]);
  });
});

describe("listInEnglish", () => {
  it("reads naturally at every length", () => {
    expect(listInEnglish(["a"])).toBe("a");
    expect(listInEnglish(["a", "b"])).toBe("a and b");
    expect(listInEnglish(["a", "b", "c"])).toBe("a, b, and c");
  });
});

describe("updateProfileSchema", () => {
  it("turns blanks into undefined so the field is cleared", () => {
    const parsed = updateProfileSchema.parse({ contactEmail: "", parentPhone: "  ", events: [] });
    expect(parsed.contactEmail).toBeUndefined();
    expect(parsed.parentPhone).toBeUndefined();
  });

  it("rejects a malformed parent email or phone", () => {
    expect(updateProfileSchema.safeParse({ parentEmail: "not-an-email", events: [] }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ parentPhone: "call me", events: [] }).success).toBe(false);
  });

  it("accepts the new JV event", () => {
    expect(DEBATE_EVENTS.POLICY_JV).toBe("Policy Debate — JV");
    expect(updateProfileSchema.parse({ events: ["POLICY_JV"] }).events).toEqual(["POLICY_JV"]);
  });
});
