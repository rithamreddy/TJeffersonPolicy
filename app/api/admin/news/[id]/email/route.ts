/**
 * Manual send for a published post whose automatic email did not go out —
 * email was not configured yet, nobody had an address on file, or Resend
 * rejected the whole batch.
 *
 * Safe to press twice: emailPublishedPost claims the post before sending, so a
 * post that has already been emailed is reported as such and nothing is sent.
 */
import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readParams, withApi } from "@/lib/http/api";
import { getNewsPost } from "@/lib/services/news";
import { describeNewsEmailOutcome, emailPostIfDue } from "@/lib/services/news-email";
import { idSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (_request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);

  const post = await getNewsPost(id);
  if (!post) throw new HttpError(404, "That post no longer exists.", "not_found");
  if (post.status !== "PUBLISHED") throw new HttpError(409, "Publish the post before emailing it.", "not_published");
  if (post.emailedAt) throw new HttpError(409, "This post has already been emailed.", "already_sent");

  const outcome = await emailPostIfDue(id, actor);
  return jsonOk({ status: outcome.status, message: describeNewsEmailOutcome(outcome) });
});
