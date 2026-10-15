import Link from "next/link";
import { redirect } from "next/navigation";

import { TopBar } from "@/components/dashboard/top-bar";
import { requireUser } from "@/lib/auth/require-user";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { isDemoSubscription } from "@/lib/billing/demo";
import { planFor, PLAN_PRICING } from "@/lib/plans";
import { DemoCheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Demo checkout — TestimonialHub",
};

/**
 * /dashboard/billing/checkout — the demo-only checkout page.
 *
 * Server-side guard: if the user is already on a non-demo Paid plan we
 * redirect them away. The API route performs the same check as defense
 * in depth.
 *
 * The form is a Client Component; the page itself is a Server Component
 * so the `requireUser()` and ownership check happen at request time.
 */
export default async function DemoCheckoutPage() {
  const user = await requireUser();
  const subscription = await getSubscriptionForUser(user.id);

  if (planFor(subscription) === "paid" && !isDemoSubscription(subscription)) {
    redirect("/dashboard/billing?error=already_paid");
  }

  return (
    <>
      <TopBar
        title="Demo checkout"
        description="Try the Paid plan flow without a real payment processor."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <section
          className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
          aria-label="Demo checkout disclosure"
        >
          <p className="font-semibold">This is a demo checkout.</p>
          <p className="mt-1">
            No real payment will be processed, and you must not enter real
            payment-card details. Submitting the form simulates a Stripe
            checkout using the existing <code>Subscription</code> row only.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Card details
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Use one of the fake card numbers on the right. Any 3-digit CVC and any
              future expiry date are accepted.
            </p>
            <div className="mt-4">
              <DemoCheckoutForm />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Fake test cards
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Copy any of these into the form. They follow the same
              conventions as Stripe-style test cards.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                <div className="font-mono">4242 4242 4242 4242</div>
                <div className="text-xs">Simulate a successful payment.</div>
              </li>
              <li className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                <div className="font-mono">4000 0000 0000 0002</div>
                <div className="text-xs">Simulate a declined payment.</div>
              </li>
              <li className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <div className="font-mono">Any future MM/YY</div>
                <div className="text-xs">Use e.g. 12/30. Any 3-digit CVC.</div>
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              On the real Paid plan, you would be charged{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                ${PLAN_PRICING.paid.price}
              </span>{" "}
              per month. This demo performs no charge and stores no card
              data. Cancelling returns you to Free immediately.
            </p>
          </section>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          <Link
            href="/dashboard/billing"
            className="focus-ring rounded hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to billing
          </Link>
        </p>
      </div>
    </>
  );
}