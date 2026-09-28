/**
 * Emailing a published post to every active member and their parent.
 *
 * A post is emailed exactly once. `emailedAt` is claimed with a conditional
 * update *before* anything is sent, so two officers publishing at the same
 * moment — or one double-clicking — cannot both trigger a send: only the
 * update that finds `emailedAt` still null proceeds.
 *
 * Failure handling is deliberately asymmetric:
 *  - Nothing delivered → the claim is released and the error recorded, so an
 *    officer can press "Send email" again.
 *  - Some batches delivered → the claim is kept. Retrying would re-send to the
 *    families who already got it, and a duplicate is worse than a gap an
 *    officer can see and handle by hand.
 */
import { prisma } from "../db";
import { env } from "../env";
import { buildNewsEmail, newsRecipients } from "../email/news-template";
import { isEmailConfigured, sendEmails } from "../email/resend";
import { AUDIT_ACTIONS, recordAudit } from "./audit";

export type NewsEmailOutcome =
  | { status: "sent"; recipients: number }
  | { status: "partial"; sent: number; failed: number; error: string }
  | { status: "failed"; error: string }
  | { status: "already_sent" }
  | { status: "not_published" }
  | { status: "not_configured" }
  | { status: "no_recipients" };

export async function emailPublishedPost(postId: string): Promise<NewsEmailOutcome> {
  const post = await prisma.newsPost.findUnique({ where: { id: postId } });
  if (!post || post.status !== "PUBLISHED") return { status: "not_published" };
  if (post.emailedAt) return { status: "already_sent" };

  if (!isEmailConfigured()) {
    await prisma.newsPost.update({
      where: { id: postId },
      data: { emailError: "Email is not set up on this deployment (RESEND_API_KEY is missing), so nothing was sent." },
    });
    return { status: "not_configured" };
  }

  const members = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { contactEmail: true, tjEmail: true, parentEmail: true },
  });
  const recipients = newsRecipients(members);

  if (recipients.length === 0) {
    await prisma.newsPost.update({
      where: { id: postId },
      data: { emailError: "No active member has an email address on file yet, so nothing was sent." },
    });
    return { status: "no_recipients" };
  }

  const claimedAt = new Date();
  const claim = await prisma.newsPost.updateMany({
    where: { id: postId, status: "PUBLISHED", emailedAt: null },
    data: { emailedAt: claimedAt, emailError: null },
  });
  if (claim.count === 0) return { status: "already_sent" };

  const content = buildNewsEmail(post, env.APP_URL);
  const result = await sendEmails(
    recipients.map((to) => ({ to, ...content })),
    `news-${post.id}-${claimedAt.getTime()}`,
  );

  if (result.failed === 0) {
    await prisma.newsPost.update({
      where: { id: postId },
      data: { emailRecipientCount: result.sent, emailError: null },
    });
    return { status: "sent", recipients: result.sent };
  }

  const error = result.errors.join(" ");

  if (result.sent === 0) {
    await prisma.newsPost.update({
      where: { id: postId },
      data: { emailedAt: null, emailRecipientCount: 0, emailError: `Not sent. ${error}` },
    });
    return { status: "failed", error };
  }

  await prisma.newsPost.update({
    where: { id: postId },
    data: {
      emailRecipientCount: result.sent,
      emailError: `Sent to ${result.sent} of ${recipients.length} addresses; ${result.failed} failed. ${error}`,
    },
  });
  return { status: "partial", sent: result.sent, failed: result.failed, error };
}

/**
 * Send (if due) and write the audit entry. The single entry point the routes
 * use, so creating, editing, and the manual "Send email" button all behave
 * identically.
 */
export async function emailPostIfDue(
  postId: string,
  actor: { id: string; displayName: string },
): Promise<NewsEmailOutcome> {
  const outcome = await emailPublishedPost(postId);

  if (outcome.status === "sent" || outcome.status === "partial" || outcome.status === "failed") {
    await recordAudit({
      actor,
      action: AUDIT_ACTIONS.NEWS_EMAILED,
      targetType: "news",
      targetId: postId,
      summary:
        outcome.status === "sent"
          ? `${actor.displayName} published a post that was emailed to ${outcome.recipients} addresses`
          : `${actor.displayName} published a post whose email ${outcome.status === "partial" ? "partly failed" : "failed"}`,
      metadata: outcome,
    });
  }

  return outcome;
}

/** One line for the editor to show after a save. */
export function describeNewsEmailOutcome(outcome: NewsEmailOutcome): string | null {
  switch (outcome.status) {
    case "sent":
      return `Emailed to ${outcome.recipients} address${outcome.recipients === 1 ? "" : "es"}.`;
    case "partial":
      return `Emailed to ${outcome.sent} addresses, but ${outcome.failed} failed: ${outcome.error}`;
    case "failed":
      return `The email was not sent: ${outcome.error}`;
    case "not_configured":
      return "Published, but email is not set up on this deployment, so nothing was sent.";
    case "no_recipients":
      return "Published, but no active member has an email address on file yet, so nothing was sent.";
    default:
      return null;
  }
}
