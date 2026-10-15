import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/require-user";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor, PLAN_PRICING } from "@/lib/plans";
import { rateLimit } from "@/lib/security/rate-limit";
import { jitter } from "@/lib/security/constant-time";
import {
  isDemoSubscription,
  simulateDemoOutcome,
  validateDemoCardInput,
} from "@/lib/billing/demo";
import { upsertDemoSubscription } from "@/lib/billing/demo-subscription";

/**
 * POST /api/billing/demo-checkout
 *
 * Demo-only checkout endpoint. The server:
 *   1. requires an authenticated user,
 *   2. rate-limits per user (5 / 5 min),
 *   3. validates the card form (Luhn + expiry + CVC + name),
 *   4. refuses to act if the user is already on a non-demo Paid plan
 *      (defense in depth; the page redirects too),
 *   5. computes the simulated outcome entirely server-side from the card
 *      number — the client cannot send `plan`, `price`, or
 *      `paymentSucceeded` to bypass this,
 *   6. applies an artificial 600–1200 ms delay so the loading state is
 *      visible to the user,
 *   7. on decline, returns 402 with a JSON error and never touches the DB,
 *   8. on success, upserts the `Subscription` row and returns the redirect
 *      target.
 *
 * No card data is logged, echoed, or persisted beyond the Luhn check. The
 * full card number and CVC are local variables that go out of scope when
 * the handler returns.
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 5 * 60 * 1000;

const checkoutSchema = z.object({
  name: z.string().min(1).max(80),
  number: z.string().min(1).max(32),
  expiry: z.string().min(1).max(8),
  cvc: z.string().min(1).max(4),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in required." }, { status: 401 });
  }

  const limit = rateLimit(`demo-checkout:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many demo checkout attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "All card fields are required." },
      { status: 400 }
    );
  }

  // Shape validation only — Luhn + expiry checks happen in
  // validateDemoCardInput so we can return field-specific errors and
  // because Zod doesn't ship a card validator.
  const validation = validateDemoCardInput(parsed.data);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, field: validation.field, message: validation.message },
      { status: 400 }
    );
  }

  // Defense in depth: refuse to act on a non-demo, already-active
  // subscription. The page redirects, but the API must not rely on it.
  const existing = await getSubscriptionForUser(user.id);
  if (planFor(existing) === "paid" && !isDemoSubscription(existing)) {
    return NextResponse.json(
      { ok: false, message: "You already have an active paid subscription." },
      { status: 409 }
    );
  }

  // Simulated processing delay so the loading state is visible.
  await jitter(600, 1200);

  // Server-determined outcome. The client never supplies `plan`, `price`,
  // or `paymentSucceeded`. Any such fields in the body are ignored.
  const outcome = simulateDemoOutcome(parsed.data.number);

  if (outcome === "decline") {
    return NextResponse.json(
      {
        ok: false,
        message: "Your demo payment was declined. No charges were made. Please try again.",
      },
      { status: 402 }
    );
  }

  // Price + plan are hard-coded server-side from PLAN_PRICING. The body
  // never determines the plan.
  void PLAN_PRICING.paid.price;

  const result = await upsertDemoSubscription({ userId: user.id, outcome });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 402 });
  }

  return NextResponse.json(
    { ok: true, redirectTo: "/dashboard/billing?demo=success" },
    { status: 200 }
  );
}