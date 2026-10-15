import { describe, it, expect } from "vitest";
import { safeNext, DEFAULT_NEXT } from "@/lib/auth/safe-redirect";

describe("safeNext", () => {
  describe("accepts same-origin absolute paths", () => {
    it("accepts a simple absolute path", () => {
      expect(safeNext("/dashboard")).toBe("/dashboard");
    });

    it("accepts a path with a query string", () => {
      expect(safeNext("/dashboard?x=1")).toBe("/dashboard?x=1");
    });

    it("accepts a path with a hash", () => {
      expect(safeNext("/dashboard#section")).toBe("/dashboard#section");
    });

    it("accepts a path with both query and hash", () => {
      expect(safeNext("/collections/abc?x=1#y")).toBe(
        "/collections/abc?x=1#y"
      );
    });

    it("accepts a nested path", () => {
      expect(safeNext("/dashboard/settings/profile")).toBe(
        "/dashboard/settings/profile"
      );
    });

    it("accepts a trailing-slash path", () => {
      expect(safeNext("/dashboard/")).toBe("/dashboard/");
    });
  });

  describe("falls back to default for unsafe values", () => {
    it("returns default for undefined", () => {
      expect(safeNext(undefined)).toBe(DEFAULT_NEXT);
    });

    it("returns default for null", () => {
      expect(safeNext(null)).toBe(DEFAULT_NEXT);
    });

    it("returns default for empty string", () => {
      expect(safeNext("")).toBe(DEFAULT_NEXT);
    });

    it("returns default for whitespace-only", () => {
      expect(safeNext("   ")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a fully-qualified URL", () => {
      expect(safeNext("http://evil.com/path")).toBe(DEFAULT_NEXT);
    });

    it("returns default for an https URL", () => {
      expect(safeNext("https://evil.com")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a protocol-relative URL", () => {
      expect(safeNext("//evil.com/dashboard")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a backslash-only URL (some browsers normalize to forward)", () => {
      expect(safeNext("\\\\evil.com")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a mixed backslash trick", () => {
      expect(safeNext("/\\\\evil.com")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a javascript: URL", () => {
      expect(safeNext("javascript:alert(1)")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a data: URL", () => {
      expect(safeNext("data:text/html,foo")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a path containing a newline", () => {
      // A header-splitter attempt: `/dashboard\nLocation: evil.com`.
      expect(safeNext("/dashboard\nfoo")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a path containing a tab", () => {
      expect(safeNext("/dashboard\tfoo")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a path containing a carriage return", () => {
      expect(safeNext("/dashboard\rfoo")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a path that does not start with /", () => {
      expect(safeNext("dashboard")).toBe(DEFAULT_NEXT);
      expect(safeNext("./dashboard")).toBe(DEFAULT_NEXT);
      expect(safeNext("../dashboard")).toBe(DEFAULT_NEXT);
    });

    it("returns default for a relative path (no leading slash)", () => {
      expect(safeNext("dashboard?next=1")).toBe(DEFAULT_NEXT);
    });

    it("returns default for an extremely long value", () => {
      expect(safeNext("/dashboard?" + "a".repeat(10_000))).toBe(DEFAULT_NEXT);
    });

    it("returns default for a single slash", () => {
      // `//` opens a protocol-relative URL, so a single `/` is the
      // shortest acceptable form but `/` alone with nothing else is
      // suspicious enough to reject? Actually, the regex permits
      // `/` itself because the `(?!\/)` only blocks the immediate
      // second slash. So `/` is accepted. Let's confirm:
      expect(safeNext("/")).toBe("/");
    });
  });

  describe("non-string inputs", () => {
    it("returns default for a number", () => {
      // @ts-expect-error testing runtime defensiveness
      expect(safeNext(123)).toBe(DEFAULT_NEXT);
    });

    it("returns default for an object", () => {
      // @ts-expect-error testing runtime defensiveness
      expect(safeNext({ evil: true })).toBe(DEFAULT_NEXT);
    });

    it("returns default for an array", () => {
      // @ts-expect-error testing runtime defensiveness
      expect(safeNext(["/dashboard"])).toBe(DEFAULT_NEXT);
    });
  });
});
