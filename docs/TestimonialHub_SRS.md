# TestimonialHub
## Software Requirements Specification (SRS)

**Version:** 1.0 — Draft  
**Status:** Initial implementation baseline  
**Project type:** Learning and portfolio project  
**Technology stack:** Laravel, Inertia.js, React, MySQL, Tailwind CSS, Laravel Cashier, Stripe, Pest

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional, non-functional, security, data, integration, and testing requirements for TestimonialHub. It will guide system design, development, verification, and deployment.

### 1.2 Product Scope

TestimonialHub is a web application that enables individuals, freelancers, creators, startups, businesses, and organizations to collect, moderate, manage, and display text testimonials.

Users can create testimonial collections, share public submission links, embed submission forms, approve testimonials before publication, display approved testimonials through public pages and widgets, view basic analytics, export testimonials to CSV, and subscribe to a paid plan.

### 1.3 Intended Audience

- Project owner and developer
- Product reviewers and stakeholders
- Testers and quality assurance contributors
- Portfolio evaluators

### 1.4 Definitions

- **Owner:** Authenticated user who manages collections and testimonials.
- **Collection:** A group of testimonials associated with a unique public slug.
- **Submission:** A testimonial submitted through a public form.
- **Moderation:** Reviewing a testimonial and approving or rejecting it.
- **Widget:** An embeddable component that displays approved testimonials.
- **Tenant isolation:** Ensuring that one account cannot access another account's private resources.
- **Free plan:** Subscription tier with defined resource limits.
- **Paid plan:** Subscription tier with expanded resource allowances.
- **PII:** Personally identifiable information.

### 1.5 Requirement Language

- **MUST:** Mandatory for the specified release.
- **SHOULD:** Recommended unless a documented reason justifies an exception.
- **MAY:** Optional.

---

## 2. Overall Description

### 2.1 Product Perspective

TestimonialHub is a multi-user web application with server-side application logic, a relational database, a React-based interface, email delivery, and Stripe-powered subscription billing.

### 2.2 User Classes

1. **Unauthenticated visitor:** Views public testimonial pages or submits testimonials.
2. **Registered owner:** Manages collections, submissions, settings, exports, and notifications.
3. **Free subscriber:** Uses the product subject to Free plan limits.
4. **Paid subscriber:** Uses expanded resources and can remove TestimonialHub branding.

Administrative and operational access MUST be restricted to authorized personnel and MUST NOT be implemented as unrestricted access to customer accounts.

### 2.3 Operating Environment

- Modern desktop and mobile browsers
- Responsive desktop, tablet, and phone interfaces
- Laravel application server
- MySQL database
- Configured email delivery service
- Stripe Checkout, Customer Portal, and webhooks

### 2.4 Constraints

- Laravel MUST provide the principal backend application framework.
- Inertia.js and React MUST provide the application interface.
- MySQL MUST be the relational database.
- Tailwind CSS MUST be used for styling.
- Laravel Cashier and Stripe MUST manage subscription billing.
- Pest MUST be used for automated testing.
- The application MUST support strict tenant isolation.
- Stripe MUST run in test mode during development and testing.

### 2.5 Explicitly Excluded Features

The initial release excludes video testimonials, bank or third-party testimonial imports, Google sign-in, custom domains, custom CSS, submitter editing, recurring collection campaigns, public testimonial search, public category filtering, public engagement analytics, and bulk testimonial actions.

---

## 3. Functional Requirements

### 3.1 Authentication and Account Management

**FR-AUTH-001:** The system MUST allow users to register using email and password.

**FR-AUTH-002:** _Deferred to a future release._ The system MUST provide email verification. The mechanism is implemented in `src/lib/auth/verification-tokens.ts` and is callable via `/api/auth/verify-email` and the `/verify-email` page, but is not invoked from the registration flow in the current TestimonialHub MVP. `emailVerifiedAt` is set at account creation and is a bookkeeping field, not a proof of email ownership.

