import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { deleteNewsPost, getNewsPost, saveNewsPost } from "@/lib/services/news";
import { describeNewsEmailOutcome, emailPostIfDue } from "@/lib/services/news-email";
import { idSchema, newsPostSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);
  const input = await readJson(request, newsPostSchema);

  const existing = await getNewsPost(id);
  if (!existing) throw new HttpError(404, "That post no longer exists.", "not_found");

  const post = await saveNewsPost({ id, ...input, authorId: existing.authorId ?? actor.id });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.NEWS_SAVED,
    targetType: "news",
    targetId: id,
    summary: `${actor.displayName} updated the post "${post.title}" (${post.status.toLowerCase()})`,
    metadata: { status: post.status, previousStatus: existing.status, visibility: post.visibility },
  });

  // Only a first publish sends: emailPostIfDue is a no-op once emailedAt is
  // set, so editing or re-publishing an already-emailed post sends nothing.
  const email = post.status === "PUBLISHED" && !post.emailedAt ? await emailPostIfDue(post.id, actor) : null;

  return jsonOk({
    id: post.id,
    slug: post.slug,
    status: post.status,
    email: email ? describeNewsEmailOutcome(email) : null,
  });
});

export const DELETE = withApi(async (_request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);

  const existing = await getNewsPost(id);
  if (!existing) throw new HttpError(404, "That post no longer exists.", "not_found");

  await deleteNewsPost(id);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.NEWS_DELETED,
    targetType: "news",
    targetId: id,
    summary: `${actor.displayName} deleted the post "${existing.title}"`,
  });

  return jsonOk({ deleted: true });
});
