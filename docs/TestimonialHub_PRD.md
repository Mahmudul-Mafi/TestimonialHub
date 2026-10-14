# TestimonialHub
## Product Requirements Document (PRD)

**Version:** 1.0 — Draft for Review  
**Status:** Product discovery complete; requirements baseline consolidated  
**Date:** 14 October 2026  
**Primary objective:** Learning and portfolio project  
**Requirements baseline:** REQ-001–REQ-045

---

## 1. Executive Summary

TestimonialHub is a multi-tenant web application that enables individuals and organizations to collect text testimonials, review submissions, and publish approved testimonials on public collection pages or embedded widgets.

The product follows a freemium business model with Free and Paid plans. Paid subscriptions will be implemented using Stripe and Laravel Cashier, with Stripe test mode used throughout development and testing.

The primary goal of the first release is to build a working, well-tested learning and portfolio project demonstrating Laravel, Inertia.js with React, MySQL, Tailwind CSS, authentication, authorization, subscription billing, secure data handling, automated testing with Pest, and deployment.

New testimonials remain private until the collection owner explicitly approves them. Public pages and widgets must display only currently approved testimonials.

## 2. Product Vision

Make it easy for individuals and organizations to collect trustworthy written testimonials and display approved customer feedback without having to develop their own testimonial management system.

## 3. Product Goals

### 3.1 Primary Goals

1. Deliver a functional end-to-end testimonial collection and moderation workflow.
2. Demonstrate secure multi-tenant application architecture.
3. Support multiple collections per account.
4. Publish approved testimonials through public pages and responsive embedded widgets.
5. Implement Free and Paid subscriptions with server-side quota enforcement.
6. Integrate Stripe billing through Laravel Cashier.
7. Demonstrate automated testing with Pest.
8. Produce a maintainable, documented, deployable portfolio project.

### 3.2 Success Criteria

The MVP should meet the following criteria:

- A user can register, verify their email, sign in, and create a collection.
- A visitor can submit a testimonial without creating an account.
- New submissions remain private until approved.
- Owners can approve, reject, and delete testimonials.
- Public pages and widgets display only currently approved testimonials.
- Users cannot access another account's private data.
- Free-plan quotas cannot be bypassed through direct HTTP requests.
- Stripe test-mode subscription, cancellation, and failed-payment workflows are tested.
- Email failures do not undo successful business operations.
- Critical security and business rules have automated tests.
- The project includes setup, testing, and deployment documentation.

These are project-completion criteria, not commercial launch or revenue targets.

## 4. Target Users

TestimonialHub is open to anyone who wants to collect testimonials, including:

- Freelancers and independent professionals.
- Content creators and personal brands.
- Startups and established businesses.
- Product and service providers.
- Individuals and organizations collecting feedback about their work.

The MVP will not restrict registration based on profession, industry, or organization type.

## 5. User Roles

### 5.1 Account Owner

An authenticated, email-verified user who can manage their own collections, testimonials, widgets, branding, notifications, exports, and subscription.

### 5.2 Submitter

A visitor who submits a testimonial through a public collection URL or embedded submission form. A submitter does not need an account and cannot edit a testimonial after submission.

### 5.3 Public Visitor

A person who views public collection pages or embedded widgets. Visitors can sort approved testimonials by newest first or highest rating.

### 5.4 System Services

Background jobs and integrations responsible for email delivery, CAPTCHA verification, Stripe webhooks, notification retries, and subscription synchronization.

## 6. MVP Scope

### 6.1 Included Features

**Authentication and account management**
- Email/password registration, login, and logout.
- Email verification before dashboard and collection management access.
- Password recovery through secure email links.
- Account settings and account deletion.

**Collection management**
- Multiple collections per account.
- Create, view, edit, and delete collections.
- Unique, owner-chosen public slugs.
- Collection title, description, logo, brand color, and light/dark theme.
- Collection-specific testimonial moderation.

**Testimonial collection**
- Public shareable submission URLs.
- Embeddable testimonial submission forms.
- Required customer name, customer email, testimonial text, and 1–5 star rating.
- Optional company or role.
- Manual submission only; no recurring collection requests.
- Repeat submissions allowed.
- Server-side validation, rate limiting, and conditional CAPTCHA.