**FR-AUTH-003:** _Deferred to a future release._ Users MUST verify their email before accessing collection management functionality. In the current MVP, users access the dashboard immediately after registration. The `requireUser()` chokepoint retains the `redirect("/verify-email")` branch as defense-in-depth so a future re-enable of verification does not require changes to the chokepoint.

**FR-AUTH-004:** The system MUST provide forgotten-password recovery through email.

**FR-AUTH-005:** Authenticated users MUST be able to change their password.

**FR-AUTH-006:** The system MUST enforce authorization on every protected operation.

**FR-AUTH-007:** Users MUST be able to delete their accounts after explicit confirmation.

**FR-AUTH-008:** Account deletion MUST remove the account's public content and associated application data according to the documented deletion and retention policy.

### 3.2 Collection Management

**FR-COL-001:** An owner MUST be able to create multiple testimonial collections within the limits of their plan.

**FR-COL-002:** Each collection MUST have a title, description, unique slug, and configurable presentation settings.

**FR-COL-003:** Collection slugs MUST be unique and MUST reject reserved routes and reserved names.

**FR-COL-004:** The system MUST provide a public collection URL using `/c/{slug}`.

**FR-COL-005:** An owner MUST be able to configure the collection's title, description, color, logo, and light or dark theme.

**FR-COL-006:** Owners MUST be able to manage each collection's moderation separately.

**FR-COL-007:** Collection management operations MUST verify ownership.

**FR-COL-008:** Collection deletion MUST require explicit confirmation and remove the associated public content.

**FR-COL-009:** The system MUST NOT expose private or unapproved testimonials on public collection pages.

### 3.3 Testimonial Submission

**FR-SUB-001:** The system MUST provide a shareable public submission URL for each collection.

**FR-SUB-002:** The system MUST support an embeddable testimonial submission form.

**FR-SUB-003:** A submission MUST contain the submitter's name, email address, testimonial text, and rating.

**FR-SUB-004:** Company and role MUST be optional fields.

**FR-SUB-005:** Ratings MUST be integers from 1 through 5.

**FR-SUB-006:** The system MUST validate submitted data on the server.

**FR-SUB-007:** Every new testimonial MUST initially have the Pending status.

**FR-SUB-008:** Submitting a testimonial MUST NOT automatically publish it.

**FR-SUB-009:** Repeat submissions by the same person MUST be permitted, subject to rate limits and spam controls.

**FR-SUB-010:** The submitter's email address MUST remain private and MUST NOT appear on public pages or widgets.

**FR-SUB-011:** The system MUST implement rate limiting, basic spam detection, and conditional CAPTCHA protection.

**FR-SUB-012:** A successful submission MUST be saved even if subsequent email delivery fails.

### 3.4 Moderation and Testimonial Management

**FR-MOD-001:** Owners MUST be able to view testimonials belonging to their collections.

**FR-MOD-002:** Owners MUST be able to approve Pending testimonials.

**FR-MOD-003:** Owners MUST be able to reject Pending testimonials.

**FR-MOD-004:** Owners MUST be able to delete testimonials.

**FR-MOD-005:** Rejected testimonials MUST remain private and available for re-review until deleted.

**FR-MOD-006:** Only testimonials with the currently Approved status MUST be eligible for public display.

**FR-MOD-007:** Rejected or deleted testimonials MUST NOT remain accessible through public pages or widgets.

**FR-MOD-008:** Moderation operations MUST be authorized and MUST be restricted to the relevant collection owner.

### 3.5 Public Pages and Widgets

**FR-DIS-001:** The system MUST display approved testimonials on public collection pages.

**FR-DIS-002:** The system MUST provide embeddable display widgets using iframe snippets.

**FR-DIS-003:** Widgets MUST support grid and carousel layouts.

**FR-DIS-004:** Public pages and widgets MUST be responsive.

**FR-DIS-005:** Public displays MUST support sorting by newest and highest rating.

**FR-DIS-006:** Public pages and widgets MUST exclude Pending and Rejected testimonials.

**FR-DIS-007:** Free-plan displays MUST include “Powered by TestimonialHub” branding.

