/**
 * Self-service profile edit.
 *
 * Scoped to the signed-in user's own record and to a fixed set of fields —
 * role, status, dues, and NSDA verification are not editable here at any price.
 */
import { requireUserApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { updateOwnProfile } from "@/lib/services/users";
import { updateProfileSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request) => {
  const user = await requireUserApi();
  const input = await readJson(request, updateProfileSchema);

  const updated = await updateOwnProfile(user.id, input);

  return jsonOk({
    contactEmail: updated.contactEmail,
    tjEmail: updated.tjEmail,
    phoneNumber: updated.phoneNumber,
    parentEmail: updated.parentEmail,
    parentPhone: updated.parentPhone,
    partnerName: updated.partnerName,
    nsdaMemberId: updated.nsdaMemberId,
  });
});
