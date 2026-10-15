import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/require-user";
import { rateLimit } from "@/lib/security/rate-limit";
import { cancelDemoSubscription } from "@/lib/billing/demo-subscription";

/**
 * POST /api/billing/demo-cancel
 *
 * Cancels the user's demo subscription. Idempotent: cancelling when no
 * subscription exists returns ok=true with a "No subscription to cancel"
 * message. Refuses to cancel a non-demo subscription.
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 5 * 60 * 1000;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in required." }, { status: 401 });
  }

  const limit = rateLimit(`demo-cancel:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  const result = await cancelDemoSubscription({ userId: user.id });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 409 });
  }

  return NextResponse.json(
    {
      ok: true,
      message: result.message,
      redirectTo: "/dashboard/billing?demo=cancelled",
    },
    { status: 200 }
  );
}