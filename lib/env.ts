/**
 * Environment configuration.
 *
 * Every secret and deployment-specific value enters the application here and
 * nowhere else. Validation runs once at module load so a misconfigured deploy
 * fails immediately and loudly rather than at the first request.
 */
import { z } from "zod";

/**
 * Environment variables arrive as strings. `.default()` interacts awkwardly
 * with transforms, so the fallback is applied inside the transform instead.
 */
const booleanish = (fallback: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return fallback;
      return typeof v === "boolean" ? v : ["1", "true", "yes", "on"].includes(v.toLowerCase());
    });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /**
   * Public origin of the deployment, e.g. https://tjpolicy.org. Used to build
   * the OAuth redirect URI and to validate the Origin header on mutations.
   */
  APP_URL: z.url().default("http://localhost:3000"),

  /**
   * 32+ byte random string. Used to derive keys for signing the CSRF token.
   * Generate with: openssl rand -base64 48
   */
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),

  /**
   * "ion" uses the real TJ Intranet OAuth 2.0 service.
   * "dev" enables a local-only account picker and is rejected in production.
   */
  AUTH_PROVIDER: z.enum(["ion", "dev"]).default("dev"),

  ION_CLIENT_ID: z.string().optional(),
  ION_CLIENT_SECRET: z.string().optional(),
  ION_BASE_URL: z.url().default("https://ion.tjhsst.edu"),
  /** Ion runs django-oauth-toolkit, which accepts (and may require) PKCE. */
  ION_USE_PKCE: booleanish(true),

  /**
   * Ion usernames that always hold the OFFICER role, comma separated.
   *
   * This is a standing list, not a one-time bootstrap: it is re-applied on
   * every sign-in, so adding a username here grants officer access the next
   * time that person signs in, whether or not they already have an account.
   * It only ever promotes — it never demotes anyone the dashboard has made an
   * officer.
   *
   * Because it wins over the dashboard, the dashboard refuses to demote
   * someone on this list rather than letting the change silently revert at
   * their next sign-in. Remove them here first.
   */
  OFFICER_USERNAMES: z.string().default(""),

  /** @deprecated Former name of OFFICER_USERNAMES; still read if set. */
  BOOTSTRAP_OFFICER_USERNAMES: z.string().default(""),

  /** Officer-configurable at runtime; these are only the initial defaults. */
  MYSCHOOLBUCKS_URL: z.url().default("https://www.myschoolbucks.com/"),

  /** Read-only Tabroom metadata import. Disable to turn the feature off. */
  TABROOM_IMPORT_ENABLED: booleanish(true),

  /**
   * Resend API key for news emails. Optional: when unset, publishing still
   * works and the editor says plainly that no email was sent. On Cloudflare,
   * set it with `wrangler secret put RESEND_API_KEY` — never in wrangler.jsonc.
   */
  RESEND_API_KEY: z.string().optional(),
  /** Sender. The domain must be verified in Resend, or every send is rejected. */
  EMAIL_FROM: z.string().default("TJ Policy Debate <news@tjpolicy.org>"),
  /** Where replies go. Defaults to the club inbox. */
  EMAIL_REPLY_TO: z.string().default("tjhsstpolicy1@gmail.com"),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${detail}\n\nSee .env.example for the full list.`);
  }

  const env = parsed.data;

  /**
   * `next build` runs with NODE_ENV=production, but building is not serving:
   * a developer compiling locally has no reason to hold the production Ion
   * secrets. The deployment-time assertions below are therefore skipped during
   * the build and re-checked when the server actually starts handling
   * requests. They are not the only line of defence — authProvider() refuses a
   * non-production-safe provider at every call, and DevAuthProvider's
   * constructor refuses to instantiate under NODE_ENV=production.
   */
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (env.NODE_ENV === "production" && !isBuildPhase) {
    if (env.AUTH_PROVIDER === "dev") {
      throw new Error(
        "AUTH_PROVIDER=dev is refused in production. Set AUTH_PROVIDER=ion and configure ION_CLIENT_ID / ION_CLIENT_SECRET.",
      );
    }

    if (!env.APP_URL.startsWith("https://")) {
      throw new Error("APP_URL must be an https:// origin in production so session cookies can be marked Secure.");
    }
  }

  if (env.AUTH_PROVIDER === "ion" && (!env.ION_CLIENT_ID || !env.ION_CLIENT_SECRET)) {
    throw new Error("AUTH_PROVIDER=ion requires both ION_CLIENT_ID and ION_CLIENT_SECRET.");
  }

  return env;
}

export const env = load();

export const isProduction = env.NODE_ENV === "production";

/**
 * Ion usernames that always hold the OFFICER role, lower-cased for comparison
 * against the normalised `providerId` that lib/auth/ion.ts produces.
 */
export function parseOfficerList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export const listedOfficerUsernames = new Set(
  parseOfficerList([env.OFFICER_USERNAMES, env.BOOTSTRAP_OFFICER_USERNAMES].join(",")),
);

/** True when this username's officer role comes from configuration. */
export function isListedOfficer(ionUsername: string): boolean {
  return listedOfficerUsernames.has(ionUsername.trim().toLowerCase());
}
