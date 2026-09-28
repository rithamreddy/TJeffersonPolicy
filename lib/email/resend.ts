/**
 * Outbound email through Resend's HTTP API.
 *
 * HTTP rather than SMTP because this app runs on Cloudflare Workers, which
 * cannot open raw SMTP connections. Everything here is a plain `fetch`.
 *
 * Messages go out through the batch endpoint, up to 100 per request, and each
 * recipient gets their own message — never one email with a long To or Bcc
 * list, which would expose every family's address to every other family the
 * moment someone hits Reply All.
 */
import { env } from "../env";

const BATCH_ENDPOINT = "https://api.resend.com/emails/batch";
const BATCH_LIMIT = 100;

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  sent: number;
  failed: number;
  /** One line per failed batch, safe to show an officer. */
  errors: string[];
}

export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

export async function sendEmails(emails: readonly OutgoingEmail[], idempotencyPrefix: string): Promise<SendResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, failed: emails.length, errors: ["RESEND_API_KEY is not set."] };

  const result: SendResult = { sent: 0, failed: 0, errors: [] };

  for (let start = 0, batch = 0; start < emails.length; start += BATCH_LIMIT, batch += 1) {
    const chunk = emails.slice(start, start + BATCH_LIMIT);
    // Resend's default limit is two requests a second.
    if (batch > 0) await pause(600);

    const outcome = await postBatch(apiKey, chunk, `${idempotencyPrefix}-${batch}`);
    if (outcome.ok) {
      result.sent += chunk.length;
    } else {
      result.failed += chunk.length;
      result.errors.push(outcome.message);
    }
  }

  return result;
}

async function postBatch(
  apiKey: string,
  chunk: readonly OutgoingEmail[],
  idempotencyKey: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const body = JSON.stringify(
    chunk.map((email) => ({
      from: env.EMAIL_FROM,
      reply_to: env.EMAIL_REPLY_TO,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    })),
  );

  // One retry for rate limiting or a transient server error. The same
  // idempotency key is reused, so if the first attempt actually went through
  // and only the response was lost, Resend does not send the batch twice.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(BATCH_ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body,
      });
    } catch {
      if (attempt === 0) {
        await pause(1_000);
        continue;
      }
      return { ok: false, message: "Could not reach Resend." };
    }

    if (response.ok) return { ok: true };

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt === 0) {
      await pause(1_000);
      continue;
    }

    return { ok: false, message: await describeFailure(response) };
  }

  return { ok: false, message: "Resend did not accept the request." };
}

async function describeFailure(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload?.message) return `Resend ${response.status}: ${payload.message}`;
  } catch {
    // Fall through to the bare status.
  }
  return `Resend responded ${response.status}.`;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
