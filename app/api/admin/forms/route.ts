import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { createForm } from "@/lib/services/forms";
import { formSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, formSchema);

  const form = await createForm(input, actor.id);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.FORM_SAVED,
    targetType: "form",
    targetId: form.id,
    summary: `${actor.displayName} created the form "${form.title}" (${form.status.toLowerCase()})`,
    metadata: { status: form.status, questions: input.fields.length },
  });

  return jsonOk({ id: form.id }, 201);
});
