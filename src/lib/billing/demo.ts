/**
 * Demo-only billing helpers (pure functions, no I/O).
 *
 * The MVP does not integrate with a real payment processor. These helpers
 * exist so the rest of the app's paid-only behavior (unlimited collections,
 * testimonials, widgets, branding removal) can be exercised end-to-end
 * without a real Stripe account.
 *
 * Hard rules enforced here:
 *   • The full card number and CVC are never persisted or returned. The
 *     validator's return type only carries `last4` so a downstream caller
 *     cannot accidentally write the full number to a database column or
 *     log.
 *   • The simulated outcome (success / decline) is determined entirely
 *     server-side from the card number. The client never supplies a
 *     `plan`, `price`, or `paymentSucceeded` flag.
 *   • Demo subscriptions are recognized by the `demo_` prefix on the
 *     synthesized Stripe IDs. The `Subscription` table does not have a
 *     `provider` column; this prefix is the convention.
 */

export const DEMO_PRICE_ID = "price_demo_paid";

/**
 * True when the subscription row was created by the demo checkout flow.
 *
 * Detection is by the `demo_` prefix on `stripeCustomerId`. Real Stripe
 * Customer IDs start with `cus_`, so the prefix is unambiguous.
 */
export function isDemoSubscription(
  subscription: { stripeCustomerId?: string | null } | null | undefined
): boolean {
  if (!subscription) return false;
  const id = subscription.stripeCustomerId;
  return typeof id === "string" && id.startsWith("demo_");
}

export type DemoOutcome = "success" | "decline";

/**
 * Map a card number to a simulated checkout outcome.
 *
 * The form is labeled as a demo and the user is told to type a fake card
 * number — never a real one. The Stripe-style canonical test cards
 * (4242 4242 4242 4242 and 4000 0000 0000 0002) drive the user-visible
 * branches; any other Luhn-valid 13–19 digit number defaults to success.
 * Whitespace is tolerated; casing is irrelevant (digits only).
 */
export function simulateDemoOutcome(cardNumber: string): DemoOutcome {
  const digits = cardNumber.replace(/\s+/g, "");
  if (digits === "4000000000000002") return "decline";
  return "success";
}

/**
 * Card-number validation via the Luhn checksum. Returns true for 13–19
 * digit strings whose checksum is valid.
 */
export function isLuhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export type DemoCardField = "name" | "number" | "expiry" | "cvc";

export interface DemoCardNormalized {
  /** Last 4 digits of the card number. Full number is never returned. */
  last4: string;
  /** Two-digit month parsed from the expiry input. */
  expiryMonth: number;
  /** Two-digit year (full 4-digit year is parsed internally). */
  expiryYear: number;
}

export type DemoCardValidation =
  | { ok: true; normalized: DemoCardNormalized }
  | { ok: false; field: DemoCardField; message: string };

/**
 * Validate the demo card form input. Pure: no I/O, no logging, no
 * persistence. The return type intentionally does NOT include the full
 * card number or CVC, so any downstream code that wants to keep those
 * values must accept the risk explicitly.
 */
export function validateDemoCardInput(input: {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
}): DemoCardValidation {
  const name = input.name.trim();
  if (name.length === 0) {
    return { ok: false, field: "name", message: "Cardholder name is required." };
  }
  if (name.length > 80) {
    return { ok: false, field: "name", message: "Cardholder name must be 80 characters or fewer." };
  }

  const number = input.number.trim();
  if (!/^[\d\s]+$/.test(number)) {
    return { ok: false, field: "number", message: "Card number must contain digits and spaces only." };
  }
  if (!isLuhnValid(number)) {
    return { ok: false, field: "number", message: "Card number is not valid (Luhn check failed)." };
  }

  const expiry = input.expiry.trim();
  const expiryMatch = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry);
  if (!expiryMatch) {
    return { ok: false, field: "expiry", message: "Expiry must be in MM/YY format." };
  }
  const expiryMonth = Number(expiryMatch[1]);
  const expiryYearTwo = Number(expiryMatch[2]);
  if (expiryMonth < 1 || expiryMonth > 12) {
    return { ok: false, field: "expiry", message: "Expiry month must be between 01 and 12." };
  }
  const now = new Date();
  const currentYearTwo = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  const isExpired =
    expiryYearTwo < currentYearTwo ||
    (expiryYearTwo === currentYearTwo && expiryMonth < currentMonth);
  if (isExpired) {
    return { ok: false, field: "expiry", message: "Card has expired." };
  }

  const cvc = input.cvc.trim();
  if (!/^\d{3,4}$/.test(cvc)) {
    return { ok: false, field: "cvc", message: "CVC must be 3 or 4 digits." };
  }

  const digitsOnly = number.replace(/\D/g, "");
  const last4 = digitsOnly.slice(-4);

  return {
    ok: true,
    normalized: {
      last4,
      expiryMonth,
      expiryYear: expiryYearTwo,
    },
  };
}
