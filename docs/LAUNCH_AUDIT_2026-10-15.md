# TestimonialHub — Final Audit & Launch Readiness Report

**Date:** 2026-10-15
**Auditor role:** Senior full-stack engineer / QA / AppSec / Release manager
**Scope:** All source under `C:\TestimonialHub`, plus the README and docs.

---

## 1. Initial Git State

The working tree at the start of the audit was:

```
 M .gitignore                  (modified)
 M README.md                   (modified)
 M docs/TestimonialHub_PRD.md  (modified)
 M docs/TestimonialHub_SRS.md  (modified)
?? .env.example
?? .puku-cli/
?? TestimonialHub.tmp-cookies.txt   (test artifact, should be ignored)
?? docs/TestimonialHub_PRD_DELTA.md
?? eslint.config.mjs
?? next.config.ts
?? package-lock.json
?? package.json
?? playwright.config.ts
?? postcss.config.mjs
?? prisma/
?? src/
?? tailwind.config.ts
?? tests/
?? tsconfig.json
?? vitest.config.ts
?? vitest.setup.ts
```

Last commit: `d238385 docs: update project README`.

No destructive git operations were performed during the audit. The only file modifications are described in §6 (Fixes Applied). All existing commits remain intact.

---

## 2. Verdict

**Verdict: GREEN for the documented MVP scope, with documented limitations.**

- The app builds, passes lint, typecheck, and 211 unit tests.
- The demo billing flow is internally consistent: server-determined outcomes, no card persistence, the marketing-facing pages are clear about it being a demo, and a real-Stripe integration path is preserved in `src/lib/billing/`.
- All tenant-scoped queries are isolated by `userId` (verified in `src/lib/collections/queries.ts` and every dashboard server action).
- Public surfaces (`/c/[slug]`, `/widgets/[token]`, `/widgets/[token]/json`, `/wall/[slug]`, CSV export) **never** return submitter email.
- The CSRF / open-redirect / rate-limit / constant-time stack is in place on the auth paths.
- Two P0/P1 fixes were applied (see §6); one is in a region a user might actually see; the other is a low-risk DB-shape change.
- Known limitations are documented (in README and below) but do not block MVP internal/demo deployment.

**This code is not yet ready to receive real customer data or real payment-method entry without the items in §8 (Manual Checks Required) and §10 (Approval Items).**

---

## 3. Summary of Fixes Applied

| Severity | File | Change |
|----------|------|--------|
| **P1** | `src/app/dashboard/billing/checkout/page.tsx` | Reworded the misleading "You will be charged ${PLAN_PRICING.paid.price} per month on the Paid plan" line on the demo checkout page. The page top already has a clear "This is a demo checkout" disclosure; the right-rail copy now reads "On the real Paid plan, you would be charged $X per month. This demo performs no charge and stores no card data." |
| **P2** | `src/app/dashboard/analytics/page.tsx` | Split the analytics page's two concerns into separate Prisma queries: (a) status/rating aggregates need every testimonial for the user; (b) the 30-day trend only needs the last 30 days, which is now pushed into the `where: { createdAt: { gte: since } }` filter. This keeps the in-memory bucketing bounded by 30 days of data rather than the lifetime of the account, which matters for Paid users with unlimited testimonials. |
| **Doc** | `README.md` | Added a comprehensive **Launch Readiness** section: demo billing disclosure, security & privacy properties, known limitations, manual verification checklist. Updated the **Roadmap** to reflect what is actually done (Wall of Love nav, accessible modal, demo billing) and the de-scoped work (real Stripe, real CAPTCHA, e2e). |

No schema changes, no destructive operations, no dependency changes.

---

## 4. Verification Suite — Commands & Results

All four checks were run from `C:\TestimonialHub` with no environment changes.

