import { customAlphabet } from "nanoid";

import { prisma } from "@/lib/db";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { DEMO_PRICE_ID, isDemoSubscription, type DemoOutcome } from "@/lib/billing/demo";

/**
 * Server-only helpers for the demo checkout flow.
 *
 * These functions touch the `Subscription` table directly. They are the
 * demo counterpart to a real Stripe webhook handler. They synthesize
 * `stripeCustomerId` / `stripeSubscriptionId` with a `demo_` prefix so
 * the rest of the app can recognize demo rows via `isDemoSubscription()`
 * without a schema change.
 *
 * Defense in depth:
 *   • `userId` is always passed in by the API route after `requireUser()`.
 *     These helpers never read a userId from a request body.
 *   • On a failed checkout, the database is not touched.
 *   • On cancel, we refuse to act on a row that is not a demo.
 */

const idChars = "abcdefghijklmnopqrstuvwxyz0123456789";
const idLength = 24;
const generateId = customAlphabet(idChars, idLength);

const DEMO_SUBSCRIPTION_DAYS = 30;

export type DemoCheckoutResult =
  | { ok: true; subscriptionId: string }
  | { ok: false; message: string };

export type DemoCancelResult =
  | { ok: true; message: string; alreadyAbsent: boolean }
  | { ok: false; message: string };

/**
 * Create or update a demo subscription. On `outcome === "decline"` the
 * database is left untouched and a decline result is returned.
 *
 * The synthesized IDs are written to `stripeCustomerId` (UNIQUE) and
 * `stripeSubscriptionId` (UNIQUE, nullable). cuid-equivalent collision
 * probability is astronomically low; we use a 24-char nanoid.
 */
export async function upsertDemoSubscription({
  userId,
  outcome,
}: {
  userId: string;
  outcome: DemoOutcome;
}): Promise<DemoCheckoutResult> {
  if (outcome === "decline") {
    return {
      ok: false,
      message: "Your demo payment was declined. No charges were made. Please try again.",
    };
  }

  const existing = await getSubscriptionForUser(userId);

  const stripeCustomerId = existing?.stripeCustomerId?.startsWith("demo_")
    ? existing.stripeCustomerId
    : `demo_cus_${generateId()}`;
  const stripeSubscriptionId =
    existing?.stripeSubscriptionId?.startsWith("demo_sub_")
      ? existing.stripeSubscriptionId
      : `demo_sub_${generateId()}`;

  const currentPeriodEnd = new Date(
    Date.now() + DEMO_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000
  );

  if (existing) {
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        stripeCustomerId,
        stripeSubscriptionId,
        state: "active",
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        graceStartedAt: null,
        graceEndsAt: null,
        priceId: DEMO_PRICE_ID,
      },
      select: { id: true },
    });
    return { ok: true, subscriptionId: updated.id };
  }

  const created = await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      state: "active",
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      graceStartedAt: null,
      graceEndsAt: null,
      priceId: DEMO_PRICE_ID,
    },
    select: { id: true },
  });
  return { ok: true, subscriptionId: created.id };
}

/**
 * Cancel a demo subscription. Behavior:
 *   • No existing row → idempotent success ("No subscription to cancel.").
 *   • Existing row is not a demo → refused (defense in depth; the API
 *     route also refuses this case).
 *   • Existing demo row → set `state = "cancelled"`, clear the period end
 *     so `planFor()` returns `"free"` on the next request.
 */
export async function cancelDemoSubscription({
  userId,
}: {
  userId: string;
}): Promise<DemoCancelResult> {
  const existing = await getSubscriptionForUser(userId);
  if (!existing) {
    return {
      ok: true,
      message: "No subscription to cancel.",
      alreadyAbsent: true,
    };
  }
  if (!isDemoSubscription(existing)) {
    return {
      ok: false,
      message: "This subscription is not a demo and cannot be cancelled from here.",
    };
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      state: "cancelled",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });
  return {
    ok: true,
    message: "Your demo subscription has been cancelled.",
    alreadyAbsent: false,
  };
}

export interface DemoSubscriptionView {
  isDemo: boolean;
  state: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * UI-shaped view of a user's subscription for the demo flow. No card data
 * is included; the MVP does not persist any portion of the card number.
 */
export async function getDemoSubscriptionView({
  userId,
}: {
  userId: string;
}): Promise<DemoSubscriptionView | null> {
  const sub = await getSubscriptionForUser(userId);
  if (!sub) return null;
  return {
    isDemo: isDemoSubscription(sub),
    state: sub.state,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
}