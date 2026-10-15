# TestimonialHub
## PRD Delta — Decisions Log (Round 1–3)

**Version:** 1.0 — Companion to PRD v1.0 and SRS v1.0
**Status:** Decisions locked; awaiting merge into next PRD/SRS revision
**Date:** 14 October 2026
**Source:** `grill-me` sessions Round 1 (Q1–Q10), Round 2 (Q11–Q18), Round 3 (Q19–Q26)
**Scope:** This document records requirements added or sharpened by the grill process. The original `TestimonialHub_PRD.md` and `TestimonialHub_SRS.md` remain the authoritative baseline; future revisions should merge these requirements in place and retire this delta.

---

## How to use this document

Each entry below names the requirement ID, its source (PRD §13 open decision, FR gap, or design ambiguity), the locked decision, and the implementation hook. Treat each as a binding addition to the SRS once you merge this delta.

When you revise PRD v1.1 / SRS v1.1, copy the body of each requirement into the matching section of the SRS and remove the row from this file. Do not silently drop a row — the decision log is the audit trail.

---

## Round 1 — Foundation decisions

### FR-SUB-013 — Free-plan testimonial ceiling behavior

- **Source:** PRD §13 #12 (explicitly unresolved); FR-PLAN-003 silent on what happens at 51.
- **Decision:** When a Free account reaches 50 testimonials (any status, any collection), the public collection page remains visible and continues to display approved testimonials. The submission form is hidden on `/c/{slug}`. `POST /c/{slug}` returns HTTP **410 Gone** with a plain-text body and a `Retry-After`-style hint pointing to the upgrade page. No rows are buffered, no hidden state, no quota flag on the testimonial row.
- **Implementation hook:** `PlanService::canAcceptSubmission(User $u): bool` returns `false` at or above cap; the controller returns `response()->noContent(410)` and the Inertia page hides the form via shared prop `accepting_submissions: false`.

### FR-SUB-014 — Embeddable submission form

- **Source:** FR-SUB-001/002 ambiguous on whether the embeddable form is a separate route or the same route.
- **Decision:** One public endpoint at `/c/{slug}` serves both the full page and the embeddable form. The page detects `?embed=1` (or a request with `Sec-Fetch-Dest: iframe` and no `Sec-Fetch-Mode: navigate`) and returns a stripped Inertia response with no nav, no footer, and the submission form only. No unguessable token; the slug is the public handle, and rate limits are per IP.
- **Implementation hook:** `InertiaResponse` shared prop `is_embed: bool`; controller branch in `PublicCollectionController@show` and `@store`.

### FR-COL-010 — Slug format and collation