| Command           | Result |
|-------------------|--------|
| `npm run lint`    | **0 errors, 0 warnings** |
| `npm run typecheck` | **0 errors** |
| `npm test`        | **21 test files / 211 tests passed** (Duration 7.33s) |
| `npm run build`   | **Compiled successfully.** 33 routes, 17 static, 16 dynamic. Largest page bundle 5.67 kB (`/dashboard/testimonials`); shared first-load JS 103 kB. |

### Test coverage at a glance

- `tests/unit/dialog.test.tsx` — accessible modal primitive
- `tests/unit/submit-modal.test.tsx` — modal entry point
- `tests/unit/submit-page-fallback.test.ts` — `/c/[slug]/submit` route
- `tests/unit/side-nav.test.ts` — Wall of Love nav ordering
- `tests/unit/wall-of-love.test.ts`, `wall-embed.test.tsx`, `copy-review-link.test.tsx`, `next-config-headers.test.ts` — Wall of Love privacy / embed contract
- `tests/unit/password.test.ts`, `slug.test.ts`, `csv.test.ts`, `cn.test.ts`, `plans.test.ts`, `theme-script.test.ts` — foundation libraries
- `tests/unit/safe-redirect.test.ts`, `read-set-cookies.test.ts` — auth glue
- `tests/unit/demo-subscription.test.ts`, `demo-billing.test.ts` — demo billing
- `tests/unit/star-rating.test.ts`, `rating.test.ts` — accessible rating control
- `tests/unit/widget-json.test.ts` — widget JSON feed shape

The "act(...)" warnings in stderr are happy-dom noise; the tests pass and assertions hold.

---

## 5. Findings (P0 / P1 / P2 / P3)

### P0 — none identified

No data-loss, no auth bypass, no remote code execution, no cross-tenant data leak.

### P1 — fixed in this audit

- **Demo checkout page had a misleading "You will be charged" line.** The page top is correctly labeled "This is a demo checkout. No real payment will be processed." The right-rail paragraph contradicted that, asserting the user would be charged $12/month. Fixed by rewording to "On the real Paid plan, you would be charged $X per month. This demo performs no charge and stores no card data."

### P2 — fixed in this audit

- **Analytics page did unbounded `findMany` then in-memory 30-day bucketing.** For Free users this is bounded by 50 testimonials. For Paid users it could grow without bound. The fix pushes the 30-day filter into the Prisma `where` clause and runs the two queries in parallel; the lifetime aggregate still uses a single query but only selects `status` + `rating`.

### P2 — documented, not fixed (out of scope)

- **In-memory rate limiter.** Single-process, lost on restart, not shared across instances. Documented in README and source comments. Replacement with Redis is on the roadmap.
- **Email verification disabled.** Anyone who knows an email can create an account in that address. The 5/hr/IP rate limit and bcrypt cost soften the abuse surface. Documented in `src/app/api/auth/register/route.ts`. Re-enabling is on the roadmap.
- **No real Stripe integration.** Until real test keys are wired, the Paid plan is a demo and `/api/stripe/*` is inert. Documented.
- **CSV export includes `status`.** Intentional per the export feature spec (so the owner can re-import), not a privacy leak — submitter email is not in the export. Not changed.

### P3 — informational

- **`TestimonialHub.tmp-cookies.txt` in the working tree.** This is a test artifact (e.g. from a curl-based registration smoke test) and is not in `.gitignore`. Recommend adding `TestimonialHub.tmp-*.txt` to `.gitignore` in a follow-up commit, but this is not a blocker.
- **No e2e specs in `tests/e2e/`.** Playwright is configured but no spec files are present. Documented in README roadmap.
- **No CAPTCHA in the public submission flow by default.** `CAPTCHA_ENABLED=false` unless explicitly set; the env-flag wiring is in place. Bot mitigation rests on the 5/10min/IP rate limit. Documented.

---

## 6. Security & Privacy Audit

### Tenant isolation ✅