**Moderation**
- Pending, Approved, and Rejected statuses.
- Individual approve, reject, and delete actions.
- Rejected testimonials retained privately for possible re-review.
- Only approved testimonials eligible for public display.

**Public display**
- Public testimonial collection pages.
- Grid and carousel display widgets.
- Copy-and-paste iframe embed snippets.
- Responsive desktop, tablet, and mobile layouts.
- Sorting by newest first or highest rating.
- Free-plan platform branding and Paid-plan branding removal.

**Dashboard and reporting**
- Dashboard overview.
- Collection and widget management.
- Testimonial table with status filters and pagination.
- Total testimonials and status counts.
- Submission trends over time.
- CSV testimonial export.

**Notifications**
- In-app notifications.
- Email notifications for new submissions and important subscription/payment events.
- Submitter receipt confirmation.
- User preferences for non-essential notification emails.
- Retryable email delivery where appropriate.

**Billing**
- Free and Paid plans.
- Stripe Checkout and Laravel Cashier.
- Stripe Customer Portal.
- Subscription cancellation at the end of the paid period.
- Seven-day failed-payment grace period.
- Server-side entitlement and quota enforcement.
- Preservation of existing resources after downgrade.

**Privacy and security**
- Account-level data isolation.
- Secure submitter-email handling.
- Privacy notice.
- Account and collection deletion.
- Appropriate backup and operational-log retention practices.
- Automated tests for important security and privacy rules.

### 6.2 Excluded Features

The following are out of scope for the initial release:

- Video testimonials and video recording/uploads.
- Google sign-in.
- Submitter editing after submission.
- Recurring testimonial collection requests.
- Public keyword search and category filters.
- Public page-view, widget-impression, click, and conversion analytics.
- Custom CSS editor.
- Custom domains.
- Bulk moderation actions.
- Customizable data-retention settings.
- Automatic deletion of resources after a plan downgrade.
- One-testimonial-per-email restrictions.

## 7. Subscription Plans

### 7.1 Free Plan

- Maximum of 2 collections per account.
- Maximum of 50 total testimonials per account across all collections and statuses.
- Maximum of 2 active display widgets per account.
- Public pages and widgets display “Powered by TestimonialHub.”
- Users can remove resources voluntarily.

### 7.2 Paid Plan

- Unlimited collections, subject to reasonable technical and abuse safeguards.
- Unlimited testimonials, subject to reasonable technical and abuse safeguards.
- Unlimited active display widgets, subject to reasonable technical and abuse safeguards.
- Ability to remove “Powered by TestimonialHub” branding.
- Subscription management through Stripe.

Paid pricing, currency, billing intervals, trial policy, tax treatment, refund policy, and proration remain open configuration decisions.

### 7.3 Downgrade Rules

When an account transitions from Paid to Free:

1. Existing collections, testimonials, and widgets are retained.
2. Resources are never automatically deleted because of the downgrade.
3. Creation of additional limited resources is blocked while usage is at or above the applicable Free limit.
4. Users can voluntarily delete resources to return within the Free limits.
5. Free-plan branding is restored when Paid benefits end.

## 8. Core User Journeys

### 8.1 Owner Onboarding

1. User registers with email and password.
2. System sends a verification email.
3. User verifies the email address.
4. User accesses the dashboard.
5. User creates a collection.
6. User configures the collection's title, description, slug, and branding.
7. User shares the public submission URL or embeds the submission form.
8. User receives notifications when testimonials are submitted.

### 8.2 Submit a Testimonial

1. Visitor opens a collection submission page or embedded submission form.
2. Visitor enters the required fields and optional company/role.
3. Server validates the submission and applies rate limits and CAPTCHA checks when required.
4. System saves the testimonial as Pending.
5. System attempts to notify the owner and confirm receipt to the submitter.
6. Email failure does not prevent the saved testimonial from remaining available in the owner's dashboard.

### 8.3 Moderate a Testimonial

