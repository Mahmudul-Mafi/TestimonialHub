import Link from "next/link";

import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { DisabledLink } from "@/components/ui/disabled-link";
import { requireUser } from "@/lib/auth/require-user";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor, FREE_LIMITS, PLAN_PRICING } from "@/lib/plans";
import { isDemoSubscription } from "@/lib/billing/demo";
import { appConfig } from "@/lib/app-config";
import { DemoCancelForm } from "@/components/dashboard/demo-cancel-form";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ demo?: string; error?: string }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const subscription = await getSubscriptionForUser(user.id);
  const plan = planFor(subscription);
  const state = subscription?.state ?? "free";
  const isDemo = isDemoSubscription(subscription);
  const params = searchParams ? await searchParams : undefined;
  const demo = params?.demo;
  const error = params?.error;

  return (
    <>
      <TopBar
        title="Billing"
        description="Manage your subscription and review plan limits."
      />
      <div className="space-y-6 p-4 sm:p-6">
        {demo === "success" ? (
          <FlashBanner tone="success">
            Demo checkout succeeded. You&apos;re on the Paid plan (demo) until you cancel.
          </FlashBanner>
        ) : null}
        {demo === "cancelled" ? (
          <FlashBanner tone="info">
            Your demo subscription has been cancelled. You&apos;re back on the Free plan.
          </FlashBanner>
        ) : null}
        {error === "already_paid" ? (
          <FlashBanner tone="warning">
            You already have an active paid subscription.
          </FlashBanner>
        ) : null}

        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Current plan</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Plan state: <span className="font-mono">{state}</span>
                {isDemo ? (
                  <span className="ml-2 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Demo
                  </span>
                ) : null}
              </p>
            </div>
            <span
              className={
                plan === "paid"
                  ? "rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                  : "rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
              }
            >
              {plan === "paid" ? "Paid" : "Free"}
            </span>
          </div>
          {plan === "free" ? (
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{FREE_LIMITS.maxCollections}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">collections</div>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{FREE_LIMITS.maxTestimonials}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">testimonials</div>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{FREE_LIMITS.maxActiveWidgets}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">active widgets</div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
              You&apos;re on the Paid plan. Unlimited collections, testimonials, and widgets.
              Branding removed from public pages and widgets.
              {isDemo ? (
                <span className="ml-1 text-gray-500 dark:text-gray-400">
                  (This is a demo subscription — no real payment was processed.)
                </span>
              ) : null}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {PLAN_PRICING.paid.name} plan
            </h2>
            {isDemo ? (
              <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Demo
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{PLAN_PRICING.paid.tagline}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            ${PLAN_PRICING.paid.price}<span className="text-sm font-normal text-gray-500"> / month</span>
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>· Unlimited collections, testimonials, and widgets</li>
            <li>· Remove TestimonialHub branding from public pages and widgets</li>
            <li>· Priority support</li>
          </ul>
          <div className="mt-4 space-y-2">
            {plan === "paid" && isDemo ? (
              <DemoCancelForm />
            ) : plan === "paid" ? (
              <Button disabled aria-disabled="true">
                Subscription active
              </Button>
            ) : (
              <Link
                href="/dashboard/billing/checkout"
                className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Try demo checkout
              </Link>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The MVP ships a demo checkout so the Paid-plan features can be
              exercised end-to-end. The demo never calls a real payment
              processor and stores no card data. A real Stripe integration
              will replace this flow in a later release.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Customer portal</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage payment methods, invoices, and cancellation.
          </p>
          <div className="mt-3">
            <DisabledLink
              href={appConfig.appUrl}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Open customer portal (coming soon)
            </DisabledLink>
          </div>
        </section>
      </div>
    </>
  );
}

function FlashBanner({
  tone,
  children,
}: {
  tone: "success" | "info" | "warning";
  children: React.ReactNode;
}) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
      : tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200";
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
