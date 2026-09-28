/**
 * Administrative audit trail.
 *
 * Append-only: rows are written and read, never updated or deleted from the
 * application. The actor's name is denormalised so history stays readable
 * after an account is removed.
 */
import type { User } from "@prisma/client";
import { prisma } from "../db";

export const AUDIT_ACTIONS = {
  MEMBER_UPDATED: "member.updated",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  MEMBER_DELETED: "member.deleted",
  TOURNAMENT_CREATED: "tournament.created",
  TOURNAMENT_UPDATED: "tournament.updated",
  TOURNAMENT_ARCHIVED: "tournament.archived",
  TOURNAMENT_DELETED: "tournament.deleted",
  TOURNAMENT_IMPORTED: "tournament.imported_from_tabroom",
  REGISTRATION_CREATED: "registration.created",
  REGISTRATION_UPDATED: "registration.updated",
  REGISTRATION_WITHDRAWN: "registration.withdrawn",
  DUES_UPDATED: "dues.updated",
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_ITEM_SAVED: "order_item.saved",
  ORDER_ITEM_ARCHIVED: "order_item.archived",
  ORDER_ITEM_DELETED: "order_item.deleted",
  NEWS_SAVED: "news.saved",
  NEWS_DELETED: "news.deleted",
  NEWS_EMAILED: "news.emailed",
  FORM_SAVED: "form.saved",
  FORM_DELETED: "form.deleted",
  RESOURCE_SAVED: "resource.saved",
  RESOURCE_DELETED: "resource.deleted",
  OFFICER_SAVED: "officer.saved",
  OFFICER_REMOVED: "officer.removed",
  SETTINGS_UPDATED: "settings.updated",
  SIGN_IN: "auth.sign_in",
  SIGN_OUT: "auth.sign_out",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export async function recordAudit(input: {
  actor: Pick<User, "id" | "displayName"> | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actor?.id ?? null,
        actorLabel: input.actor?.displayName ?? "system",
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        summary: input.summary.slice(0, 500),
        metadata: JSON.stringify(input.metadata ?? {}).slice(0, 4_000),
      },
    });
  } catch (error) {
    // Auditing must never break the action it is recording, but a silent
    // failure would be worse than a noisy one.
    console.error("[audit] failed to write entry", { action: input.action, error });
  }
}

export async function listAuditLog(options: { take?: number; skip?: number; action?: string } = {}) {
  const { take = 50, skip = 0, action } = options;
  const where = action ? { action } : {};
  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    prisma.auditLog.count({ where }),
  ]);
  return { entries, total };
}

/** Distinct action names present in the log, for the filter dropdown. */
export async function auditActionFacets(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } });
  return rows.map((r) => r.action);
}