- **Source:** FR-COL-002/003 silent on length, characters, and collation.
- **Decision:** Slugs match the regex `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (3–40 characters, lowercase alphanumeric and dash, no leading or trailing dash, no consecutive dashes). The `collections.slug` column is `UNIQUE` under the `utf8mb4_0900_ai_ci` collation (case-insensitive uniqueness, matching user expectations).
- **Implementation hook:** `FormRequest` rule `'regex:/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/'`; migration `$table->string('slug', 40)->unique()` with explicit collation.

### FR-COL-011 — Logo upload constraints

- **Source:** FR-COL-005 silent on mime, size, and storage.
- **Decision:** Logo uploads accept JPG, PNG, or WebP; raw size ≤ 1 MB; pixel dimensions ≤ 1024×1024. Files are auto-oriented and down-scaled server-side using `intervention/image-laravel` (Laravel 11 bundle). Stored on the default `public` disk at `collections/{id}/logo.{ext}`. Served via Laravel's asset cache with a 30-day `Cache-Control: public, max-age=2592000`.
- **Implementation hook:** `CollectionLogoUploadRequest` + `Intervention\Image\Laravel\Facades\Image`.

### FR-DIS-011 — Widget cardinality

- **Source:** FR-PLAN-004 (Free cap of 2 widgets) and FR-DIS-002 silent on how many widgets one collection can have.
- **Decision:** A single collection may have many widgets (e.g., one grid for the marketing site, one carousel for the docs site). The Free plan cap of 2 widgets is **global per account**, not per collection.
- **Implementation hook:** `PlanService::canCreateWidget(User $u): bool` counts `widgets WHERE user_id = u.id AND active = 1`.

### FR-PLAN-013/014 clarification — Downgrade semantics

- **Source:** PRD §7.3 ambiguous on whether editing existing over-cap resources is allowed.
- **Decision:** During a downgrade (Paid → Free) the user retains every existing collection, testimonial, and widget. The system permits **edits** to over-cap resources (slug changes, color tweaks, testimonial status flips) and **deletes** at any time. The system permits **creates** of a limited resource only when the user's current count of that resource is strictly below the Free cap. After deleting down to the cap, the user may create again. Branding ("Powered by TestimonialHub") is restored on the next public request.
- **Implementation hook:** `PlanService::canCreate*(User $u)` checks current count < cap; no flag on the resource row.

### Tenant model (single-user-per-account)

- **Source:** PRD §6 "Account Owner" (singular) vs PRD §3.1 "multi-tenant" terminology.
- **Decision:** One `User` per account. No `Workspace` table, no invitations, no in-account roles. "Tenant isolation" in the SRS means `WHERE user_id = ?` on every owned-resource query. If workspaces are added in a later release, this decision is preserved as a workspace with a single owner.
- **Implementation hook:** `Collection.user_id`, `Testimonial.collection.user_id` reachability, `Widget.user_id` direct FK for plan-limit counting.

### Reserved slugs

- **Source:** FR-COL-003 requires reserved-slug rejection but enumerates none.
- **Decision:** The reserved-slug list lives in `config/testimonialhub.php` as a static array. The minimum seed list: `admin`, `api`, `app`, `auth`, `billing`, `c`, `dashboard`, `docs`, `help`, `legal`, `login`, `logout`, `pricing`, `privacy`, `register`, `settings`, `signup`, `storage`, `support`, `terms`, `test`, `testimonialhub`, `widgets`. Add new entries as the route table grows; the array is the single source of truth.
- **Implementation hook:** `Collection::isReserved(string $slug): bool` static method; called from the `FormRequest` rule and from the auto-suggested-slug generator.

### Reserved brand words

- **Source:** Brand-name protection (PRD §13 #1).
- **Decision:** `testimonialhub` and obvious brand variants (`testimonials-hub`, `testimonial-hub`, `testimonialshub`) are reserved and cannot be used as collection slugs or as a substring in the first 12 characters of any slug.
- **Implementation hook:** `Collection::isReserved()` extended list.

### Email provider

- **Source:** PRD §13 #4, EXT-EMAIL-001.
- **Decision:** Local development uses `MAIL_MAILER=log` (writes to `storage/logs/laravel.log`). Production uses **Mailgun** over SMTP, configured entirely via `.env` (`MAIL_MAILER=mailgun`, `MAILGUN_DOMAIN`, `MAILGUN_SECRET`, `MAILGUN_ENDPOINT`). Postmark and Resend are acceptable substitutes and require only a driver swap.
- **Implementation hook:** `.env.example` documents all keys; `config/mail.php` driver set from env.

### CAPTCHA provider

- **Source:** PRD §13 #5, FR-SUB-011.
- **Decision:** **Cloudflare Turnstile** (free, privacy-friendly, no third-party cookies). Site key and secret key live in `.env` (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`). CAPTCHA is conditionally required after 3 submissions from the same IP within an hour, or always when the request lacks a normal `Accept-Language` header. Server-side verification on every submission once triggered.
- **Implementation hook:** `TurnstileService::verify(string $token, string $ip): bool`; integrated in `PublicCollectionController@store` after the rate-limit check.

### Grace-period clock and recovery

- **Source:** FR-PLAN-011/012, PRD §13 #11.
- **Decision:** The 7-day grace clock starts at the first `invoice.payment_failed` webhook for the subscription. The subscription's `state` becomes `graced`. Any successful `invoice.payment_succeeded` during the grace window resets `state` to `active` and cancels the pending `DowngradeToFreeJob`. The scheduler runs `DowngradeToFreeJob` after 7 days elapsed since `state=graced`; on execution the subscription transitions to `expired` (or `free` for never-paid) and branding is restored.
- **Implementation hook:** `StripeWebhookController` updates `state` and dispatches/cancels the delayed job; `App\Console\Kernel` schedules `subscriptions:check-grace` to run hourly.

### Widget runtime security

