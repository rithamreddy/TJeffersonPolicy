/**
 * A member submits or edits their own answer to a form.
 *
 * The response is always written against the signed-in member — the user id
 * never comes from the request — and validated against the stored questions
 * in lib/services/forms.ts.
 */
import { requireUserApi } from "@/lib/auth/guards";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { submitFormResponse } from "@/lib/services/forms";
import { formResponseSchema, idSchema } from "@/lib/validation/schemas";

export const PUT = withApi(async (request, context) => {
  const user = await requireUserApi();
  const id = idSchema.parse((await readParams(context)).id);
  const { answers } = await readJson(request, formResponseSchema);

  const response = await submitFormResponse(id, user.id, answers);

  return jsonOk({ id: response.id, updatedAt: response.updatedAt.toISOString() });
});
