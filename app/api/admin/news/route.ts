import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { saveNewsPost } from "@/lib/services/news";
import { describeNewsEmailOutcome, emailPostIfDue } from "@/lib/services/news-email";
import { newsPostSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, newsPostSchema);

  const post = await saveNewsPost({ ...input, authorId: actor.id });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.NEWS_SAVED,
    targetType: "news",
    targetId: post.id,
    summary: `${actor.displayName} created the post "${post.title}" (${post.status.toLowerCase()})`,
    metadata: { status: post.status, visibility: post.visibility },
  });

  // A post can be created already published, so this path sends too.
  const email = post.status === "PUBLISHED" ? await emailPostIfDue(post.id, actor) : null;

  return jsonOk(
    { id: post.id, slug: post.slug, status: post.status, email: email ? describeNewsEmailOutcome(email) : null },
    201,
  );
});