- **Source:** FR-DIS-002/009/010 silent on embed origin, CORS, and sandbox.
- **Decision:** Widget HTML is served from the same Laravel origin at `/widgets/{token}`. The response carries `Content-Security-Policy: frame-ancestors *` (allow embedding on any site). The JSON endpoint `/widgets/{token}.json` returns `Access-Control-Allow-Origin: *` and `Cache-Control: public, max-age=60, must-revalidate` (see FR-DIS-013). The iframe element uses `sandbox="allow-scripts allow-same-origin"`. The token is a 32-character URL-safe base64 string (`Str::random(32)` is base62 — pad or hash to 32 chars of the 64-char alphabet).
- **Implementation hook:** `WidgetController@embed` and `@json`; `config/cors.php` allowlist for the JSON path; `resources/views/widgets/embed.blade.php` sets `sandbox` on the iframe.

### CSV formula-injection scope

- **Source:** FR-EXP-004.
- **Decision:** Every CSV cell whose first character is one of `=`, `+`, `-`, `@`, `\t`, or `\r` is prefixed with a single quote `'` before write. Applied to all string columns and to the rating-as-text export. The mitigation follows OWASP's CSV Injection guidance.
- **Implementation hook:** `App\Support\CsvExporter::sanitizeCell(mixed $value): string`.

### Account deletion tombstone

- **Source:** FR-AUTH-008, FR-PRIV-005/006.
- **Decision:** Account deletion is a hard purge of the user's collections, testimonials, widgets, notifications, and notification preferences. The `users` row is soft-kept with `deleted_tombstone_until = NOW() + 30 days` and `stripe_id` retained for webhook reconciliation. The `webhook_events` and `jobs` records are purged. A best-effort "your account was deleted" email is queued before the user row is purged. After 30 days a scheduled `users:purge-tombstones` artisan command removes the row entirely.
- **Implementation hook:** `AccountDeletionService`; `App\Console\Kernel` schedules the daily purge.

### Password policy

- **Source:** PRD §13 #6.
- **Decision:** Passwords are at least 10 characters, must contain at least one letter and at least one digit, and must not appear in a top-100k breached-passwords list checked locally as a hash set (no third-party calls). No character-class composition requirements beyond the two above (NIST 800-63B spirit).
- **Implementation hook:** `App\Rules\StrongPassword` rule composed of length + composition + breach-list; `App\Support\BreachedPasswordSet` loaded from a committed file at app boot.

### Widget config JSON shape

- **Source:** FR-DIS-003 silent on configurable fields.
- **Decision:** A widget's `config` column holds JSON with the shape `{"layout": "grid"|"carousel", "theme": "inherit"|"light"|"dark", "accent_color": "#hex"|null, "max_items": 3..50, "sort": "newest"|"rating"}`. All keys are optional; missing keys fall back to the parent collection's branding. `max_items` is clamped to [3, 50]. `accent_color` must match `^#[0-9a-fA-F]{6}$` or be `null`.
- **Implementation hook:** `App\ValueObjects\WidgetConfig` value object; cast on the Eloquent model.

### Essential vs non-essential notification events

- **Source:** FR-NOT-005/006.
- **Decision:**
  - **Always-on (essential, no opt-out):** `auth.email_verification` (reserved — not currently dispatched in the MVP; see §5.1 of the PRD for the no-verification MVP note), `auth.password_reset`, `auth.account_deleted`, `auth.security_alert`, `billing.payment_succeeded`, `billing.payment_failed`, `billing.grace_period_started`, `billing.subscription_canceled`, `billing.subscription_expired`.
  - **Opt-out per event (non-essential):** `testimonial.new_submission_owner` (FR-NOT-001), `testimonial.approved_submission_submitter` (FR-NOT-002), `product.weekly_digest` (future), `product.feature_announcement` (future).
- **Implementation hook:** `App\Models\NotificationPreference::ESSENTIAL` const array; the notification dispatch helper checks it before honoring the user's opt-out.

### Email-failure isolation boundary

- **Source:** FR-SUB-012, FR-NOT-008.
- **Decision:** The submission controller wraps the testimonial row insert in a `DB::transaction` and dispatches the notification job on the queue **after commit**. Every notification job wraps its mail send in `try { ... } catch (Throwable $e) { Log::error(...); return; }` — failures are logged, never thrown. A failed job is retried per Laravel's `tries`/`backoff` config.
- **Implementation hook:** All `Mailable` calls are `->queue()`-style; jobs in `app/Jobs` extend a base `QuietFailingJob` that swallows after logging.