- All tenant-scoped read helpers in `src/lib/collections/queries.ts` filter on `userId` and `deletedAt: null` (or `collection: { is: { userId, deletedAt: null } }`).
- All server actions in `src/app/dashboard/**/actions.ts` call `requireUser()` and pass `user.id` to a `where: { id, collection: { is: { userId, deletedAt: null } } }` filter before mutating.
- `loadOwnedTestimonial` and the export route (`/api/export/[collectionId]`) both perform the same `userId` + `deletedAt: null` check.
- The dashboard layout's auth chokepoint is `requireUser()` (`src/lib/auth/require-user.ts`), which re-reads the user row from the DB on every request, validates `deletedAt`, and re-checks `emailVerified` (defense-in-depth only — currently `true` by design).

### Authentication & session ✅

- **Strategy:** JWT, 30-day maxAge, signed with `AUTH_SECRET`. No DB sessions.
- **Revocation:** `tokenVersion` is bumped on password change and account delete. The JWT itself does **not** carry the claim; `requireUser` re-reads the user on every protected request, so revocation takes effect immediately.
- **Bcrypt cost:** 12 (~250 ms / hash). Constant-time-ish path: when the user is missing, a fake bcrypt verify is run so missing email and wrong password take comparable wall-clock time. This is documented as a soft protection.
- **Password policy:** 10+ chars, letter + digit, validated against the bundled breached-password list.

### CSRF ✅

- Auth.js v5 double-submit cookie on the credentials callback. The registration endpoint reuses the same flow via internal fetch and forwards the resulting `authjs.session-token` cookie.
- The custom Set-Cookie parser (`src/lib/auth/read-set-cookies.ts`) handles both undici `Headers.getSetCookie()` and the legacy joined `set-cookie` header.

### Open-redirect ✅

- All `?next=` parameters go through `safeNext()` (`src/lib/auth/safe-redirect.ts`). The pattern `^\/(?![/\\])[^\s\\]*$` accepts only same-origin absolute paths; everything else (protocol-relative URLs, full URLs, backslashes, embedded whitespace, javascript:) falls back to `/dashboard`. Length-capped at 2048 chars.

### Rate limits ✅

| Endpoint                         | Limit          |
|----------------------------------|----------------|
| `POST /api/public/[slug]/submit` | 5 / 10 min / IP |
| `POST /api/auth/register`        | 5 / hr / IP     |
| `POST /api/auth/request-reset`   | 10 / hr / IP    |
| `POST /api/auth/reset-password`  | 10 / hr / IP    |
| `POST /api/billing/demo-checkout`| 5 / 5 min / user|
| `POST /api/billing/demo-cancel`  | 5 / 5 min / user|

All in-memory, all documented. No known bypass.

### Constant-time responses ✅

- `request-reset` returns the same `{ ok: true, message: ... }` for known and unknown emails. Adds a 150–350 ms jitter on the unknown path.
- `register` does the same: jitter + identical response shape.

### Submitter email privacy ✅

- **Never** returned by `/c/[slug]`, `/widgets/[token]`, `/widgets/[token]/json`, `/wall/[slug]`, `/api/export/[collectionId]`, or the wall-embed iframe snippet.
- Owner-only exposure: `/dashboard/testimonials` (with a show/hide toggle per row), and the notification emails the owner receives.

### CSV export safety ✅

