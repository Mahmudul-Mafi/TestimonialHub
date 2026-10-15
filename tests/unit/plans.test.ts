import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, _resetRateLimits } from "@/lib/security/rate-limit";
import { FREE_LIMITS, PAID_LIMITS, planFor, isAtOrOverFreeLimit, limitsFor } from "@/lib/plans";

describe("rateLimit", () => {
  beforeEach(() => _resetRateLimits());

  it("allows up to the limit within a window", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(rateLimit("k", 3, 60_000).ok).toBe(true);
    }
  });

  it("rejects after the limit is hit", () => {
    for (let i = 0; i < 3; i += 1) rateLimit("k", 3, 60_000);
    const r = rateLimit("k", 3, 60_000);
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("uses separate buckets per key", () => {
    rateLimit("a", 1, 60_000);
    expect(rateLimit("a", 1, 60_000).ok).toBe(false);
    expect(rateLimit("b", 1, 60_000).ok).toBe(true);
  });
});

describe("plan limits", () => {
  it("free plan has 2 collections, 50 testimonials, 2 widgets", () => {
    expect(FREE_LIMITS.maxCollections).toBe(2);
    expect(FREE_LIMITS.maxTestimonials).toBe(50);
    expect(FREE_LIMITS.maxActiveWidgets).toBe(2);
    expect(FREE_LIMITS.allowsBrandingRemoval).toBe(false);
  });

  it("paid plan is unlimited on all counts", () => {
    expect(PAID_LIMITS.maxCollections).toBe(-1);
    expect(PAID_LIMITS.maxTestimonials).toBe(-1);
    expect(PAID_LIMITS.maxActiveWidgets).toBe(-1);
    expect(PAID_LIMITS.allowsBrandingRemoval).toBe(true);
  });

  it("planFor returns paid only when subscription is active", () => {
    expect(planFor(null)).toBe("free");
    expect(planFor({ state: "free" })).toBe("free");
    expect(planFor({ state: "active" })).toBe("paid");
    expect(planFor({ state: "graced" })).toBe("free");
    expect(planFor({ state: "cancelled" })).toBe("free");
  });

  it("isAtOrOverFreeLimit triggers at-or-above the cap for free", () => {
    expect(isAtOrOverFreeLimit("free", "maxCollections", 2)).toBe(true);
    expect(isAtOrOverFreeLimit("free", "maxCollections", 1)).toBe(false);
    expect(isAtOrOverFreeLimit("free", "maxTestimonials", 50)).toBe(true);
  });

  it("isAtOrOverFreeLimit is never true for paid plan", () => {
    expect(isAtOrOverFreeLimit("paid", "maxCollections", 9999)).toBe(false);
  });

  it("limitsFor returns the right object", () => {
    expect(limitsFor("free").maxCollections).toBe(2);
    expect(limitsFor("paid").maxCollections).toBe(-1);
  });
});