---

## Round 3 — State machine, retention, and operational details

### Subscription state machine

- **Source:** SRS §4.3 "distinguish application entitlement from raw payment-provider events."
- **Decision:** The `subscriptions.state` column holds one of: `free`, `active`, `past_due`, `graced`, `cancelled`, `expired`. State transitions:

  | From | Event | To |
  |---|---|---|
  | (none) | User registers | `free` |
  | `free` | Stripe `customer.subscription.created` | `active` |
  | `active` | `invoice.payment_failed` (first) | `graced` |
  | `graced` | `invoice.payment_succeeded` | `active` |
  | `graced` | Scheduler after 7 days | `expired` |
  | `active` | User cancels at period end | `cancelled` (Paid until `ends_at`) |
  | `cancelled` | Scheduler at `ends_at` | `expired` |
  | `active` / `cancelled` | Stripe flips to `past_due` | `past_due` (defensive; `graced` already set) |
  | `expired` | User re-subscribes | `active` |
  | any | Account deleted | row purged |

  `PlanService::effectiveState(User $u)` returns the user-facing entitlement (`active` covers `active` and `cancelled`-while-still-paid; `free` covers `free`, `expired`, and `graced`-after-clock-elapsed).
- **Implementation hook:** `App\Domain\Subscription\StateMachine::transition(Subscription $s, Event $e)`.

### `webhook_events` retention

