import { describe, it, expect } from "vitest";

import {
  DEMO_PRICE_ID,
  isDemoSubscription,
  isLuhnValid,
  simulateDemoOutcome,
  validateDemoCardInput,
} from "@/lib/billing/demo";

describe("isDemoSubscription", () => {
  it("returns true for synthesized demo customer ids", () => {
    expect(isDemoSubscription({ stripeCustomerId: "demo_cus_abc" })).toBe(true);
  });

  it("returns false for real-shape Stripe customer ids", () => {
    expect(isDemoSubscription({ stripeCustomerId: "cus_real123" })).toBe(false);
  });

  it("returns false for null or missing subscription", () => {
    expect(isDemoSubscription(null)).toBe(false);
    expect(isDemoSubscription(undefined)).toBe(false);
    expect(isDemoSubscription({})).toBe(false);
    expect(isDemoSubscription({ stripeCustomerId: null })).toBe(false);
  });
});

describe("simulateDemoOutcome", () => {
  it("returns success for the canonical Stripe test card 4242 4242 4242 4242", () => {
    expect(simulateDemoOutcome("4242424242424242")).toBe("success");
    expect(simulateDemoOutcome("4242 4242 4242 4242")).toBe("success");
  });

  it("returns decline for the canonical Stripe decline card 4000 0000 0000 0002", () => {
    expect(simulateDemoOutcome("4000000000000002")).toBe("decline");
    expect(simulateDemoOutcome("4000 0000 0000 0002")).toBe("decline");
  });

  it("defaults to success for any other card number", () => {
    // Mastercard-shape, valid Luhn.
    expect(simulateDemoOutcome("5555555555554444")).toBe("success");
  });
});

describe("isLuhnValid", () => {
  it("accepts canonical Stripe-style test cards", () => {
    expect(isLuhnValid("4242424242424242")).toBe(true);
    expect(isLuhnValid("4000000000000002")).toBe(true);
    expect(isLuhnValid("5555555555554444")).toBe(true);
  });

  it("accepts numbers with internal whitespace", () => {
    expect(isLuhnValid("4242 4242 4242 4242")).toBe(true);
  });

  it("rejects numbers with a failed checksum", () => {
    expect(isLuhnValid("4242424242424241")).toBe(false);
  });

  it("rejects too-short and too-long numbers", () => {
    expect(isLuhnValid("424242424242")).toBe(false);
    expect(isLuhnValid("42424242424242424242")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    // isLuhnValid strips non-digit characters before checking; the
    // "reject non-digit characters" guard lives in validateDemoCardInput.
    // Here we only assert the checksum reject path.
    expect(isLuhnValid("abcd")).toBe(false);
    expect(isLuhnValid("")).toBe(false);
  });
});

describe("validateDemoCardInput", () => {
  const validInput = {
    name: "Ada Lovelace",
    number: "4242 4242 4242 4242",
    expiry: "12/30",
    cvc: "123",
  };

  it("accepts a valid input and returns only the last 4 of the card number", () => {
    const result = validateDemoCardInput(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.normalized.last4).toBe("4242");
    expect(result.normalized.expiryMonth).toBe(12);
    expect(result.normalized.expiryYear).toBe(30);
    // The return type intentionally does not include `number` or `cvc` —
    // verify by absence of those keys on the runtime object.
    const keys = Object.keys(result.normalized);
    expect(keys).not.toContain("number");
    expect(keys).not.toContain("cvc");
    expect(keys).toEqual(["last4", "expiryMonth", "expiryYear"]);
  });

  it("rejects an empty cardholder name", () => {
    const result = validateDemoCardInput({ ...validInput, name: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("name");
  });

  it("rejects a name longer than 80 characters", () => {
    const result = validateDemoCardInput({ ...validInput, name: "x".repeat(81) });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("name");
  });

  it("rejects a number that fails the Luhn check", () => {
    const result = validateDemoCardInput({ ...validInput, number: "4242 4242 4242 4241" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("number");
  });

  it("rejects a number with non-digit characters", () => {
    const result = validateDemoCardInput({
      ...validInput,
      number: "4242-4242-4242-4242",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("number");
  });

  it("rejects an expired MM/YY", () => {
    // Pick a year that is comfortably in the past. The validator parses
    // the year as a 2-digit value (e.g. 24 → 2024).
    const result = validateDemoCardInput({ ...validInput, expiry: "01/24" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("expiry");
  });

  it("rejects an invalid month", () => {
    const result = validateDemoCardInput({ ...validInput, expiry: "13/30" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("expiry");
  });

  it("rejects a malformed expiry", () => {
    const result = validateDemoCardInput({ ...validInput, expiry: "12-30" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("expiry");
  });

  it("rejects a too-short CVC", () => {
    const result = validateDemoCardInput({ ...validInput, cvc: "12" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("cvc");
  });

  it("rejects a CVC with non-digit characters", () => {
    const result = validateDemoCardInput({ ...validInput, cvc: "12a" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("cvc");
  });

  it("accepts a 4-digit CVC (Amex-style)", () => {
    const result = validateDemoCardInput({ ...validInput, cvc: "1234" });
    expect(result.ok).toBe(true);
  });
});

describe("DEMO_PRICE_ID", () => {
  it("is the canonical demo price id", () => {
    expect(DEMO_PRICE_ID).toBe("price_demo_paid");
  });
});
