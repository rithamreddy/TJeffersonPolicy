import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { deleteForm, updateForm } from "@/lib/services/forms";
import { formSchema, idSchema } from "@/lib/validation/schemas";

export const PUT = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);
  const input = await readJson(request, formSchema);

  const form = await updateForm(id, input);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.FORM_SAVED,
    targetType: "form",
    targetId: id,
    summary: `${actor.displayName} updated the form "${form.title}" (${form.status.toLowerCase()})`,
    metadata: { status: form.status, questions: input.fields.length },
  });

  return jsonOk({ id: form.id, status: form.status });
});

export const DELETE = withApi(async (_request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);

  const existing = await prisma.form.findUnique({
    where: { id },
    select: { title: true, _count: { select: { responses: true } } },
  });
  if (!existing) throw new HttpError(404, "That form no longer exists.", "not_found");

  await deleteForm(id);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.FORM_DELETED,
    targetType: "form",
    targetId: id,
    summary: `${actor.displayName} deleted the form "${existing.title}" and its ${existing._count.responses} response(s)`,
    metadata: { responses: existing._count.responses },
  });

  return jsonOk({ deleted: true });
});