1. Owner opens the dashboard.
2. Owner filters testimonials by status.
3. Owner reviews a submission.
4. Owner approves, rejects, or deletes it.
5. Approved testimonials become eligible for public display.
6. Rejected testimonials remain private and can be reviewed again later.

### 8.4 Publish Testimonials

1. Owner configures the public collection page or a display widget.
2. Owner selects grid or carousel layout for the widget.
3. Owner copies the iframe embed snippet.
4. The public page or widget displays only approved testimonials from the selected collection.
5. When approval is withdrawn or a testimonial is rejected or deleted, the next public request or refresh must not return it.

### 8.5 Manage a Subscription

1. Owner selects a Paid plan.
2. Application initiates Stripe Checkout.
3. Application synchronizes subscription state through verified Stripe webhooks.
4. Owner manages payment methods, invoices, and cancellation through Stripe Customer Portal.
5. Cancellation retains Paid benefits through the current paid period.
6. An unresolved failed payment triggers a seven-day grace period.
7. After the grace period, the account transitions to Free and the downgrade rules apply.

## 9. Functional Requirements Overview

The SRS will define the detailed, testable requirements. The product must:

- Authenticate users and enforce email verification.
- Enforce ownership on every account-owned resource.
- Support collection creation, editing, deletion, and unique public URLs.
- Validate public submissions and initially mark them Pending.
- Support testimonial approval, rejection, re-review, and deletion.
- Prevent private or unapproved testimonials from appearing publicly.
- Provide public pages and configurable embedded display widgets.
- Notify owners and submitters without making email delivery a dependency for successful database writes.
- Provide dashboard analytics and secure CSV export.
- Enforce Free and Paid plan entitlements on the server.
- Integrate Stripe subscriptions, cancellation, failed-payment grace, and downgrade behavior.
- Provide notification preferences, privacy information, and account deletion.

## 10. Non-Functional Requirements

### 10.1 Security

- Use secure password hashing and session handling.
- Protect state-changing web requests against CSRF.
- Validate user input server-side and escape output appropriately.
- Enforce authorization on every private operation.
- Apply rate limits to authentication and public submission endpoints.
- Verify Stripe webhook signatures and process events idempotently.
- Keep credentials and API keys out of source control.
- Avoid logging passwords, reset tokens, payment credentials, or unnecessary personal data.
- Ensure public responses never expose submitter email addresses or private moderation data.

### 10.2 Reliability

- Email delivery failures must not roll back successful business operations.
- Retry transient email and background-job failures where appropriate.
- Process Stripe webhook events safely, including duplicate delivery.
- Document backup, restoration, and retention procedures.
- Provide operational logging for application and integration failures.

### 10.3 Usability and Accessibility

- Support desktop, tablet, and mobile layouts.
- Provide labeled forms and clear validation messages.
- Make controls keyboard-operable.
- Use semantic HTML and accessible focus and contrast practices.
- Display clear success and error states for submission, moderation, quotas, billing, and deletion.

### 10.4 Maintainability and Testing

- Use Laravel for server-side business rules and authorization.
- Use Inertia.js with React for the frontend.
- Use MySQL for persistent data.
- Use Tailwind CSS for styling.
- Use Laravel authentication tooling and Laravel Cashier.
- Use Pest for automated tests.
- Document local setup, environment variables, migrations, queue workers, Stripe test configuration, and deployment.

Measurable performance targets, supported browsers, formal accessibility targets, and uptime objectives must be defined during technical planning.

## 11. Privacy and Data Retention

- Provide a privacy notice.
- Do not sell personal data.
- Share personal data only with necessary service providers to operate the application, as disclosed in the privacy notice.
- Never expose submitter email publicly.
- Account owners must only access their own private data.
- Account deletion must remove associated application data and public content according to the documented deletion workflow.
- Collection deletion must remove its associated active testimonials and invalidate public references.
- Backup and operational-log retention must be documented. The product must not claim that deletion instantly erases every retained backup or external provider log.

## 12. Risks and Dependencies

### 12.1 Live Payment Availability

Stripe integration will be developed and tested in test mode. Before enabling real payments, verify that the operating business and its country are eligible for a compliant Stripe merchant account. Do not assume live-payment availability.

### 12.2 Email Deliverability

