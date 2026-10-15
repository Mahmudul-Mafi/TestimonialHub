/**
 * In-memory rate limiter for the MVP.
 *
 * Production deployments will use Redis. For local dev and the initial
 * release we keep a small, per-key counter in process memory. This is
 * documented as a known limitation in KNOWN_LIMITATIONS.md.
 *
 * The interface matches what a Redis-backed implementation would expose
 * so it can be swapped later without touching call sites.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Apply a fixed-window rate limit. Returns ok=true if the request is
 * allowed. `resetAt` is the unix epoch ms at which the window resets.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Test helper: clear all buckets. */
export function _resetRateLimits(): void {
  buckets.clear();
}
