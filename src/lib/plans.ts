/**
 * Subscription plan limits and entitlement helpers.
 *
 * The source of truth for billing state is Stripe. The application mirrors
 * the relevant state in the `subscriptions` table and exposes a small,
 * read-only summary here. The dashboard never trusts the client to claim a
 * Paid plan; it consults the DB row, which is updated only by the Stripe
 * webhook handler.
 */

export type PlanName = "free" | "paid";

export interface PlanLimits {
  maxCollections: number; // -1 == unlimited
  maxTestimonials: number; // -1 == unlimited
  maxActiveWidgets: number; // -1 == unlimited
  allowsBrandingRemoval: boolean;
}

export const FREE_LIMITS: PlanLimits = {
  maxCollections: 2,
  maxTestimonials: 50,
  maxActiveWidgets: 2,
  allowsBrandingRemoval: false,
};

export const PAID_LIMITS: PlanLimits = {
  maxCollections: -1,
  maxTestimonials: -1,
  maxActiveWidgets: -1,
  allowsBrandingRemoval: true,
};

export const PLAN_PRICING = {
  free: {
    name: "Free",
    price: 0,
    currency: "USD",
    interval: null as null,
    tagline: "Get started collecting testimonials immediately.",
  },
  paid: {
    name: "Paid",
    price: 12,
    currency: "USD",
    interval: "month" as const,
    tagline: "For growing teams that need unlimited collections and branding control.",
  },
} as const;

export function limitsFor(plan: PlanName): PlanLimits {
  return plan === "paid" ? PAID_LIMITS : FREE_LIMITS;
}

/** A plan is at the Free cap for a given resource when usage >= limit. */
export function isAtOrOverFreeLimit(
  plan: PlanName,
  kind: keyof Omit<PlanLimits, "allowsBrandingRemoval">,
  currentUsage: number
): boolean {
  if (plan === "paid") return false;
  const limit = FREE_LIMITS[kind];
  if (limit === -1) return false;
  return currentUsage >= limit;
}

/** Map a subscription row to a plan name. */
export function planFor(
  subscription: { state: string } | null | undefined
): PlanName {
  if (!subscription) return "free";
  return subscription.state === "active" ? "paid" : "free";
}