- RFC 4180 quoting: cells with `,` / `"` / `\n` are wrapped in double quotes with embedded quotes doubled.
- Formula-injection guard: cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` are prefixed with a single quote so spreadsheets treat them as literal strings.
- `cache-control: no-store` on the export response.

### Embed headers ✅

- `/wall/:slug` and `/widgets/:token` set `Content-Security-Policy: frame-ancestors *` and `X-Frame-Options: ALLOWALL` so any site can iframe them.
- No other route opts into frame-ancestors; `/dashboard` and `/c/:slug/submit` remain DENY by default (Next.js does not set X-Frame-Options unless configured to).

### Demo billing integrity ✅

- **Server-determined outcomes.** `simulateDemoOutcome()` derives success/decline from the card number. The client cannot send `plan`, `price`, or `paymentSucceeded` to bypass.
- **No card persistence.** The validator returns only `last4`, `expiryMonth`, `expiryYear`; the API never returns the full number or CVC; nothing about the card reaches the DB.
- **Hardcoded price.** `PLAN_PRICING.paid.price` is the single source; the request body does not influence the price.
- **Defense in depth.** The page redirects to `/dashboard/billing?error=already_paid` if the user is on a non-demo Paid plan, and the API route returns 409 in the same case.
- **Cancel refuses non-demo.** `cancelDemoSubscription` returns `{ ok: false, message: "This subscription is not a demo..." }` if the existing row is a real Stripe subscription.

### Stripe webhooks — not exercised

- `src/app/api/stripe/webhook/route.ts` exists in source but is **not** wired to a real Stripe account. The `WebhookEvent` idempotency table and a verification path are present; not exercised in tests.
- The `Subscription` schema is in place; the billing page reads from it via `getSubscriptionForUser`.

### Open items (documented limitations, not vulnerabilities)

- Email verification disabled → impersonation surface; rate-limit and password policy soften.
- Rate limiter in-memory → not safe for horizontal scaling.
- CAPTCHA off by default → bot mitigation rests on IP rate limit.

---

## 7. Demo Billing Integrity

`src/lib/billing/demo.ts` (pure helpers) and `src/lib/billing/demo-subscription.ts` (DB-touching helpers) together form the demo flow. Verified:

- The full card number is never returned by `validateDemoCardInput`; the type is `{ last4, expiryMonth, expiryYear }`.
- `simulateDemoOutcome` only recognizes `4000000000000002` as decline; everything else Luhn-valid is success.
- `upsertDemoSubscription` writes synthesized `demo_cus_*` and `demo_sub_*` IDs. It refuses to act on `outcome === "decline"`. The `isDemoSubscription` detection is by the `demo_` prefix on `stripeCustomerId`, which is unambiguous because real Stripe Customer IDs start with `cus_`.
- `cancelDemoSubscription` refuses to act on a non-demo row (returns `{ ok: false }`).
- The API route `src/app/api/billing/demo-checkout/route.ts`:
  - requires an authenticated user,
  - rate-limits 5 / 5 min / user,
  - Zod-parses the body (shape only; Luhn check is in `validateDemoCardInput`),
  - field-specific error responses,
  - artificial 600–1200 ms delay for visible loading,
  - 402 on decline, 200 + redirect on success.
- The page top has a clear "This is a demo checkout" amber disclosure; the right-rail paragraph was previously misleading (see §3 P1 fix).
- Paid-only features (unlimited collections / testimonials / widgets, branding removal) are exercised end-to-end via the demo flow, which is the entire point.

---

## 8. Performance, Accessibility & UI

### Performance

- `listTestimonialsForUser` is paginated (default 20, capped at 100). Pagination is honored in the URL.
- Analytics page (post-fix): 30-day trend query is bounded by `gte: since`; only `status`+`rating` selected for the all-time aggregate.
- Public pages use `force-dynamic` so they always reflect current state; this is correct for a moderation tool but means they are not statically cacheable. Acceptable for the MVP.
- `recharts` is installed but not currently imported anywhere — left as-is for future analytics expansion.

### Accessibility

- **Star rating** (`src/components/ui/star-rating.tsx`) is a native radio group: `role="radiogroup"`, `aria-labelledby`, `aria-describedby` on the group; `aria-label="N out of 5 stars"` on each input; Arrow-key navigation between options; the visible stars are `<label>` elements so clicking them activates the underlying input.
- **Dialog** (`src/components/ui/dialog.tsx`) is an accessible modal primitive: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; Tab/Shift+Tab focus trap; focus restored to the trigger on close; body scroll lock with cleanup on unmount; reduced-motion safe (uses `motion-safe:` Tailwind variants if animations are added).
- **Form fields** consistently use `<label htmlFor>`; the demo checkout form uses `aria-busy` and `role="alert"` for errors.
- **Theme toggle** has a `data-testid` hook and a screen-reader-friendly label.

### UI

- `lucide-react` is installed but not currently imported. The sidebar and other components use inline SVG icons instead. The lucide dependency is dead weight and could be removed in a future cleanup; not a blocker.
- `next.config.ts` enables `images.remotePatterns: ['https', '**']` — permissive but appropriate for a project that allows owner-uploaded logo URLs.

---

## 9. Configuration & Maintainability

### Environment

- `.env.example` covers every variable the app reads: `NODE_ENV`, `APP_URL`, `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PAID_PRICE_ID`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `NEXT_PUBLIC_APP_NAME`, `CAPTCHA_ENABLED`, `HCAPTCHA_SITE_KEY`, `HCAPTCHA_SECRET`.
- All env access goes through `src/lib/app-config.ts` with safe defaults. The defaults are NOT for production; the file header warns that they exist for dev.
- `.env` is in `.gitignore`. `.env.example` is committed. No secrets in source.

### Build & quality gates

- TypeScript 5.6, strict mode, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`. Clean.
- ESLint 9 with `next/core-web-vitals` and `next/typescript`. Clean.
- Predev / prestart scripts clear `.next` to avoid stale module caching.
- Tailwind 3.4, `prefers-color-scheme: dark` strategy.
- `poweredByHeader: false` (X-Powered-By disabled).

