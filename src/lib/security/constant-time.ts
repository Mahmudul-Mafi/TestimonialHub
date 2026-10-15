/**
 * Constant-time response helpers.
 *
 * Used by the registration, password-reset request, and email-change
 * endpoints to prevent user-enumeration attacks. We always perform a
 * comparable amount of work and return the same response shape whether
 * the email is known or not.
 */

import { timingSafeEqual } from "node:crypto";

/**
 * Compare two strings in constant time. Returns false if lengths differ.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Sleep for a random duration in [min, max] ms. Use to equalize response
 * time between known and unknown email addresses.
 */
export function jitter(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
  return new Promise((r) => setTimeout(r, delay));
}
