# Deployment

The application is a single Next.js deployable plus a database. It has no
background workers, no queue, and no object storage.

## Environment variables

| Variable                      | Required            | Notes                                                                 |
| ----------------------------- | ------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`                | yes                 | SQLite file path or a libSQL URL. See below.                          |
| `APP_URL`                     | yes                 | Public origin, e.g. `https://tjpolicy.org`. **Must be https in production.** |
| `SESSION_SECRET`              | yes                 | 32+ random characters. `openssl rand -base64 48`                      |
| `AUTH_PROVIDER`               | yes                 | `ion` in production. `dev` is refused there.                          |
| `ION_CLIENT_ID`               | when `AUTH_PROVIDER=ion` | From the Ion application registration.                           |
| `ION_CLIENT_SECRET`           | when `AUTH_PROVIDER=ion` | Keep out of the repository.                                      |
| `ION_BASE_URL`                | no                  | Defaults to `https://ion.tjhsst.edu`.                                 |
| `ION_USE_PKCE`                | no                  | Defaults to `true`.                                                   |
| `OFFICER_USERNAMES`           | recommended         | Comma-separated Ion usernames that always hold the officer role. Re-applied on every sign-in. |
| `MYSCHOOLBUCKS_URL`           | no                  | Initial default only; officers edit it in the dashboard afterwards.   |
| `TABROOM_IMPORT_ENABLED`      | no                  | `false` switches off the read-only Tabroom lookup.                    |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`| no                  | Domain as registered in Plausible, e.g. `tjpolicy.org`. Unset ⇒ no analytics script is loaded at all, which keeps local and preview traffic out of the numbers. |
| `NEXT_PUBLIC_PLAUSIBLE_SRC`   | no                  | Only for a self-hosted Plausible/Umami. Its origin is added to the CSP automatically by `proxy.ts`. |
| `RESEND_API_KEY`              | for news emails     | **Secret** — `npx wrangler secret put RESEND_API_KEY`, never a var in `wrangler.jsonc`. Unset ⇒ posts publish but are not emailed. |
| `EMAIL_FROM`                  | no                  | Defaults to `TJ Policy Debate <news@tjpolicy.org>`. The domain must be verified in Resend. |
| `EMAIL_REPLY_TO`              | no                  | Defaults to the club inbox.                                           |

`lib/env.ts` validates all of these at startup and fails with a specific
message, so a misconfigured deploy stops immediately instead of half-working.
The production-only assertions are skipped during `next build` — building is not
serving, and a developer compiling locally has no reason to hold the production
Ion secrets.

## News email (Resend)

Publishing a post emails it — once, on first publish — to every active member's
personal address (school address if they gave none) and their parent's
address. To turn it on:

1. Create a Resend account and add the domain `tjpolicy.org`. Resend shows a
   few DNS records (SPF, DKIM); add them in the Cloudflare DNS dashboard and wait
   for Resend to mark the domain verified. Until then every send is rejected.
2. Create an API key with **sending access only**, then
   `npx wrangler secret put RESEND_API_KEY` and paste it.
3. Publish a test post. The editor reports how many addresses it reached; a
   failure is shown there with the reason, and **Send email now** retries.

**Volume.** Every member plus a parent is roughly two emails per member per
post. Resend's free tier allows 100 a day and 3,000 a month, so a team of more
than ~50 will exceed the free daily cap on a single post. When a batch is
refused the editor says so; the Pro plan removes the daily cap.

Posts that were already published before this feature was deployed are marked
as "predates email" and are never offered for sending, so old news cannot go to
every family by accident.

## Cost controls

Vercel and Neon both bill by usage, so a spend cap has to be set by hand in
those dashboards — no setting in this repository can do it. See
[COSTS.md](./COSTS.md).

## Choosing a database

> **Note — this section is out of date.** `prisma/schema.prisma` now declares
> `provider = "postgresql"` and the live deployment runs on Neon Postgres. The
> alternatives below described the original SQLite setup and are kept only as
> background on why the schema was written to be portable. Read them as history,
> not as instructions.

The schema is deliberately portable. Pick whichever fits the hosting:

### SQLite on a persistent disk — simplest

Works on Railway, Render, Fly.io, or any VPS with a mounted volume.

```
DATABASE_URL="file:/data/tjpolicy.db"
```

Back up by copying the file. At club scale this is genuinely sufficient.

### Turso / libSQL — for serverless hosts

Vercel and similar platforms have no persistent filesystem, so a SQLite *file*
will not survive. Turso serves the same SQLite dialect over the network:

```bash
npm install @libsql/client @prisma/adapter-libsql
```

Then point `lib/db.ts` at the adapter when `TURSO_DATABASE_URL` is set:

```ts
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const adapter = process.env.TURSO_DATABASE_URL
  ? new PrismaLibSQL(
      createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    )
  : undefined;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