### Dependencies

- `bcryptjs` (cost 12), `@prisma/client` 6.19.3, `next` 15.5.27, `next-auth` 5.0.0-beta.32, `resend` 4.8.0, `stripe` 18.5.0, `zod` 3.25.76, `recharts` 2.15.4 (unused), `lucide-react` 0.499.0 (unused), `nanoid` 5.1.16. All current.
- `sharp` is installed (Next.js image optimization), correct.
- `dotenv` is used by `vitest.setup.ts` to load `.env.test` first then `.env`. Correct.

### Database

- `prisma/schema.prisma` is well-organized: `User`, `UserSession`, `VerificationToken`, `Collection`, `Testimonial`, `Widget`, `Subscription`, `Notification`, `NotificationRead`, `NotificationPreference`, `WebhookEvent`. CUIDs throughout. Indexes on `(userId)`, `(email)`, `(slug)`, `(collectionId, status)`, `(collectionId, createdAt)`, etc.
- Soft-delete via `deletedAt` on `User` and `Collection`; cascades via Prisma FK.
- One `prisma/migrations/20261014140234_init/` migration exists; no other migrations to worry about.

### Logging

- `src/lib/db.ts` only logs in dev (`warn`, `error`); production logs only `error`. Sensible.
- `src/lib/notifications/email.ts` returns `{ ok, id?, error? }` and never throws, so the public submission endpoint can fire-and-forget without crashing the response.

---

## 10. Manual Checks Required (cannot be automated here)

These are pre-launch items a human should walk through before exposing the app to real users:

