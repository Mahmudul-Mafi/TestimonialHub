import { describe, it, expect } from "vitest";
import { validatePassword, hashPassword, verifyPassword, PASSWORD_POLICY } from "@/lib/auth/password";

describe("password policy", () => {
  it("rejects passwords shorter than the minimum", () => {
    const r = validatePassword("Abc1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("too_short");
  });

  it("rejects passwords with no letter", () => {
    const r = validatePassword("1234567890");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_letter");
  });

  it("rejects passwords with no digit", () => {
    const r = validatePassword("abcdefghijklm");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("missing_digit");
  });

  it("rejects known breached passwords", () => {
    // "password123" is in our bundled list.
    const r = validatePassword("password123");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("breached");
  });

  it("accepts a strong password", () => {
    const r = validatePassword("correct-horse-battery-7");
    expect(r.ok).toBe(true);
  });
});

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const plain = "sup3r-secret-passphrase";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects empty inputs", async () => {
    expect(await verifyPassword("", "hash")).toBe(false);
    expect(await verifyPassword("plain", "")).toBe(false);
  });
});

describe("policy constants", () => {
  it("uses a bcrypt cost of at least 10", () => {
    expect(PASSWORD_POLICY.bcryptCost).toBeGreaterThanOrEqual(10);
  });
});