No schema or migration changes are needed — the dialect is identical.

### PostgreSQL — if the team outgrows the above

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `"postgresql"`.
2. Delete `prisma/migrations` and run `npx prisma migrate dev --name init`.
3. Set `DATABASE_URL` to the Postgres connection string.

No application code changes: there is no raw SQL, and no column type is
SQLite-specific.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add the environment variables above (with a Turso `DATABASE_URL`).
3. Build command `npm run build`, output preset **Next.js** — both are detected.
4. Deploy, then run migrations against the production database:
   ```bash
   DATABASE_URL="<production url>" npx prisma migrate deploy
   DATABASE_URL="<production url>" npm run db:seed
   ```
   `db:seed` (not `db:seed:dev`) writes only club settings and the starter order
   catalogue. It is idempotent and safe to re-run.
5. Register the Ion application with the redirect URI
   `https://your-domain/api/auth/callback` and set `AUTH_PROVIDER=ion`.

## Deploying to a container or VPS

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

Mount a volume at `/data` and set `DATABASE_URL="file:/data/tjpolicy.db"`.
Terminate TLS at a reverse proxy and forward `X-Forwarded-For` so rate limiting
sees real client addresses.

## First-run checklist

1. `npx prisma migrate deploy` — create the schema.
2. `npm run db:seed` — club settings and the starter catalogue.
3. Set `OFFICER_USERNAMES` to the officer team's Ion usernames.
4. Have each of them sign in once; they arrive with the officer role. Leave the
   setting in place — it is a standing list, re-applied at every sign-in, and
   the dashboard will refuse to demote anyone on it (their role would come back
   anyway). Additional officers can be promoted from the dashboard without
   touching it.
5. In **Officer team**, create officer profiles. Until one exists, the public
   page falls back to the 2025–26 roster carried over from the old site.
6. In **Club settings**, confirm the contact address, social links,
   MySchoolBucks URL, and the two home-page figures. There is no dues amount to
   set — what each member owes is computed from their own tournament fees and
   orders (see [ARCHITECTURE.md](ARCHITECTURE.md#dues-are-computed-not-entered)).
7. In **Orders**, add the catalogue items the team actually sells before
   opening the portal — the seed only ships an NSDA membership placeholder and
   a hidden hoodie item.
8. Work through [CONTENT-REVIEW.md](CONTENT-REVIEW.md) — a short list of facts
   from the old site that need a human decision.

Achievements has no admin page by design — the team decided the public results
page should stay hand-curated at the database level rather than exposed as a
form. See [CONTENT-REVIEW.md](CONTENT-REVIEW.md) if that changes.

## Operations

**Backups.** SQLite: copy the file, or `sqlite3 tjpolicy.db ".backup out.db"`
for a consistent snapshot under load. Turso: use its point-in-time restore.
Back up before every migration.

**Migrations.** `npx prisma migrate deploy` in the release step. Migrations are
committed to the repository; never edit an applied one.

**Session cleanup.** Expired sessions are deleted when encountered, so the table
self-cleans under normal traffic. `purgeExpiredSessions()` in
`lib/auth/session.ts` is available for a scheduled job if a deployment wants one.

**Logs.** Unhandled API errors are logged server-side with full detail; clients
receive a generic message and, on page errors, a `digest` that matches the log
line. The audit log covers administrative actions.

**Rotating `SESSION_SECRET`** invalidates the IP hashes in the audit log and the
CSRF tokens in flight, signing everyone out. That is the intended behaviour if
the secret is ever exposed.