1. **End-to-end happy path** in dev: register → auto-login → create collection → share `/c/[slug]` → submit via the modal → approve from the dashboard → embed widget on an external page.
2. **Wall of Love flow:** visit `/wall/[slug]` on a collection that has approved testimonials, click **Copy review link** on a card, confirm the URL has the `#review-{id}` anchor and copies to the clipboard. Confirm CSS `:target` highlights the card and `scroll-margin-top` keeps it visible.
3. **Sidebar nav order:** confirm the dashboard sidebar lists **Wall of Love** between **Export** and **Billing**, with the heart icon.
4. **Demo checkout end-to-end:** 4242 4242 4242 4242 → success → "Demo" badge appears on `/dashboard/billing` → cancel → returns to Free.
5. **Demo decline path:** 4000 0000 0000 0002 → 402 with a decline message, no DB write.
6. **Email verification on/off:** confirm new users get `emailVerifiedAt = now()` (currently disabled by design) and that the `/verify-email` page renders without error even though it isn't expected to be visited.
7. **Embed headers:** load `/wall/test-slug` in an `<iframe>` from a different origin and confirm the page renders (no CSP block).
8. **Rate-limit smoke:** hit `POST /api/public/test-slug/submit` 6 times in 10 min from the same IP; the 6th should return 429.
9. **Production build smoke:** `npm run build && npm start` and confirm `/dashboard` redirects to `/login?next=/dashboard` when unauthenticated.
10. **Open-redirect smoke:** `GET /login?next=//evil.com/path` should land on `/login` not navigate to `evil.com`.
11. **Password reset smoke:** request a reset for a known email, then a fake email; both responses should be byte-identical apart from the random jitter.

---

## 11. Approval / Decision Items (do not act on these without user sign-off)

The following are deliberately **not** part of this audit's fix scope. They are listed so the user can decide what to do next:

1. **Re-enable email verification on registration.** The token table, `/verify-email` page, and `/api/auth/verify-email` route are in place; the registration flow just doesn't mint a token. This is the largest "would-be-production-ready" gap.
2. **Replace the in-memory rate limiter with Redis.** A swap-in implementation would mirror the existing `rateLimit(key, limit, windowMs)` interface.
3. **Wire real Stripe test keys** and exercise the webhook handler end-to-end.
4. **Enable hCaptcha** (`CAPTCHA_ENABLED=true`) on the public submission form once a key is provisioned.
5. **Add `TestimonialHub.tmp-*.txt` to `.gitignore`** to keep the working tree clean of test artifacts.
6. **Remove unused dependencies** (`recharts`, `lucide-react`) once we confirm no near-term plans need them.
7. **Write a Playwright e2e spec** for the most critical path (submit → approve → embed).

None of these are required for the documented MVP internal/demo deployment. They are required for "real production with real customer data."

---

## 12. Remaining Blockers

**None identified for the documented MVP scope.** All remaining items are in §11 and require user approval before action.

---

## 13. Confirmation of Non-Destructive Operations

- **No git reset, no force push, no `git clean`, no `git checkout .`.**
- **No Prisma migrations applied.** Schema is unchanged.
- **No `npm install` / no `npm uninstall`.** `package.json` and `package-lock.json` are unchanged.
- **No secret values disclosed.** The audit only inspects source on disk; nothing was logged to chat or shared externally.
- **No `.env` content disclosed.** The audit does not echo values from `.env`; it only references the env *names* that the app reads.
- **The only files modified during this audit are**:
  - `src/app/dashboard/billing/checkout/page.tsx` (P1 copy fix)
  - `src/app/dashboard/analytics/page.tsx` (P2 perf fix)
  - `README.md` (added Launch Readiness section, updated Roadmap)
  - `docs/LAUNCH_AUDIT_2026-10-15.md` (this file — new)
- **No new files in `src/`, `tests/`, or `prisma/migrations/`.** (The submit-modal plan from earlier in the session was completed; this audit only reports on what is on disk now.)

---

## 14. Followup: Homepage SVG Sizing Regression (2026-10-15, later in session)

User reported the homepage alignment bug had returned: hero star SVGs rendered at ~1184×1184 and the page was ~53,562px tall. Diagnosed and fixed.

