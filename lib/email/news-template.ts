/**
 * The email a member (and their parent) receives when a post is published.
 *
 * Pure: no database, no network. Covered by tests/news-email.test.ts.
 *
 * The body is the post itself, run through the same restricted Markdown
 * renderer the website uses — it escapes everything first and re-introduces
 * only a fixed set of tags — so an email cannot carry markup the site itself
 * would refuse. The whole message is included rather than a teaser, because a
 * parent receiving a members-only post has no way to sign in and read it.
 */
import { CLUB } from "../content/club";
import { renderMarkdown } from "../utils/markdown";

export interface NewsEmailPost {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  visibility: string;
}

export interface NewsEmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface RecipientSource {
  contactEmail: string | null;
  tjEmail: string | null;
  parentEmail: string | null;
}

/**
 * Who a post goes to: each member's personal address and their parent's.
 *
 * A member with no personal address falls back to their school address, so
 * they are not silently left out while their parent still hears the news.
 * Addresses are de-duplicated case-insensitively — siblings share parents, and
 * some members list a parent's address as their own.
 */
export function newsRecipients(members: readonly RecipientSource[]): string[] {
  const seen = new Map<string, string>();
  const add = (address: string | null) => {
    const trimmed = address?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) seen.set(trimmed.toLowerCase(), trimmed);
  };

  for (const member of members) {
    add(member.contactEmail?.trim() ? member.contactEmail : member.tjEmail);
    add(member.parentEmail);
  }
  return [...seen.values()];
}

export function newsPostUrl(post: Pick<NewsEmailPost, "slug" | "visibility">, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return post.visibility === "MEMBERS" ? `${base}/portal/news/${post.slug}` : `${base}/news/${post.slug}`;
}

export function buildNewsEmail(post: NewsEmailPost, origin: string): NewsEmailContent {
  const base = origin.replace(/\/$/, "");
  const url = newsPostUrl(post, base);
  const membersOnly = post.visibility === "MEMBERS";

  // The site renderer allows root-relative links ("/join"); in an inbox those
  // point nowhere, so make them absolute.
  const bodyHtml = renderMarkdown(post.body).replace(/href="\//g, `href="${base}/`);

  const linkLine = membersOnly
    ? "This post is for team members and is not on the public website. Members can also read it on the team portal:"
    : "Read it on the website:";

  const footer =
    `You are receiving this because you, or your student, are a member of ${CLUB.shortName} at ` +
    `${CLUB.school}. Reply to this email to reach the officer team.`;

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(post.title)}</title></head>
<body style="margin:0;padding:0;background:#f1eee4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1eee4;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:2px solid #0d1735;">
<tr><td style="background:#0d1735;padding:20px 28px;border-bottom:6px solid #9e1b12;">
<p style="margin:0;font:700 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#f1eee4;">${escape(CLUB.shortName)}${membersOnly ? " · Members only" : ""}</p>
</td></tr>
<tr><td style="padding:28px;font:16px/1.6 Georgia,'Times New Roman',serif;color:#0c1020;">
<h1 style="margin:0 0 12px;font:800 26px/1.15 Arial,Helvetica,sans-serif;color:#0c1020;">${escape(post.title)}</h1>
<p style="margin:0 0 24px;color:#40465c;">${escape(post.excerpt)}</p>
${bodyHtml}
<p style="margin:32px 0 0;padding-top:20px;border-top:2px solid #cdc6b4;font:14px/1.5 Arial,Helvetica,sans-serif;color:#40465c;">${escape(linkLine)}<br><a href="${escape(url)}" style="color:#1b3a93;font-weight:700;">${escape(url)}</a></p>
</td></tr>
<tr><td style="padding:18px 28px;background:#e7e2d4;font:12px/1.5 Arial,Helvetica,sans-serif;color:#40465c;">${escape(footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  // Markdown is already written to be readable as plain text, and unlike
  // markdownToText it keeps paragraph breaks.
  const text = [
    post.title,
    "",
    post.excerpt,
    "",
    post.body.trim(),
    "",
    linkLine,
    url,
    "",
    "—",
    footer,
  ].join("\n");

  return { subject: post.title, html, text };
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
