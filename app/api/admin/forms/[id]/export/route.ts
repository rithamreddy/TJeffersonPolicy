/**
 * CSV of every response to one form, one row per member.
 *
 * GET with no body so it can be a plain download link. Officer-only and
 * no-store, so it does not linger in a shared cache. Import into Google Sheets
 * with File → Import → Upload. Every cell is guarded against formula
 * injection — see lib/csv.ts.
 */
import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/http/api";
import { formResponsesToCsv, getFormForOfficer } from "@/lib/services/forms";
import { idSchema } from "@/lib/validation/schemas";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireOfficerApi();
    const id = idSchema.parse((await context.params).id);

    const form = await getFormForOfficer(id);
    if (!form) throw new HttpError(404, "That form no longer exists.", "not_found");

    const csv = formResponsesToCsv(form);
    const stamp = new Date().toISOString().slice(0, 10);
    const name = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "form";

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${name}-responses-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
