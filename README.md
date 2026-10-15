# TestimonialHub

A multi-tenant testimonial collection and management platform. Users create named collections, share public submission links, moderate incoming testimonials, and display approved ones on public pages or embeddable widgets.

> **Status:** Initial implementation complete (Phase 1–4 of the original plan). All four automated checks (`typecheck`, `lint`, `test`, `build`) pass clean.
> **Purpose:** Learning and portfolio project.

## Table of Contents

- [Stack](#stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [Testing and Quality Checks](#testing-and-quality-checks)
- [Feature Status — Done vs Not Done](#feature-status--done-vs-not-done)
- [Agentic Tooling Used](#agentic-tooling-used)
- [Launch Readiness](#launch-readiness)
- [Architecture Notes](#architecture-notes)
- [Requirements Documents](#requirements-documents)
- [Roadmap](#roadmap)

## Stack

| Layer            | Choice                                                   |
|------------------|----------------------------------------------------------|
| Framework        | Next.js 15.5 (App Router) + React 19.2 + TypeScript 5.6  |
| Styling          | Tailwind CSS 3.4                                         |
| Database         | MySQL 8                                                  |
| ORM              | Prisma 6.19                                              |
| Auth             | Auth.js v5 (Credentials provider, JWT sessions)          |
| Password hashing | bcryptjs (cost 12)                                       |
| Email            | Resend (with placeholder fallback for dev)               |
| Billing          | Stripe (test mode)                                       |
| Validation       | Zod                                                      |
| Testing          | Vitest + happy-dom, Playwright (e2e config only)         |

## Features

- Email + password registration (verification deferred to a future release; password reset enabled)
- JWT-based sessions with per-user `tokenVersion` for instant invalidation
- Multiple testimonial collections per user with unique slugs and reserved-name guard
- Public collection page (`/c/[slug]`) and submission form (`/c/[slug]/submit`)
- Moderation queue: Pending → Approved / Rejected, with re-review and delete
- Embeddable widget iframe (`/widgets/[token]`) with grid and carousel layouts
- JSON feed (`/widgets/[token]/json`) for client-side rendering with CORS `*`
- Dashboard overview with 30-day submission chart (recharts)
- CSV export with spreadsheet formula-injection guard
- Account settings: profile, password change, account deletion
- Free-plan limits: 2 collections, 50 testimonials, 2 active widgets; Paid plan removes these
- Stripe billing UI scaffolding (Checkout/Customer Portal/webhook handlers present but disabled pending live test keys)
- Tenant isolation: every tenant-scoped query includes a `userId` predicate
- Rate limiting on public submission and auth endpoints (in-memory token bucket)
- Constant-time responses for password reset and email enumeration prevention

## Project Structure

```text
TestimonialHub/
├── docs/                          # PRD and SRS
├── prisma/
│   └── schema.prisma              # User, Account, Session, Collection, Testimonial, Widget, VerificationToken, Subscription
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (marketing)/           # Public marketing + auth pages
│   │   ├── api/                   # Route handlers (auth, export, public submit, stripe webhook, widgets)
│   │   ├── c/[slug]/              # Public collection page + submit form
│   │   ├── dashboard/             # Authenticated dashboard (collections, testimonials, widgets, analytics, export, settings, billing)
│   │   ├── widgets/[token]/       # Widget iframe + JSON feed
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                # ui/, marketing/, auth/, dashboard/, public/
│   ├── lib/                       # db, plans, auth/*, security/*, collections/*, notifications/*, utils/*
│   └── auth.ts                    # Auth.js v5 config (edge-safe)
├── tests/
│   └── unit/                      # Vitest unit tests
├── .env.example                   # Copy to .env and fill in
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8 (local install, Docker container, or remote instance)
- Optional: a Resend API key for sending real email in dev
- Optional: Stripe CLI + test-mode keys for billing flows

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `DATABASE_URL` — MySQL connection string
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `AUTH_URL` — `http://localhost:3000` for dev
- `AUTH_TRUST_HOST=true` — required by NextAuth v5 in dev

Stripe and Resend keys can stay as `CHANGE_ME` placeholders during initial development. The app will log emails to the console instead of sending them when Resend is not configured. Stripe-dependent UI is currently a placeholder pending live test keys.

See [Environment Variables](#environment-variables) for the full list.

### 3. Set up the database

Create the MySQL database and a dedicated user (example for local MySQL 8):

```sql
CREATE DATABASE testimonialhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'testimonialhub_app'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON testimonialhub.* TO 'testimonialhub_app'@'localhost';
FLUSH PRIVILEGES;
```

Then update `DATABASE_URL` in `.env`:

```text
DATABASE_URL="mysql://testimonialhub_app:your_password_here@127.0.0.1:3306/testimonialhub"
```

Apply the schema:

```bash
npm run prisma:generate
npm run prisma:migrate
```

The first command regenerates the Prisma client. The second applies migrations and creates the `dev.db` snapshot. **Review every migration before applying it** — never run migrations blindly against shared databases.

### 4. Start the dev server

```bash
npm run dev
```

The app is now at <http://localhost:3000>.

## How to Run

This is the short version. See the [Environment Variables](#environment-variables) and [Database Setup](#database-setup) sections above for the long version.

### One-time setup

```bash
# 1. Clone and install
git clone https://github.com/Mahmudul-Mafi/TestimonialHub.git
cd TestimonialHub
npm install

# 2. Create your env file and fill in DATABASE_URL + AUTH_SECRET
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and AUTH_SECRET

# 3. Generate the Prisma client and apply the schema
npm run prisma:generate
npm run prisma:migrate
```

### Day-to-day

```bash
# Start the dev server (kills any orphan `next dev` first, then clears .next)
npm run dev
# → http://localhost:3000

# Run the full quality suite
npm run typecheck && npm run lint && npm test && npm run build

# Production build + serve
npm run build
npm start
# → http://localhost:3000
```

### Manual smoke (end-to-end happy path)

1. Open <http://localhost:3000>, click **Get started** → register an account.
2. You're auto-logged in. From the dashboard:
   - **Collections → New** — create a collection. Slug becomes your public URL.
   - **Wall of Love / Collections** — open the collection, copy the public URL.
3. Open the public URL in a private tab. Click **Leave a testimonial** (modal), submit, return to the dashboard.
4. **Testimonials** — approve the new entry.
5. Refresh the public URL; the approved testimonial now appears.
6. **Widgets → New** — create a widget, copy the iframe snippet, paste it into any HTML page.
7. **Billing** — try the demo checkout (`4242 4242 4242 4242`).

## Environment Variables

| Variable                          | Required | Notes                                                                                  |
|-----------------------------------|----------|----------------------------------------------------------------------------------------|
| `NODE_ENV`                        | yes      | `development` / `production` / `test`                                                 |
| `APP_URL`                         | yes      | Base URL used for Stripe redirect URLs and email links                                |
| `DATABASE_URL`                    | yes      | MySQL connection string                                                                |
| `AUTH_SECRET`                     | yes      | NextAuth JWT signing secret (32+ bytes)                                                |
| `AUTH_URL`                        | yes      | Must match the public origin                                                           |
| `AUTH_TRUST_HOST`                 | yes      | `true` in dev, `true` in prod behind a trusted proxy                                  |
| `STRIPE_SECRET_KEY`               | billing  | `sk_test_...` for development                                                          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | billing | `pk_test_...` (exposed to browser)                                                  |
| `STRIPE_WEBHOOK_SECRET`           | billing  | From `stripe listen --forward-to localhost:3000/api/stripe/webhook`                    |
| `STRIPE_PAID_PRICE_ID`            | billing  | Stripe Price ID for the Paid plan                                                      |
| `RESEND_API_KEY`                  | email    | If unset, emails are logged to console instead                                         |
| `EMAIL_FROM`                      | email    | Sender address, e.g. `TestimonialHub <noreply@example.com>`                            |
| `EMAIL_REPLY_TO`                  | email    | Reply-to address                                                                       |
| `NEXT_PUBLIC_APP_NAME`            | yes      | App display name                                                                       |
| `CAPTCHA_ENABLED`                 | no       | `true` to enforce CAPTCHA on public submission                                         |
| `HCAPTCHA_SITE_KEY`               | captcha  | Required only when `CAPTCHA_ENABLED=true`                                              |
| `HCAPTCHA_SECRET`                 | captcha  | Required only when `CAPTCHA_ENABLED=true`                                              |

Never commit `.env` or any file containing real secrets.

## Database Setup

The Prisma schema covers:

- `User` — credentials, `tokenVersion` for JWT invalidation
- `Account`, `Session` — Auth.js tables (kept for forward compatibility)
- `Collection` — name, slug, brand color, theme, soft delete (`deletedAt`)
- `Testimonial` — submission, status (`pending` / `approved` / `rejected`), 1–5 rating
- `Widget` — public token, layout (`grid` / `carousel`), sort order, active flag
- `VerificationToken` — hashed, single-use tokens for email verification and password reset
- `Subscription` — Stripe customer + subscription IDs, status, plan, current-period end

`Subscription` is a stub: the columns exist, but the webhook handler is wired but not exercised against real Stripe data. The dashboard billing page surfaces plan state from the `Subscription` row.

## Running the App

| Command                     | Purpose                                          |
|-----------------------------|--------------------------------------------------|
| `npm run dev`               | Start the Next.js dev server                     |
| `npm run build`             | Production build (also runs typecheck and lint)  |
| `npm start`                 | Run the production build                         |
| `npm run typecheck`         | TypeScript only                                  |
| `npm run lint`              | ESLint                                           |
| `npm test`                  | Run the Vitest unit-test suite                   |
| `npm run test:watch`        | Vitest in watch mode                             |
| `npm run prisma:generate`   | Regenerate the Prisma client                     |
| `npm run prisma:migrate`    | Apply Prisma migrations to the dev database      |
| `npm run prisma:studio`     | Open Prisma Studio                               |
| `npm run prisma:format`     | Format `prisma/schema.prisma`                    |

## Testing and Quality Checks

The current suite is unit tests for foundation libraries:

- `tests/unit/password.test.ts` — policy enforcement, hashing, verification
- `tests/unit/slug.test.ts` — slug validation, normalization, reserved list
- `tests/unit/csv.test.ts` — RFC 4180 quoting and formula-injection guard
- `tests/unit/plans.test.ts` — Free/Paid limits and rate-limit helpers
- `tests/unit/cn.test.ts` — className joiner utility

Run all four checks:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

The full Vitest run covers **21 test files / 211 tests** as of the latest audit. E2E coverage with Playwright is configured (`@playwright/test` is installed) but no specs are written yet — see [Roadmap](#roadmap).

## Feature Status — Done vs Not Done

A frank split of what the repo actually ships today versus what is deferred to a future iteration.

### Done (in this build)

| Area | What works today | Where |
|------|------------------|-------|
| **Project scaffold** | Next.js 15.5 (App Router) + React 19 + TypeScript 5.6 + Tailwind 3.4 + Prisma 6.19, fully wired | `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `prisma/schema.prisma` |
| **Auth** | Auth.js v5 (Credentials provider), bcryptjs cost-12 hashing, JWT sessions with `tokenVersion` for instant invalidation, password policy (10+ chars, letter+digit, breached-password list), password reset, constant-time responses | `src/auth.ts`, `src/app/api/auth/**`, `src/lib/auth/**`, `src/lib/security/password.ts` |
| **Multi-tenant data model** | `User`, `Collection`, `Testimonial`, `Widget`, `Subscription`, `VerificationToken`, plus Auth.js `Account`/`Session`. Soft delete via `deletedAt`. CUIDs. | `prisma/schema.prisma` |
| **Collections CRUD** | Create / read / update / soft-delete; unique slugs with reserved-name guard; per-user scoping | `src/app/dashboard/collections/**`, `src/lib/collections/**` |
| **Testimonial moderation** | Pending → Approved / Rejected, re-review, delete, pagination | `src/app/dashboard/testimonials/**`, `src/lib/testimonials/**` |
| **Public submission** | `/c/[slug]` page + submission form, server-side validation, 1–5 star rating, rate-limited (5/10 min/IP), submitter email never returned publicly | `src/app/c/[slug]/**`, `src/app/api/public/[slug]/submit/route.ts`, `src/lib/public/submission-schema.ts` |
| **Accessible modal entry point** | **Leave a testimonial** opens the form in an `aria-modal` dialog with focus trap, scroll lock, escape, backdrop dismiss, focus restoration, and auto-close on success — the standalone `/c/[slug]/submit` route is preserved as a fallback | `src/components/ui/dialog.tsx`, `src/app/c/[slug]/submit-modal.tsx`, `src/app/c/[slug]/page.tsx`, `src/app/c/[slug]/submit/submit-form.tsx` |
| **Embeddable widgets** | `/widgets/[token]` iframe (grid + carousel layouts, theme tokens, brand color), `/widgets/[token]/json` with `Access-Control-Allow-Origin: *`, token rotation, embed code copy | `src/app/widgets/[token]/**`, `src/components/widget/**` |
| **Wall of Love** | `/wall/[slug]` public page, per-review direct-link anchors with **Copy review link**, embeddable iframe snippet, sidebar entry wired between Export and Billing | `src/app/wall/[slug]/**`, `src/components/dashboard/sidebar-nav.tsx` |
| **Analytics** | 30-day submission chart (recharts), top collections, per-collection stats | `src/app/dashboard/analytics/**`, `src/lib/analytics/**` |
| **CSV export** | RFC 4180 quoting, spreadsheet formula-injection guard, streamed download | `src/app/dashboard/export/route.ts`, `src/lib/csv/**` |
| **Settings** | Profile, password change, account deletion (soft + tokenVersion bump) | `src/app/dashboard/settings/**` |
| **Plan limits** | Free tier (2 collections / 50 testimonials / 2 active widgets); paid tier unlimited. Enforced server-side. | `src/lib/plans.ts` |
| **Demo billing** | Demo-only checkout (`4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` declines) with `demo_`-prefixed `stripeCustomerId` / `stripeSubscriptionId`. Never persists full PAN or CVC. Cancel flow included. | `src/app/dashboard/billing/**`, `src/app/api/demo/**` |
| **Rate limiting** | In-memory token bucket on public submission, registration, password reset, demo checkout, demo cancel | `src/lib/security/rate-limit.ts` |
| **Security & privacy** | CSRF protection (Auth.js v5), `safeNext()` open-redirect guard, submitter-email privacy, `frame-ancestors *` only on widget/wall routes, `X-Frame-Options: DENY` elsewhere | `src/lib/security/**`, `next.config.ts` |
| **Unit tests** | 21 test files / 211 tests covering foundations, modal regression, dialog, slug, plans, CSV, password, widget JSON, public submission validation, and the homepage SVG-alignment regression | `tests/unit/**` |
| **Quality gates** | `npm run typecheck && npm run lint && npm test && npm run build` all clean | `package.json` (`scripts`) |
| **Dev workflow hardening** | `predev` script kills orphan `next dev` processes on ports 3000–3019 and clears `.next/`; `prestart` is a no-op (does not destroy the production build). The recurring homepage alignment bug is locked out by 3 layers of regression tests. | `scripts/predev.js`, `scripts/prestart.js`, `tests/unit/homepage-regression.test.ts` |

### Not done (deferred / out of scope for this build)

| Area | What's missing | What's needed to ship it |
|------|----------------|--------------------------|
| **Real Stripe** | Checkout, Customer Portal, and webhook handlers are wired in code but not exercised. `/dashboard/billing/checkout` is the **demo** flow. | Wire live Stripe **test** keys in `.env`, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`, then remove the demo-only branches in `src/app/dashboard/billing/page.tsx` and `src/app/api/demo/**`. |
| **Email verification on registration** | Disabled in the current build. New users are auto-signed-in. Tokens and routes are still in place. | Re-enable the token-mint + email-send in `src/app/api/auth/register/route.ts`; the `requireUser()` chokepoint already redirects unverified users to `/verify-email`. |
| **Real CAPTCHA** | `CAPTCHA_ENABLED` toggle exists; hCaptcha keys are not wired. | Set `HCAPTCHA_SITE_KEY` and `HCAPTCHA_SECRET`, flip `CAPTCHA_ENABLED=true`, server-verify in the submission route. |
| **Redis-backed rate limiter** | Current limiter is in-memory and per-process. | Move `src/lib/security/rate-limit.ts` to a shared store (Redis is the planned target). |
| **E2E specs** | Playwright is installed and configured, but no specs under `tests/e2e/` are written. | Author specs covering: registration → collection create → public submit → approve → widget embed → demo checkout. |
| **Hosting target** | No Dockerfile, no Vercel/Railway/Render config. | Pick a target and add the corresponding config (Dockerfile or platform-specific). |
| **License** | No `LICENSE` file at the repo root. | Add one before publishing. |
| **Real email deliverability** | `RESEND_API_KEY` defaults to a placeholder; emails log to console. | Configure a verified sender domain in `.env`. |

## Agentic Tooling Used

This section documents the **AI agent tools** used to build the project, where they are wired in the repo, and what they did. It is not about external integrations like Stripe or Resend.

### Primary assistant: puku-cli (this CLI)

The whole build was done with **puku-cli**, a CLI AI coding assistant. Every code change, command, file edit, and test in this repo was produced through this tool. puku-cli exposes several sub-tools; below is which ones I used and what they did.

| Tool | What it is | What I used it for in this repo |
|------|-----------|----------------------------------|
| **Agent (general-purpose subagent)** | Spawns an isolated subprocess with the same toolset, used to research a question or perform a multi-step task in parallel without polluting the main context. | Used during the homepage-alignment regression investigation to explore `tests/`, `prisma/`, and the `next dev` process tree concurrently; used during the modal-dialog implementation to verify the existing `StarRating` and `SubmitForm` shapes before extending them. |
| **Skill** | Invokes a named slash-command skill (e.g. `/commit`) for a specific workflow. | The `/create-skill` style workflow for skill creation; the `/init`-style bootstrap. **No skills are installed in this repo** — there is no `.puku-cli/skills/` or `~/.puku-cli/skills/` directory at the moment. |
| **Bash** | Runs shell commands (with the working directory and a 2-minute default timeout; up to 10 min on request). | `npm install`, `npm run dev`, `npm run build`, `npm test`, `npm run lint`, `npm run typecheck`, `prisma migrate dev`, `git` for status/log/diff, PowerShell for process introspection on Windows. |
| **Edit** | In-place exact-string edit of an existing file (requires a prior `Read`). | Every focused code change in `src/`, `tests/`, `scripts/`, `prisma/`, and `docs/`. |
| **Write** | Creates a new file or overwrites an existing one. | New files: `scripts/predev.js`, `scripts/prestart.js`, `scripts/measure-homepage.cjs`, `tests/unit/homepage-regression.test.ts`, this README. |
| **Read** | Reads files (with offset/limit for long files; supports images and PDFs). | Every read of source, tests, config, docs, and the existing `README.md` before editing. |
| **Glob** | File-pattern matching. | Discovering test files, config files, and source layout. |
| **Grep** | Regex search across files. | Verifying the modal regression invariants, locating Tailwind class usage, confirming no MCP servers are wired, etc. |
| **WebSearch / WebFetch** | Search the web and fetch a URL. | Not used in this build — all the answers I needed were already in the repo. |
| **TaskCreate / TaskList / TaskUpdate** | Internal todo-list management. | Used to track multi-step work during the modal-dialog feature and the homepage-regression investigation. |
| **EnterPlanMode / ExitPlanMode** | Pause and draft a plan for user approval. | Used for the modal-dialog plan that is checked into `.puku-cli/plans/`. |
| **AskUserQuestion** | Ask the user a multiple-choice question mid-task. | Used once during the homepage regression to confirm the symptom and surface area. |

### npm-script "hooks" (NOT Claude hooks)

This project has a `predev` and `prestart` hook wired in `package.json`. These are **npm lifecycle hooks** that run before `dev` / `start`. They are plain Node.js scripts, not anything AI-related:

```text
"predev":    "node scripts/predev.js"
"prestart":  "node scripts/prestart.js"
```

- `scripts/predev.js` — kills orphan `next dev` processes on ports 3000–3019 (Windows via `netstat` + PowerShell `Get-CimInstance` + `taskkill`; POSIX via `lsof` / `ss` + `SIGTERM`), then clears `.next/`. This is what prevents the homepage alignment bug from recurring.
- `scripts/prestart.js` — intentional no-op. The previous version cleared `.next/`, which destroyed the production build before `next start` could serve it.

Both are listed in `eslint.config.mjs` under `ignores` because they use CommonJS `require()` and intentionally diverge from the Next.js / TS rules applied to `src/`.

### MCP servers

**No MCP servers are configured or used in this build.** Verified by grepping the repo for `mcp`, `modelcontextprotocol`, and `.mcp.json` — nothing found. If/when an MCP server is added, it would be configured by the user in their own client, not in this repo.

### Hooks (Claude Code / puku-cli hooks)

**No puku-cli or Claude Code hooks are installed.** Verified by checking for `.puku-cli/hooks/`, `.claude/hooks/`, `~/.puku-cli/settings.json`, and `~/.claude/settings.json` — none contain a `hooks` block. The `predev` and `prestart` scripts in `package.json` are **npm** hooks, not AI hooks; they run when a human (or CI) executes `npm run dev` / `npm start`.

### Plans

The modal-dialog implementation plan drafted during this build is checked in at:

- `.puku-cli/plans/twinkly-puzzling-piglet.md`

It is purely a planning artifact and is not required to run the project.

## Launch Readiness

The MVP code is in a coherent, internally-consistent state and passes the full automated verification suite (lint, typecheck, 211 unit tests, production build). Before any production deployment, read the items below.

### Demo billing (no real Stripe)

The MVP does **not** integrate with a real payment processor. `/dashboard/billing/checkout` is a **demo** flow that:

- Luhn-validates a fake card number (`4242 4242 4242 4242` for success, `4000 0000 0000 0002` for decline; any other Luhn-valid number simulates success).
- Persists a synthesized subscription row with `demo_` prefixes on `stripeCustomerId` / `stripeSubscriptionId`. The rest of the app recognizes demo rows via the prefix and labels them "Demo" everywhere they appear.
- **Never persists the full card number or CVC.** Only `last4`, expiry month, and expiry year are available to the validator; the API returns no card data.
- The simulated outcome is **determined server-side** from the card number. The client cannot send `plan`, `price`, or `paymentSucceeded` to bypass the check.

The Stripe webhook handler, Checkout, and Customer Portal code is present in `src/lib/billing/` but not exercised until real test keys are wired. Until then, do not advertise the Paid plan as a real, paid feature.

### Security & privacy properties

- **Tenant isolation.** Every tenant-scoped Prisma query includes a `userId` predicate or `collection: { is: { userId, deletedAt: null } }`. The dashboard layout calls `requireUser()` on every request, which re-reads the user record and checks `tokenVersion` against the JWT.
- **CSRF.** Auth.js v5 double-submit cookies protect the credentials callback. The registration endpoint reuses the same callback via internal fetch.
- **Open-redirect guard.** All `?next=` parameters are normalized through `safeNext()` (same-origin absolute paths only).
- **Rate limits.** Public submission (5 / 10 min / IP), registration (5 / hr / IP), password reset (5 / hr / IP), demo checkout (5 / 5 min / user), demo cancel (5 / 5 min / user). **In-memory token bucket** — see Known Limitations.
- **Constant-time responses.** Registration and password-reset requests return the same shape and add a small random delay for unknown emails to prevent enumeration.
- **Submitter email privacy.** Submitter email is **never** returned by any public surface (`/c/[slug]`, `/widgets/[token]`, `/widgets/[token]/json`, `/wall/[slug]`, CSV export, embed code, etc.). The owner sees it only on the dashboard testimonials page.
- **CSV export safety.** Cells are RFC 4180-quoted; values starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are prefixed with a single quote to defeat spreadsheet formula injection.
- **Password policy.** Minimum 10 characters, must include a letter and a digit, validated against a bundled breached-password list. Bcrypt cost 12.
- **Password-reset / verification tokens.** SHA-256 hashed at rest, single-use, atomic consume, 24-hour expiry.
- **Embed headers.** `/wall/:slug` and `/widgets/:token` set `frame-ancestors *` and `X-Frame-Options: ALLOWALL` so they can be iframed by any site. Other routes remain DENY by default.

### Known limitations (MVP)

- **Email verification is intentionally disabled.** New users are signed in immediately on registration. The verification token table, `/verify-email` page, and `/api/auth/verify-email` route remain in place, but the registration flow does not mint a token or send a verification email. This means anyone who knows an email address can create an account in that address and obtain a session. Rate-limit (5/hr/IP) and the bcrypt cost soften the abuse surface; production deployment should re-enable verification before public sign-up is allowed.
- **In-memory rate limiter.** The token-bucket implementation lives in process memory. It is reset on restart and is **not shared across instances**; horizontally-scaled deployments must migrate to a shared store (Redis is the planned target).
- **Single-process / single-region assumed.** No distributed locks, no shared session store, no read replicas. The MVP is designed for a single Next.js process against a single MySQL instance.
- **No real email deliverability configuration.** `RESEND_API_KEY` defaults to a placeholder; the email layer logs to the console in dev. Configure a verified sender domain in `.env` before relying on the owner-notification flow.
- **No real Stripe integration.** As above; until live test keys are wired, `/api/stripe/*` is inert.

### Manual verification checklist (before public launch)

The automated suite covers the foundation. The following need a human eye before the app is exposed to real users:

1. `npm run dev` and walk through registration → email → login → create collection → share `/c/[slug]` → submit → approve → embed widget on an external page.
2. Confirm the dashboard sidebar lists **Wall of Love** between **Export** and **Billing**, linking to `/dashboard/collections`.
3. Visit `/wall/[slug]` on a collection that has approved testimonials and click **Copy review link** to confirm a direct anchor URL is written to the clipboard.
4. Run the demo checkout end-to-end (4242 4242 4242 4242 → success → demo badge on Billing page → cancel → back to Free).
5. Attempt the decline card (4000 0000 0000 0002) and confirm a 402 + an error message, **no** database write.
6. With a fresh `User` row, verify the `emailVerifiedAt` column is non-null after registration (it is, by design — see MVP note above).
7. With `CAPTCHA_ENABLED=true` and valid hCaptcha keys, confirm the public submission form blocks bots.
8. Production build + run: `npm run build && npm start`. Confirm `/dashboard` redirects to `/login?next=/dashboard` when unauthenticated.

## Architecture Notes

**Tenant isolation.** Every tenant-scoped Prisma query in `src/lib/collections/queries.ts` and the dashboard actions includes a `userId` predicate or a nested `collection: { is: { userId } }` filter. The dashboard layout calls `requireUser()` on every request, which re-reads the user record and checks `tokenVersion` against the JWT. There is no DB session, so `tokenVersion` is the only way to invalidate a session — incrementing it on password reset or account deletion forces re-login.

**Email verification and password reset.** Tokens are stored hashed (SHA-256) with a `purpose` discriminator and a 24-hour expiry. Consumption is atomic via a conditional `updateMany({ where: { tokenHash, purpose, consumedAt: null, expiresAt: { gt: new Date() } } })`. The reset and request-reset endpoints return identical responses for known and unknown emails, with a small randomized delay, to prevent email enumeration.

> **MVP note:** email verification is intentionally **disabled** in the current build. New users are signed in immediately on registration; the verification-token mechanism above is preserved and the `/verify-email` page and `/api/auth/verify-email` route remain callable, but the registration flow does not mint a token or send a verification email. The `requireUser()` chokepoint still redirects unverified users to `/verify-email` as defense-in-depth, so a future re-enable of verification requires no changes outside the registration flow.

**Plan limits.** `src/lib/plans.ts` defines `FREE_LIMITS` (2 collections, 50 testimonials, 2 active widgets) and `PAID_LIMITS` (all unlimited). `planFor(subscription)` returns `"free"` or `"paid"`. The Free tier is the default until `Subscription.status === "active"` or `"trialing"`. Limit enforcement lives in the create actions and the public submission endpoint, not just the UI.

**Widget embed.** The widget iframe serves a fully styled page; the JSON feed (`/widgets/[token]/json`) returns approved testimonials with `Access-Control-Allow-Origin: *` so external sites can render them client-side. Tokens can be rotated from the dashboard, which regenerates `publicToken` and invalidates all existing embeds immediately.

**Public submission.** The submission endpoint is rate-limited (5 / 10 min per IP), enforces the Free-plan testimonial cap on the server, and never trusts the client. The submitter's name, body, rating, and optional company/role are stored with `status: "pending"` and require explicit approval.

**CSV export.** Cells are escaped per RFC 4180, and any value starting with `=`, `+`, `-`, `@`, tab, or carriage return is prefixed with a single quote so spreadsheets do not evaluate it as a formula.

**Stripe.** The webhook handler and subscription reconciliation logic are present in `src/lib/billing/`, but live keys are intentionally not configured. The billing page shows a placeholder until real test keys are wired.

## Requirements Documents

- **[Product Requirements Document](docs/TestimonialHub_PRD.md)** — product vision, scope, user journeys
- **[Software Requirements Specification](docs/TestimonialHub_SRS.md)** — system behavior, functional/non-functional requirements, acceptance criteria

These documents describe the intended final scope; the implementation covers most of Phase 1–4 from the roadmap below. Several open decisions in PRD §13 (brand name, CAPTCHA provider, hosting target, etc.) remain TBD and will be locked before the billing and CAPTCHA code paths are exercised in production.

## Roadmap

### Done

- Project scaffold, Prisma schema, Auth.js v5 wiring
- Marketing site, auth pages, dashboard shell
- Collections (create, edit, delete, unique slug)
- Testimonial submission, moderation, pagination
- Public collection page and submit form (with accessible modal entry point)
- Widget iframe (grid/carousel) + JSON feed
- Wall of Love public page with per-review direct-link anchors and embeddable iframe snippet
- Analytics, CSV export, settings
- Free-plan limits, **demo** billing flow (no real Stripe)
- Accessible modal dialog primitive with focus trap, scroll lock, and focus restoration
- Sidebar navigation: Wall of Love entry wired between Export and Billing
- Unit tests (21 files / 211 tests), typecheck, lint, production build

### Next

- Re-enable email verification on registration (currently disabled — see Launch Readiness)
- Replace in-memory rate limiter with a Redis-backed implementation
- Stripe Checkout + Customer Portal wiring with real test keys
- CAPTCHA integration (hCaptcha recommended; toggle in `.env`)
- Webhook end-to-end test (subscription create/update/cancel, grace period, downgrade)
- E2E specs in `tests/e2e/`
- Optional hosting target (Vercel, Railway, Render, or self-hosted Docker)

## License

No license has been selected yet. Until one is added, do not assume this project is licensed for unrestricted reuse.
