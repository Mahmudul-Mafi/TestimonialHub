# TestimonialHub
A testimonial collection and management platform built with Laravel, React, Inertia.js, and Stripe.
# TestimonialHub

A testimonial collection and management platform built with Laravel, Inertia.js, React, MySQL, and Stripe.

TestimonialHub helps individuals, freelancers, creators, startups, and businesses collect testimonials, review submissions, and display approved testimonials on public pages and embedded widgets.

> **Project status:** Planning and requirements documentation  
> **Project purpose:** Learning and portfolio development

## Table of Contents

- [Project Overview](#project-overview)
- [Planned Features](#planned-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development Roadmap](#development-roadmap)
- [Requirements Documents](#requirements-documents)
- [Getting Started](#getting-started)
- [Development Notes](#development-notes)

## Project Overview

TestimonialHub is a multi-user web application designed to simplify collecting, moderating, managing, and displaying customer testimonials.

The application will support a Free plan and a Paid plan, with Stripe handling subscription billing.

This is a learning project, so development will proceed in small, testable stages with version control, automated tests, and documentation.

## Planned Features

- Email and password authentication
- Email verification and password recovery
- Multiple testimonial collections
- Shareable public submission forms
- Testimonial moderation: Pending, Approved, and Rejected
- Public testimonial pages
- Embeddable grid and carousel widgets
- Free and Paid subscription plans
- Stripe Checkout, Customer Portal, and webhook integration
- Email and in-app notifications
- Basic analytics and CSV exports
- Responsive user interface
- Tenant isolation and security controls

## Technology Stack

| Technology | Purpose |
|---|---|
| Laravel | Backend application framework |
| PHP | Backend programming language |
| Inertia.js | Connects the backend with the frontend |
| React | User interface |
| Tailwind CSS | Styling and responsive layouts |
| MySQL | Relational database |
| Laravel Cashier | Subscription billing integration |
| Stripe | Payments and subscription management |
| Pest | Automated testing |
| Git and GitHub | Version control and project hosting |

## Project Structure

```text
TestimonialHub/
├── docs/
│   ├── TestimonialHub_PRD.md
│   └── TestimonialHub_SRS.md
├── .gitignore
└── README.md
```

Additional application directories will appear as development progresses.

## Development Roadmap

Track progress by updating the checkboxes as each task is completed.

### Phase 1 — Project Foundation

- [x] Create the local project directory
- [x] Draft the Product Requirements Document (PRD)
- [x] Draft the Software Requirements Specification (SRS)
- [x] Create `.gitignore`
- [x] Initialize the local Git repository
- [x] Create the GitHub repository
- [x] Connect the local repository to GitHub
- [ ] Review and reconcile PRD and SRS
- [ ] Review open product and technical decisions
- [ ] Review requirements with the `grill-me` skill

### Phase 2 — Development Environment

- [ ] Verify Puku CLI and required skills
- [ ] Finalize the initial application architecture
- [ ] Verify PHP, Composer, Node.js, npm, and MySQL
- [ ] Create the Laravel application
- [ ] Configure Inertia.js, React, and Tailwind CSS
- [ ] Configure the local database
- [ ] Run the initial application and verify it works

### Phase 3 — Core Application

- [ ] Implement authentication and email verification
- [ ] Implement collections and unique slugs
- [ ] Implement testimonial submission
- [ ] Implement moderation and ownership policies
- [ ] Implement public collection pages
- [ ] Implement embedded widgets
- [ ] Implement dashboard and analytics
- [ ] Implement CSV export

### Phase 4 — Billing and Notifications

- [ ] Implement Free and Paid plan limits
- [ ] Configure Stripe test mode
- [ ] Implement Checkout and Customer Portal
- [ ] Implement webhook synchronization
- [ ] Implement failed-payment grace period and downgrade behavior
- [ ] Implement email and in-app notifications

### Phase 5 — Quality and Security

- [ ] Write and run Pest tests
- [ ] Test tenant isolation and authorization
- [ ] Test subscription limits and billing transitions
- [ ] Test public visibility and CSV export security
- [ ] Review accessibility and responsive behavior
- [ ] Review privacy, deletion, logging, and backup policies

### Phase 6 — Deployment and Portfolio

- [ ] Choose a hosting platform
- [ ] Configure production environment variables securely
- [ ] Deploy the application
- [ ] Configure production email and Stripe settings
- [ ] Verify production functionality
- [ ] Document screenshots, architecture, and lessons learned
- [ ] Prepare the repository for public portfolio presentation

## Requirements Documents

The detailed project requirements are maintained separately:

- **[Product Requirements Document](docs/TestimonialHub_PRD.md)** — product vision, scope, features, user journeys, and release planning.
- **[Software Requirements Specification](docs/TestimonialHub_SRS.md)** — system behavior, functional requirements, architecture, security, and acceptance criteria.

These documents are drafts and should be reviewed and updated when important decisions change.

## Getting Started

The application implementation has not yet been established by this README.

Once the Laravel application has been created, this section will contain verified instructions for installing dependencies, configuring the environment, creating the database, running migrations, starting development servers, and executing tests.

Never commit `.env` files, passwords, API keys, Stripe secrets, or other credentials.

## Development Notes

- Work in small, understandable steps.
- Use Git commits to record meaningful milestones.
- Run relevant tests before considering a feature complete.
- Keep requirements and implementation aligned.
- Do not claim a feature is complete until it has been implemented and verified.
- Keep development credentials separate from production credentials.

## License

No license has been selected yet. Until one is added, do not assume this project is licensed for unrestricted reuse.