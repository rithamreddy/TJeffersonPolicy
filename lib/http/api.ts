/**
 * Route-handler plumbing.
 *
 * `withApi` is the single entry point for every mutating endpoint. It applies
 * origin checking, CSRF verification, rate limiting, body validation, and a
 * uniform error envelope, so an individual handler contains only its own logic
 * and cannot forget a control.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError } from "../auth/guards";
import { env } from "../env";
import { assertCsrfToken, assertSameOrigin } from "./csrf";
import { clientKey, consume, RATE_LIMITS, type RateLimitRule } from "./rate-limit";

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export function jsonError(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message, fields } }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

interface WithApiOptions {
  /** Skip CSRF/origin checks (only for endpoints that are safe by nature). */
  readonly public?: boolean;
  readonly rateLimit?: RateLimitRule | null;
  readonly rateLimitScope?: string;
}

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

export function withApi(handler: Handler, options: WithApiOptions = {}): Handler {
  return async (request, context) => {
    try {
      if (!options.public) {
        assertSameOrigin(request);
        assertCsrfToken(request);
      }

      const rule = options.rateLimit === undefined ? RATE_LIMITS.write : options.rateLimit;
      if (rule) consume(clientKey(request, options.rateLimitScope ?? new URL(request.url).pathname), rule);

      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return jsonError(error.status, error.code, error.message, error.fields);
  }

  if (error instanceof z.ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    return jsonError(422, "invalid_input", "Some fields need attention.", fields);
  }

  // Never leak internals to the client; the detail stays in the server log.
  console.error("[api] unhandled error", error);
  return jsonError(
    500,
    "server_error",
    env.NODE_ENV === "development" && error instanceof Error ? error.message : "Something went wrong on our end.",
  );
}

/** Parse and validate a JSON body, rejecting oversized payloads. */
export async function readJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  const raw = await request.text();
  if (raw.length > 200_000) throw new HttpError(413, "That request is too large.", "payload_too_large");

  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new HttpError(400, "Request body was not valid JSON.", "bad_json");
  }

  return schema.parse(parsed);
}

/** Route params are async in Next's App Router. */
export async function readParams(context: { params: Promise<Record<string, string>> }): Promise<Record<string, string>> {
  return context.params;
}