**FR-DIS-008:** Paid-plan users MUST be able to remove TestimonialHub branding.

**FR-DIS-009:** Public display endpoints MUST expose only the fields required for displaying approved testimonials.

**FR-DIS-010:** Widgets MUST NOT disclose submitter email addresses, private moderation notes, or other private account information.

### 3.6 Subscription and Resource Limits

**FR-PLAN-001:** The system MUST support Free and Paid subscription plans.

**FR-PLAN-002:** The Free plan MUST allow at most 2 collections.

**FR-PLAN-003:** The Free plan MUST allow at most 50 testimonials across all collections and statuses.

**FR-PLAN-004:** The Free plan MUST allow at most 2 active display widgets.

**FR-PLAN-005:** The Paid plan MUST allow expanded resources without the Free plan's product limits, subject to documented technical safeguards.

**FR-PLAN-006:** Paid subscriptions MUST be purchased through Stripe Checkout.

**FR-PLAN-007:** Users MUST be able to access Stripe Customer Portal for payment methods, invoices, and cancellation.

**FR-PLAN-008:** Stripe webhooks MUST synchronize subscription and payment status with the application.

**FR-PLAN-009:** Subscription webhook processing MUST be authenticated, idempotent, and resilient to retries and out-of-order events.

**FR-PLAN-010:** Cancelling a Paid subscription MUST preserve Paid benefits until the current paid period ends.

**FR-PLAN-011:** A failed payment MUST initiate a seven-day grace period.

**FR-PLAN-012:** If the payment remains unresolved after the grace period, the account MUST be downgraded to Free.

**FR-PLAN-013:** Downgrading MUST NOT automatically delete collections, testimonials, or widgets.

**FR-PLAN-014:** When existing resources exceed Free plan limits, the system MUST preserve existing resources and prevent creation of additional resources of the relevant limited type until the account is within the applicable limit.

**FR-PLAN-015:** The application MUST NOT trust client-provided subscription status or price information as proof of payment.

**FR-PLAN-016:** Subscription prices, currency, billing intervals, tax treatment, trial policy, refunds, and proration MUST be configurable or explicitly documented before production launch.

### 3.7 Email and Notifications

**FR-NOT-001:** The system MUST email the owner when a new testimonial is submitted.

**FR-NOT-002:** The system MUST send a confirmation email to the submitter.

**FR-NOT-003:** The system MUST provide in-app notifications for important events.

**FR-NOT-004:** The system MUST provide email notifications for important events.

**FR-NOT-005:** Users MAY disable non-essential email notifications.

**FR-NOT-006:** Essential account-security and billing communications MUST NOT be disabled by non-essential notification preferences.

**FR-NOT-007:** Transient email failures SHOULD be retried.

**FR-NOT-008:** Email delivery failures MUST NOT roll back an already saved testimonial.

**FR-NOT-009:** Notification processing SHOULD use queued jobs so that slow email delivery does not unnecessarily delay user-facing operations.

### 3.8 Analytics

**FR-ANA-001:** Owners MUST be able to view total testimonial counts.

**FR-ANA-002:** Owners MUST be able to view counts grouped by moderation status.

**FR-ANA-003:** Owners MUST be able to view testimonial submission trends over time.

**FR-ANA-004:** Analytics MUST be restricted to the owner's authorized resources.

**FR-ANA-005:** Public page views, widget impressions, clicks, and conversions are outside the initial release.

### 3.9 CSV Export

**FR-EXP-001:** Owners MUST be able to export testimonials belonging to their collections as CSV.

**FR-EXP-002:** CSV exports MUST include testimonial content, submitter name, company, role, rating, status, and submission date.

**FR-EXP-003:** CSV export operations MUST enforce authentication and collection ownership.

**FR-EXP-004:** Export generation MUST prevent spreadsheet formula injection.

**FR-EXP-005:** Exports MUST NOT include unnecessary sensitive fields, particularly submitter email addresses.

### 3.10 Search and Filtering

