/**
 * Authorization helpers.
 *
 * Every protected page and every mutating endpoint goes through one of these.
 * Hiding a button in the UI is never the control — these run on the server and
 * are the reason a member cannot reach an officer route by typing its URL.
 */
import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { getSession } from "./session";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = "error",
    /** Per-field messages, keyed like zod issue paths, for the form to show inline. */
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isOfficer(user: Pick<User, "role">): boolean {
  return user.role === "OFFICER";
}

/** For server components: redirects to sign-in, preserving the target page. */
export async function requireUserPage(returnTo: string): Promise<User> {
  const session = await getSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return session.user;
}

/** For server components: 403 page for signed-in members, sign-in otherwise. */
export async function requireOfficerPage(returnTo: string): Promise<User> {
  const session = await getSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  if (!isOfficer(session.user)) redirect("/portal?denied=officer");
  return session.user;
}

/** For route handlers: throws HttpError, converted to JSON by withApi(). */
export async function requireUserApi(): Promise<User> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "You need to sign in to do that.", "unauthenticated");
  return session.user;
}

export async function requireOfficerApi(): Promise<User> {
  const user = await requireUserApi();
  if (!isOfficer(user)) throw new HttpError(403, "This action is restricted to officers.", "forbidden");
  return user;
}

/**
 * Members may only ever act on their own records. Officers may act on any.
 * Used by every endpoint that takes a userId from the request.
 */
export function assertCanActOnUser(actor: User, targetUserId: string): void {
  if (actor.id === targetUserId || isOfficer(actor)) return;
  throw new HttpError(403, "You can only change your own information.", "forbidden");
}
