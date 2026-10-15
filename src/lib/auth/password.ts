import bcrypt from "bcryptjs";
import { breachedPasswords } from "@/lib/security/breached-passwords";

/**
 * Password hashing, verification, and policy enforcement.
 *
 * Policy (locked in PRD §13 open decision #6 and grill Q19):
 *   - Minimum 10 characters.
 *   - Must contain at least one letter and at least one digit.
 *   - Must not appear in the bundled breached-password list.
 *
 * bcrypt cost factor: 12 (industry standard for interactive auth on
 * commodity hardware, ~250ms per hash on a modern CPU).
 */

export const PASSWORD_POLICY = {
  minLength: 10,
  requireLetter: true,
  requireDigit: true,
  bcryptCost: 12,
} as const;

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; code: PasswordErrorCode; message: string };

export type PasswordErrorCode =
  | "too_short"
  | "missing_letter"
  | "missing_digit"
  | "breached";

const POLICY_MESSAGES: Record<PasswordErrorCode, string> = {
  too_short: `Password must be at least ${PASSWORD_POLICY.minLength} characters.`,
  missing_letter: "Password must contain at least one letter.",
  missing_digit: "Password must contain at least one digit.",
  breached:
    "This password appears in a known data breach. Please choose a different one.",
};

export function validatePassword(plain: string): PasswordPolicyResult {
  if (plain.length < PASSWORD_POLICY.minLength) {
    return { ok: false, code: "too_short", message: POLICY_MESSAGES.too_short };
  }
  if (PASSWORD_POLICY.requireLetter && !/[A-Za-z]/.test(plain)) {
    return {
      ok: false,
      code: "missing_letter",
      message: POLICY_MESSAGES.missing_letter,
    };
  }
  if (PASSWORD_POLICY.requireDigit && !/\d/.test(plain)) {
    return {
      ok: false,
      code: "missing_digit",
      message: POLICY_MESSAGES.missing_digit,
    };
  }
  if (breachedPasswords.has(plain.toLowerCase())) {
    return { ok: false, code: "breached", message: POLICY_MESSAGES.breached };
  }
  return { ok: true };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_POLICY.bcryptCost);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