- **Source:** FR-PLAN-009 (idempotency over Stripe's 30-day replay window), FR-PRIV-006.
- **Decision:** Rows in `webhook_events` are retained for 30 days. A daily `stripe:purge-webhook-events` artisan command deletes rows where `received_at < NOW() - 30 days` and writes a count to the log. No PII beyond the Stripe customer id is stored in this table.
- **Implementation hook:** `app/Console/Commands/PurgeStripeWebhookEvents.php`; schedule at 03:00 daily.

### Rate-limit thresholds

- **Source:** FR-SUB-011 silent on numbers.
- **Decision:** Concrete thresholds:
  - `auth/login`, `auth/register`: **5 attempts/min per email+IP** and **3/hr per IP** (registration)
  - `auth/forgot-password`: **3/hr per email**
  - `public/submit` (`POST /c/{slug}`): **30/hr per IP**
  - `widget/json` (`GET /widgets/{token}.json`): **600/hr per token** (10/min; generous for cached public sites)
- **Implementation hook:** Named rate limiters in `app/Providers/RouteServiceProvider.php`; `RateLimiter::for(...)` definitions.

### Legal documents

- **Source:** FR-PRIV-001.
- **Decision:** The privacy notice and terms of service are markdown files in `resources/views/legal/{privacy,terms}.blade.md`, versioned in git, rendered with `Str::markdown` at runtime. No admin edit UI in MVP. The privacy notice references the 30-day tombstone policy and the third-party providers in use (Stripe, Cloudflare Turnstile, Mailgun).
- **Implementation hook:** `LegalController@show`; routes `GET /privacy` and `GET /terms`.

### Widget JSON caching

- **Source:** FR-MOD-007 ("rejected or deleted MUST NOT remain accessible"); FR-DIS-002.
- **Decision:** `GET /widgets/{token}.json` returns `Cache-Control: public, max-age=60, must-revalidate` and an `ETag` derived from `MAX(testimonials.updated_at) WHERE collection_id = ? AND status = approved`. Every moderation action (`approve`, `reject`, `destroy`) calls `Cache::forget("widget.{$token}")` for every widget of the affected collection, in the same DB transaction. 60 seconds is the freshness contract tested in `WidgetJsonFreshnessTest`.
- **Implementation hook:** `App\Support\WidgetCache::forgetCollection(Collection $c)`; called from `TestimonialController@approve|reject|destroy`.

### Widget token generation

- **Source:** FR-DIS-002 requires unguessable tokens.
- **Decision:** Tokens are 32 characters from the URL-safe base64 alphabet (`A-Za-z0-9_-`). Generated as `Str::random(32)` then re-encoded if necessary, or directly via `Str::random(48)` truncated to 32 from the 62-char alphabet. Insert retries up to 3 times on `QueryException` (unique violation). After 3 collisions the model throws and the controller returns 500 with a logged error — collisions at this rate are astronomically improbable and indicate a generator bug.
- **Implementation hook:** `App\Models\Widget::boot()`; `creating` hook generates the token; insert retry in `WidgetController@store`.

### Embed detection

- **Source:** FR-SUB-014.
- **Decision:** The controller detects embed mode by either an explicit `?embed=1` query parameter **or** a request with `Sec-Fetch-Dest: iframe` and `Sec-Fetch-Mode` not equal to `navigate`. In embed mode the Inertia response omits the global layout, nav, and footer; the form is the only interactive content.
- **Implementation hook:** `PublicCollectionController::isEmbed(Request $r): bool`; `HandleInertiaRequests` middleware shares the flag to all components.

---

## Decision audit table (all 26 in one place)

| ID | Decision | Implementation hook |
|---|---|---|
| Q1 | Brand = "TestimonialHub" | `config/app.php`, blade partials |
| Q2 | Free 50 cap → **pause** submissions (410) | `PlanService::canAcceptSubmission` |
| Q3 | Single-user-per-account | direct `user_id` FKs |
| Q4 | Reserved slugs in `config/testimonialhub.php` | `Collection::isReserved()` |
| Q5 | Mail: `log` dev / Mailgun prod | `.env.example` |
| Q6 | Cloudflare Turnstile conditional | `TurnstileService` |
| Q7 | Grace clock = first `payment_failed`; success resets | `StripeWebhookController` |
| Q8 | Edits/deletes always; creates only when below cap | `PlanService::canCreate*` |
| Q9 | Many widgets per collection; Free cap global | `PlanService::canCreateWidget` |
| Q10 | Collection delete = hard-cascade | `ON DELETE CASCADE` + controller |
| Q11 | Widget HTML same-origin; CSP `frame-ancestors *`; CORS `*`; sandbox | `WidgetController@embed/@json` |
| Q12 | CSV formula-injection guard on `= + - @ \t \r` | `CsvExporter::sanitizeCell` |
| Q13 | Commit-then-dispatch + `try/catch` in every job | `QuietFailingJob` base class |
| Q14 | Account delete = hard purge + 30-day tombstone + retain `stripe_id` | `AccountDeletionService` |
| Q15 | Slug regex + `utf8mb4_0900_ai_ci` | migration + `FormRequest` |
| Q16 | Password: 10+ chars, letter+digit, breached-list | `StrongPassword` rule |
| Q17 | Widget config `{layout,theme,accent_color,max_items,sort}` | `WidgetConfig` value object |
| Q18 | Always-on vs opt-out split | `NotificationPreference::ESSENTIAL` const |
| Q19 | Subscription states: free/active/past_due/graced/cancelled/expired | `SubscriptionStateMachine` |
| Q20 | Logo: JPG/PNG/WebP, ≤ 1 MB, ≤ 1024², `public` disk | `intervention/image-laravel` |
| Q21 | `webhook_events` 30-day retention, daily purge | `PurgeStripeWebhookEvents` command |
| Q22 | One endpoint `/c/{slug}`; `?embed=1` strips chrome | `PublicCollectionController` |
| Q23 | Widget token: 32-char URL-safe, 3× retry on collision | `Widget::boot()` |
| Q24 | Rate limits: auth 5/min, register 3/hr, reset 3/hr, submit 30/hr, widget 600/hr | `RouteServiceProvider` |
| Q25 | Privacy/terms = markdown in `resources/views/legal/*.blade.md` | `LegalController@show` |
| Q26 | Widget JSON: 60s cache + ETag; moderate-flushes-cache | `WidgetCache::forgetCollection` |

---

## Next steps for the project owner

1. Read this delta. Confirm or contest any of the 26 entries. This is the last chance to revise before code.
2. Once confirmed, fold the requirements above into SRS v1.1 in place and retire this file.
3. Then move into Stage 1 (install Herd + MySQL) and Stage 2 (Laravel scaffold), with a non-destructive dry-run first.

The original `TestimonialHub_PRD.md` and `TestimonialHub_SRS.md` are unchanged. This file is the only addition.