**FR-SEARCH-001:** Owners MUST be able to search testimonials by description or testimonial text.

**FR-SEARCH-002:** Owners MUST be able to filter testimonials by date range, collection, and moderation status where applicable.

**FR-SEARCH-003:** Public testimonial search and public category filtering MUST NOT be provided in the initial release.

### 3.11 Privacy and Data Deletion

**FR-PRIV-001:** The system MUST display a privacy notice explaining data collection and use.

**FR-PRIV-002:** The system MUST NOT sell personal data.

**FR-PRIV-003:** Personal data MUST NOT be shared except with service providers necessary to operate the product and as explained in the privacy notice.

**FR-PRIV-004:** Account and collection deletion MUST require explicit confirmation.

**FR-PRIV-005:** Deleted content MUST be removed from public pages and widgets.

**FR-PRIV-006:** Backup retention, application log retention, and deletion behavior MUST be documented before production deployment.

---

## 4. Data Requirements

### 4.1 Core Entities

The system SHOULD include the following entities, with exact names and relationships finalized during database design:

- **User:** Account identity, authentication details, verification state, and account settings.
- **Collection:** Owner, title, description, slug, branding settings, and timestamps.
- **Testimonial:** Collection, submitter name, private email, company, role, text, rating, status, and timestamps.
- **Widget:** Collection, layout, configuration, active state, and timestamps.
- **Subscription:** User, billing provider identifiers, plan, status, billing period, and relevant timestamps.
- **Notification:** Recipient, event type, content or reference, read state, and timestamp.
- **NotificationPreference:** User preferences for non-essential email communications.
- **WebhookEvent or ProcessingRecord:** Stripe event identifier, processing status, and relevant metadata for idempotent handling.

### 4.2 Data Integrity

**DR-001:** Every collection MUST belong to one owner.

**DR-002:** Every testimonial MUST belong to one collection.

**DR-003:** Every widget MUST belong to an authorized collection.

**DR-004:** Foreign-key constraints SHOULD protect relational integrity.

**DR-005:** Collection slugs MUST be unique according to the chosen database collation and routing policy.

**DR-006:** Ratings MUST be constrained to values from 1 through 5.

**DR-007:** Moderation statuses MUST use a controlled set of values.

**DR-008:** All timestamps MUST use a consistent storage convention; user-facing dates MUST use a documented display timezone policy.

**DR-009:** Database migrations MUST be version-controlled.

### 4.3 Suggested Status Values

- `pending`
- `approved`
- `rejected`

Subscription states MUST distinguish the application entitlement from raw payment-provider events and support the agreed grace-period and cancellation rules.

### 4.4 Sensitive Data

The application MUST restrict access to authentication credentials, submitter email addresses, billing identifiers, private notifications, and moderation data. Passwords MUST be stored using secure password hashing mechanisms supplied by the framework.

---

## 5. External Interface Requirements

### 5.1 User Interface

**UI-001:** The interface MUST use responsive layouts for desktop, tablet, and mobile devices.

**UI-002:** Forms MUST provide understandable validation messages.

**UI-003:** Destructive actions MUST require explicit confirmation where specified.

**UI-004:** Moderation states and subscription states MUST be clearly distinguishable.

**UI-005:** Keyboard accessibility and semantic HTML SHOULD be incorporated throughout the application.

### 5.2 Email Interface

**EXT-EMAIL-001:** The system MUST integrate with a configured email service.

**EXT-EMAIL-002:** Email configuration MUST be provided through environment-specific configuration rather than hard-coded credentials.

**EXT-EMAIL-003:** Delivery failures SHOULD be logged without exposing message contents or sensitive personal information unnecessarily.

### 5.3 Stripe Interface

**EXT-STRIPE-001:** The application MUST use Stripe Checkout for new Paid subscriptions.

**EXT-STRIPE-002:** The application MUST provide access to Stripe Customer Portal.

**EXT-STRIPE-003:** Webhook signatures MUST be verified before accepting webhook events.

**EXT-STRIPE-004:** Duplicate webhook deliveries MUST