An email provider must be selected. Delivery configuration, authentication records, failure monitoring, and retry behavior must be tested.

### 12.3 CAPTCHA

A CAPTCHA provider and abuse threshold must be selected. The server must verify CAPTCHA responses. Privacy implications must be documented.

### 12.4 Multi-Tenant Data Isolation

Account-level isolation is a critical security requirement. Automated tests must verify that one user cannot access or mutate another user's resources.

### 12.5 Public Visibility and Caching

Public pages and widgets must reflect current approval and deletion states. Caching must not expose stale or unapproved content.

### 12.6 Subscription Synchronization

Subscription entitlements must remain consistent with Stripe. Webhook verification, idempotency, retry handling, and reconciliation are required.

## 13. Assumptions and Open Decisions

The following details remain unresolved and must not be silently invented:

1. Final product name and confirmation that “TestimonialHub” is the chosen brand.
2. Paid-plan price, currency, billing interval, trial policy, refund policy, tax handling, and proration.
3. Stripe live-account eligibility and production payment availability.
4. Email delivery provider.
5. CAPTCHA provider and trigger thresholds.
6. Exact password policy.
7. Slug format, reserved slugs, and behavior when a slug changes.
8. Maximum field lengths and logo upload constraints.
9. Hosting provider, domain, queue/cache services, CI/CD, monitoring, and backup/recovery targets.
10. Supported browsers and measurable performance/accessibility targets.
11. Exact timing and recovery rules for the seven-day failed-payment grace period.
12. Public submission behavior when a Free account reaches its 50-testimonial limit.

The Free testimonial-limit behavior is particularly important: the implementation must define whether further submissions are rejected, paused, or handled by another explicit policy.

## 14. Recommended Release Plan

### Phase 1 — Foundation
- Initialize the repository and Laravel application.
- Configure Inertia.js, React, Tailwind CSS, and MySQL.
- Implement authentication and email verification.
- Configure Pest and continuous integration.
- Establish authorization and coding conventions.

### Phase 2 — Collection Workflow
- Implement collections and unique slugs.
- Implement public submission forms.
- Implement testimonial persistence and moderation.
- Test ownership and privacy rules.

### Phase 3 — Public Publishing
- Implement public collection pages.
- Implement branding settings.
- Implement grid and carousel widgets.
- Generate iframe embed snippets.
- Test visibility and deletion invalidation.

### Phase 4 — Dashboard and Notifications
- Implement dashboard analytics and testimonial management.
- Add in-app and email notifications.
- Add email preferences.
- Add CSV export and account/collection deletion.

### Phase 5 — Billing
- Implement Free/Paid entitlements.
- Integrate Laravel Cashier and Stripe test-mode checkout.
- Configure Customer Portal and webhooks.
- Implement cancellation, seven-day grace, and downgrade behavior.
- Test quota enforcement and subscription transitions.

### Phase 6 — Hardening and Deployment
- Complete security and regression tests.
- Review accessibility and responsive behavior.
- Configure logging, backups, and operational checks.
- Document setup and deployment.
- Deploy a portfolio-ready version.

## 15. Definition of MVP Completion

The MVP is considered complete when:

- Included user journeys work end to end.
- Cross-account access tests pass.
- Public pages and widgets never return unapproved testimonials or submitter email.
- Quotas and downgrade behavior are enforced server-side and tested.
- Stripe test-mode subscription workflows are tested.
- Notification failure does not roll back successful actions.
- Collection and account deletion behavior is verified.
- CSV export is authorized and protects against formula injection.
- Pest tests pass in CI.
- Setup, environment configuration, deployment, and known limitations are documented.

## 16. Requirements Baseline and Change Control

This PRD consolidates decisions REQ-001 through REQ-045.

REQ-014 originally described simulated billing and is superseded by REQ-032, which specifies real Stripe billing through Laravel Cashier.

Any future change should record:
- Requirement ID.
- Description of the change.
- Reason and expected benefit.
- Impact on scope, data model, security, tests, and schedule.
- Approval status.

This document is a draft for review. The companion SRS should convert the approved product requirements into detailed, testable software requirements before implementation begins.