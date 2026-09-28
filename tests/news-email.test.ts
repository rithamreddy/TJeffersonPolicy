import { describe, expect, it } from "vitest";
import { buildNewsEmail, newsPostUrl, newsRecipients } from "@/lib/email/news-template";

const origin = "https://tjpolicy.org";

describe("newsRecipients", () => {
  it("sends to each member's personal address and their parent's", () => {
    expect(
      newsRecipients([{ contactEmail: "kid@gmail.com", tjEmail: "kid@tjhsst.edu", parentEmail: "mom@gmail.com" }]),
    ).toEqual(["kid@gmail.com", "mom@gmail.com"]);
  });

  it("falls back to the school address when a member gave no personal one", () => {
    expect(newsRecipients([{ contactEmail: null, tjEmail: "kid@tjhsst.edu", parentEmail: null }])).toEqual([
      "kid@tjhsst.edu",
    ]);
  });

  it("de-duplicates case-insensitively, so siblings' shared parent gets one copy", () => {
    const result = newsRecipients([
      { contactEmail: "a@x.com", tjEmail: null, parentEmail: "Parent@X.com" },
      { contactEmail: "b@x.com", tjEmail: null, parentEmail: "parent@x.com" },
    ]);
    expect(result).toEqual(["a@x.com", "Parent@X.com", "b@x.com"]);
  });

  it("skips members with no address at all", () => {
    expect(newsRecipients([{ contactEmail: "", tjEmail: null, parentEmail: "  " }])).toEqual([]);
  });
});

describe("buildNewsEmail", () => {
  const post = {
    title: "Results from <Harvard>",
    slug: "harvard-results",
    excerpt: "We broke! & more",
    body: "Read the [recap](/news/recap).\n\n<script>alert(1)</script>",
    visibility: "PUBLIC",
  };

  it("escapes the title and excerpt, and never passes raw HTML through", () => {
    const { html } = buildNewsEmail(post, origin);
    expect(html).toContain("Results from &lt;Harvard&gt;");
    expect(html).toContain("We broke! &amp; more");
    expect(html).not.toContain("<script>");
  });

  it("makes root-relative links absolute so they work from an inbox", () => {
    const { html } = buildNewsEmail(post, origin);
    expect(html).toContain('href="https://tjpolicy.org/news/recap"');
  });

  it("links public posts to the website and members-only posts to the portal", () => {
    expect(newsPostUrl(post, origin)).toBe("https://tjpolicy.org/news/harvard-results");
    expect(newsPostUrl({ ...post, visibility: "MEMBERS" }, origin)).toBe(
      "https://tjpolicy.org/portal/news/harvard-results",
    );
  });

  it("includes the full post in the plain-text part, paragraph breaks intact", () => {
    const { text, subject } = buildNewsEmail({ ...post, body: "First.\n\nSecond." }, origin);
    expect(subject).toBe(post.title);
    expect(text).toContain("First.\n\nSecond.");
  });
});
