import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Verification-token lifecycle (PRD §3.1 FR-AUTH-002/004, grill Q13).
 *
 * Tokens are 32 random bytes encoded as URL-safe base64 (43 chars). At
 * rest we store only the SHA-256 hex of the token. The raw value appears
 * in URLs and in email bodies; the DB never holds it in cleartext.
 *
 * Atomic consume: SELECT ... FOR UPDATE inside a transaction so that
 * concurrent GET-then-POST requests cannot both succeed.
 *
 * The 24h expiration is hard-coded here for email verification; password
 * reset uses 1h. Both can be overridden by the caller.
 */

export type TokenPurpose = "email_verification" | "password_reset" | "email_change";

const DEFAULT_TTL_MS: Record<TokenPurpose, number> = {
  email_verification: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
  email_change: 24 * 60 * 60 * 1000,
};

export function generateTokenValue(): string {
  return randomBytes(32).toString("base64url"); // 43 chars
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface CreateTokenOptions {
  identifier: string;
  purpose: TokenPurpose;
  ttlMs?: number;
}

export interface CreatedToken {
  raw: string;
  expiresAt: Date;
}

export async function createVerificationToken(
  opts: CreateTokenOptions
): Promise<CreatedToken> {
  const raw = generateTokenValue();
  const tokenHash = hashToken(raw);
  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS[opts.purpose];
  const expiresAt = new Date(Date.now() + ttl);

  // Invalidate any prior unused tokens for the same identifier+purpose so
  // that the most recent email is always the only one that can succeed.
  await prisma.verificationToken.deleteMany({
    where: { identifier: opts.identifier, purpose: opts.purpose, consumedAt: null },
  });

  await prisma.verificationToken.create({
    data: {
      tokenHash,
      identifier: opts.identifier,
      purpose: opts.purpose,
      expiresAt,
    },
  });

  return { raw, expiresAt };
}

export type ConsumeResult =
  | { ok: true; identifier: string }
  | { ok: false; code: "not_found" | "expired" | "already_used" };

/**
 * Atomically consume a verification token.
 *
 * 1. Look up the row by hash.
 * 2. If not found OR already consumed OR expired: return the relevant code.
 * 3. Otherwise, mark consumedAt = now and return the identifier.
 *
 * Caller is responsible for sending a constant-time response on failure
 * (no email enumeration).
 */
export async function consumeVerificationToken(
  raw: string,
  purpose: TokenPurpose
): Promise<ConsumeResult> {
  if (!raw || raw.length < 16) {
    return { ok: false, code: "not_found" };
  }
  const tokenHash = hashToken(raw);

  return prisma.$transaction(async (tx) => {
    // NOTE: MySQL doesn't expose `SELECT ... FOR UPDATE` through Prisma
    // without raw SQL, so we use a conditional update as the atomic
    // claim: only the first caller to set `consumedAt` from null to a
    // value will succeed.
    const result = await tx.verificationToken.updateMany({
      where: {
        tokenHash,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });

    if (result.count === 1) {
      const row = await tx.verificationToken.findUnique({
        where: { tokenHash },
        select: { identifier: true },
      });
      if (!row) return { ok: false, code: "not_found" } as const;
      return { ok: true, identifier: row.identifier } as const;
    }

    // Distinguish between not-found / already-used / expired by
    // inspecting the row without claiming it.
    const row = await tx.verificationToken.findUnique({
      where: { tokenHash },
      select: { consumedAt: true, expiresAt: true, purpose: true },
    });
    if (!row || row.purpose !== purpose) {
      return { ok: false, code: "not_found" } as const;
    }
    if (row.consumedAt) {
      return { ok: false, code: "already_used" } as const;
    }
    return { ok: false, code: "expired" } as const;
  });
}
