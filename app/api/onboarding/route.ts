/**
 * Records the signed-in member's own onboarding progress. Only ever touches
 * the caller's own row — no user id is read from the request.
 */
import { z } from "zod";
import { requireUserApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { dismissChecklist, markTourCompleted } from "@/lib/services/onboarding";

const onboardingSchema = z.object({ action: z.enum(["tour-completed", "checklist-dismissed"]) });

export const POST = withApi(async (request) => {
  const user = await requireUserApi();
  const { action } = await readJson(request, onboardingSchema);

  if (action === "tour-completed") await markTourCompleted(user.id);
  else await dismissChecklist(user.id);

  return jsonOk({ ok: true });
});
