# AI Final Touch

An introduction platform for AI-built websites and apps: requesters post what AI made and what isn't right, specialists express interest, and the two chat on-site before arranging the work privately.

**Stack:** Next.js 16 (App Router) on Cloudflare Workers via OpenNext · D1 (Drizzle ORM) · R2 · Clerk · Resend.

## Service responsibilities

| Concern | Where it lives |
| --- | --- |
| Identity, sign-up/in, sessions | Clerk. The app never sees passwords. |
| Application data (users, profiles, Requests, interests, conversations, messages, reports, analytics) | D1. `users.clerk_id` maps a Clerk identity to one application user, created on first sign-in. |
| Uploaded files (portfolio images, Request attachments) | R2, with metadata and ownership in the D1 `uploads` table. Served only through `/files/[id]`, which enforces visibility. |
| Chat | D1 is the source of truth. The conversation page polls `/api/conversations/[id]/messages`. |
| Email | Resend, notifications only (new interest, new message). Links point back to the site and carry no credentials. Message emails are throttled to one per conversation every 15 minutes. |

## Permission model

Every protected action is checked on the server inside the Server Action or route handler. `src/proxy.ts` only redirects signed-out visitors away from private pages early.

| Action | Who | Enforced by |
| --- | --- | --- |
| Create or edit a Request | Signed-in, active user; editing only by the owner | `requireActiveUser` + `requests.user_id = user.id` |
| View a draft or removed Request | Owner (drafts) or admin | `canViewRequest` |
| Express interest | Active user with a **published** profile, not the owner, Request `published` | `expressInterest`; the unique index `(request_id, specialist_user_id)` blocks duplicates |
| Read or send messages | Only the requester or specialist on that conversation (admins can read) | `getConversationForUser` in the page, API route and `sendMessage` |
| Private attachment | Owner, admin, or a specialist who has expressed interest | `/files/[id]` |
| Moderation | `users.is_admin` (granted automatically to addresses in `ADMIN_EMAILS`) | `requireAdmin` |

Rate limits (a fixed-window counter in D1) apply to Request creation, interests, messages, uploads, profile updates and reports; see `src/lib/rate-limit.ts`.

## Local development

```bash
pnpm install
cp .env.example .env.development.local      # add Clerk *development* keys
pnpm db:migrate:local                        # creates the local D1 in .wrangler/
pnpm wrangler d1 execute DB --local --file scripts/seed-local.sql   # optional sample content
pnpm dev                                     # http://localhost:3000
```

`next dev` gets local D1 and R2 bindings through `initOpenNextCloudflareForDev()` in `next.config.ts`. To run the real Workers runtime locally, copy `.dev.vars.example` to `.dev.vars` and run `pnpm preview` (port 8787).

To become an admin, put your email in `ADMIN_EMAILS` and sign in.

Do **not** use `.env.local`: Next.js loads it during production builds too, which would put development keys into a production bundle.

## Environments

`wrangler.jsonc` defines development at the top level and production under `env.production`. They share nothing:

| | Development | Production |
| --- | --- | --- |
| Worker | `aifinaltouch-dev` | `aifinaltouch` |
| D1 | `aifinaltouch-dev` | `aifinaltouch-prod` |
| R2 | `aifinaltouch-uploads-dev` | `aifinaltouch-uploads-prod` |
| Clerk | Development instance (`pk_test_` / `sk_test_`) | Production instance (`pk_live_` / `sk_live_`) |
| Resend | Dev sending domain / key | Production domain / key |
| Domain | `*.workers.dev` | `aifinaltouch.com`, `www.aifinaltouch.com` |

### One-time Cloudflare setup

```bash
pnpm wrangler d1 create aifinaltouch-dev      # paste database_id into wrangler.jsonc (top level)
pnpm wrangler d1 create aifinaltouch-prod     # paste database_id into env.production
pnpm wrangler r2 bucket create aifinaltouch-uploads-dev
pnpm wrangler r2 bucket create aifinaltouch-uploads-prod

# Secrets (development Worker)
pnpm wrangler secret put CLERK_SECRET_KEY
pnpm wrangler secret put RESEND_API_KEY
pnpm wrangler secret put EMAIL_FROM
pnpm wrangler secret put ADMIN_EMAILS

# Secrets (production Worker)
pnpm wrangler secret put CLERK_SECRET_KEY --env production
pnpm wrangler secret put RESEND_API_KEY --env production
pnpm wrangler secret put EMAIL_FROM --env production
pnpm wrangler secret put ADMIN_EMAILS --env production
```

The Clerk **publishable** key is compiled into the client bundle, so it comes from the env file matching the build: `.env.development.local` for dev builds and `.env.production.local` (containing only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL`) for `pnpm deploy:prod`.

In the Clerk dashboard (production instance), set the sign-in URL to `/sign-in`, the sign-up URL to `/sign-up`, and add `aifinaltouch.com` as the domain. In Resend, verify the sending domain used in `EMAIL_FROM`.

### Deploy

```bash
pnpm db:migrate:dev  && pnpm deploy:dev      # development Worker
pnpm db:migrate:prod && pnpm deploy:prod     # production Worker
```

### Pre-production checklist

- [ ] `wrangler.jsonc` → `env.production` has the real `aifinaltouch-prod` database id and the `aifinaltouch-uploads-prod` bucket
- [ ] `.env.production.local` holds the Clerk `pk_live_` key and no development values
- [ ] Production secrets are set: `wrangler secret list --env production`
- [ ] Resend domain verified; `EMAIL_FROM` uses it
- [ ] `pnpm db:migrate:prod` applied
- [ ] Custom domain attached; `APP_URL` in `env.production.vars` matches it
- [ ] Sign up, create a profile, post a Request, express interest, exchange messages and receive both emails on production

## Database

Schema: `src/db/schema.ts`. Migrations: `drizzle/migrations`, generated with `pnpm db:generate` and applied by Wrangler. Uniqueness, foreign keys and allowed status values are enforced by the database itself, not only by application code.

`portfolio_items.before_upload_id` and `kind = 'before_after'` are reserved for a later AI-version → finished-version comparison view.

## Deliberately out of scope for V1

Payments, escrow, commissions, contracts, reviews/ratings, bidding, AI matching or generation, video/voice, file collaboration and project management. See the product spec, sections 53–57.

## Known notes

- Next.js 16's `proxy.ts` runs on the Node.js runtime. OpenNext marks Node middleware on Cloudflare as experimental; it builds and runs correctly in `wrangler dev`, but re-test after upgrading `@opennextjs/cloudflare`.
- Uploaded images are validated by magic bytes and size (5 MB images, 10 MB PDFs) but are not resized. Cloudflare Images can be added in front of `/files/[id]` later.