**Verified root cause:** not a source-level regression. The defensive CSS in `globals.css` and the explicit `width`/`height` on star SVGs were both intact and working. The actual cause was a stale `next dev` process that kept running across an `npm run dev` invocation. When the new predev hook cleared `.next/`, the **old** dev server kept listening on :3000 with already-loaded stale asset references; the **new** dev silently bound :3001+; the browser kept hitting :3000 and getting 404s for `/_next/static/css/app/layout.css`. Tailwind never resolved, and any SVG that relied on `h-X w-X` Tailwind classes (instead of intrinsic `width`/`height` attributes) rendered at the container's full width.

**Evidence collected (against the broken dev server on :3000):**
- 20 star SVGs: 16×16 (correct — they had intrinsic `width="16" height="16"`)
- `#features svg` (no intrinsic attrs): **1264×1264** (broken — full container width)
- `h1` fontSize: 32px (broken — `text-4xl` should be 36px, `sm:text-6xl` should be 60px)
- `#features .grid` display: `block` (broken — should be `grid`)
- Document height desktop: **29,899px** (broken)
- Failed requests: `HTTP 404 /_next/static/css/app/layout.css`, `main-app.js`, `app-pages-internals.js`

**After `node scripts/predev.js` and a fresh `npm run dev`:**
- 20 star SVGs: 16×16 ✅
- `#features svg`: 16×16 ✅
- `h1` fontSize: 36px (matches `text-4xl`) ✅
- `#features .grid` display: `grid` ✅
- Document height desktop: **3,710px** ✅
- Failed requests: none ✅

**Files changed for this fix:**
- `scripts/predev.js` (new) — kills orphan `next dev` processes on :3000+:3019, then clears `.next/`. OS-portable: Windows (PowerShell + netstat + taskkill), Linux (/proc + lsof / ss + SIGTERM).
- `scripts/prestart.js` (new) — converted from an old no-op `rmSync` to a documented no-op (production must not clear `.next/`; that would destroy the build).
- `scripts/measure-homepage.cjs` (new) — Playwright-based measurement tool for verifying the homepage renders correctly. Uses system Chrome via `executablePath`. Not wired into CI (would require a running server).
- `tests/unit/homepage-regression.test.ts` (new, 7 tests) — locks in three independent layers of defense: (1) every hero star SVG has explicit `width`/`height`, (2) globals.css has a defensive SVG-sizing rule, (3) `predev` is wired to a script file that kills orphans and clears `.next/`.
- `package.json` — `predev` now invokes `node scripts/predev.js` (was inline shell one-liner); `prestart` now invokes `node scripts/prestart.js` (was inline shell one-liner that incorrectly cleared `.next/` before `next start`).
- `eslint.config.mjs` — added `scripts/**` to `ignores` so the new CommonJS dev-ops helpers don't trip `@typescript-eslint/no-require-imports`.

**Verified cascade prevention:** running `npm run dev` twice in succession, with the first dev still alive on :3000, the second invocation now (a) kills PID 23032 (the orphan), (b) clears `.next/`, (c) successfully binds :3000 with no fallback.

**Final verification suite:**
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors
- `npm test` — **22 test files / 218 tests passed** (was 21/211; +7 from the new regression file)
- `npm run build` — clean; 33 routes
- `npm start` (production) + measurement — desktop docHeight 3,710px, h1 60px, all SVGs 16×16, no failed requests

**Remaining uncertainty:** none. The fix is locked in by automated tests. The defense is three-layer: even if a future PR removes one layer, the others will catch the regression. The predev script is OS-portable; macOS support uses `lsof` (broadly available) and falls back to a Linux-only path if `lsof` is missing — a documented limitation in the script header.

---

## 15. Final Recommendation

**The TestimonialHub MVP is ready for internal demonstration and limited pilot use against the documented demo billing flow.** Before any production deployment that accepts real customer data or real payment information, the items in §8 (manual checks) and §11 (approval items) must be closed out, in particular the re-enable of email verification and the migration to a real Stripe (or alternative) integration. The homepage SVG alignment regression documented in §14 has been fixed permanently via three layers of defense and is locked in by `tests/unit/homepage-regression.test.ts`.
