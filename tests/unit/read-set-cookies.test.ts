import { describe, it, expect } from "vitest";
import { readSetCookies, pickSetCookie } from "@/lib/auth/read-set-cookies";

/**
 * Minimal `Headers`-like object. Avoids depending on the global `Headers`
 * constructor because happy-dom's Response strips `set-cookie` headers
 * when given an input Headers object, which prevents end-to-end tests
 * that build a real Response.
 */
type HeaderRecord = {
  get(name: string): string | null;
  getSetCookie?(): string[];
};

function makeHeaders(cookies: string[]): HeaderRecord {
  return {
    get(name: string): string | null {
      if (name.toLowerCase() !== "set-cookie") return null;
      return cookies.join(", ");
    },
    getSetCookie(): string[] {
      return cookies.slice();
    },
  };
}

function makeLegacyHeaders(joined: string | null): HeaderRecord {
  return {
    get(name: string): string | null {
      if (name.toLowerCase() !== "set-cookie") return null;
      return joined;
    },
    // Pretend the runtime does not implement the modern API: this
    // forces the function to take the legacy path.
    getSetCookie(): string[] {
      return [];
    },
  };
}

function makeThrowingHeaders(value: string | null): HeaderRecord {
  return {
    get(name: string): string | null {
      if (name.toLowerCase() !== "set-cookie") return null;
      return value;
    },
    getSetCookie(): string[] {
      throw new Error("boom");
    },
  };
}

describe("readSetCookies", () => {
  describe("modern undici path (getSetCookie)", () => {
    it("returns a single cookie in an array", () => {
      const headers = makeHeaders([
        "authjs.session-token=abc; Path=/; HttpOnly",
      ]);
      expect(readSetCookies(headers)).toEqual([
        "authjs.session-token=abc; Path=/; HttpOnly",
      ]);
    });

    it("returns multiple cookies in order", () => {
      const headers = makeHeaders([
        "authjs.csrf-token=csrfvalue; Path=/; HttpOnly; SameSite=Lax",
        "authjs.callback-url=http%3A%2F%2Flocalhost%3A3000; Path=/; HttpOnly",
      ]);
      const out = readSetCookies(headers);
      expect(out).toHaveLength(2);
      expect(out[0]).toMatch(/^authjs\.csrf-token=/);
      expect(out[1]).toMatch(/^authjs\.callback-url=/);
    });

    it("returns an empty array when no Set-Cookie is present", () => {
      const headers = makeHeaders([]);
      expect(readSetCookies(headers)).toEqual([]);
    });
  });

  describe("legacy joined-header path", () => {
    it("parses a single-cookie joined header", () => {
      const headers = makeLegacyHeaders(
        "authjs.session-token=abc; Path=/; HttpOnly"
      );
      expect(readSetCookies(headers)).toEqual([
        "authjs.session-token=abc; Path=/; HttpOnly",
      ]);
    });

    it("splits two cookies on , <name>=", () => {
      const headers = makeLegacyHeaders(
        "authjs.csrf-token=csrfvalue; Path=/; HttpOnly, authjs.callback-url=http%3A%2F%2Flocalhost%3A3000; Path=/; HttpOnly"
      );
      const out = readSetCookies(headers);
      expect(out).toHaveLength(2);
      expect(out[0]).toMatch(/^authjs\.csrf-token=/);
      expect(out[1]).toMatch(/^authjs\.callback-url=/);
    });

    it("returns empty when get('set-cookie') is null", () => {
      const headers = makeLegacyHeaders(null);
      expect(readSetCookies(headers)).toEqual([]);
    });
  });

  describe("fallback behavior", () => {
    it("falls back to the legacy path when getSetCookie throws", () => {
      const headers = makeThrowingHeaders(
        "authjs.session-token=abc; Path=/; HttpOnly"
      );
      const out = readSetCookies(headers);
      expect(out).toEqual(["authjs.session-token=abc; Path=/; HttpOnly"]);
    });

    it("falls back to the legacy path when getSetCookie returns empty", () => {
      // Some adapters always return [] from getSetCookie but populate
      // the joined header. The fallback should kick in.
      const headers = makeLegacyHeaders(
        "authjs.session-token=abc; Path=/; HttpOnly"
      );
      const out = readSetCookies(headers);
      expect(out).toEqual(["authjs.session-token=abc; Path=/; HttpOnly"]);
    });

    it("returns empty when no Set-Cookie is present and getSetCookie throws", () => {
      const headers = makeThrowingHeaders(null);
      expect(readSetCookies(headers)).toEqual([]);
    });
  });
});

describe("pickSetCookie", () => {
  it("returns the full Set-Cookie line for a matching name", () => {
    const out = pickSetCookie(
      [
        "authjs.csrf-token=csrf; Path=/; HttpOnly",
        "authjs.session-token=jwe; Path=/; Expires=...; HttpOnly; SameSite=Lax",
      ],
      "authjs.session-token"
    );
    expect(out).toBe(
      "authjs.session-token=jwe; Path=/; Expires=...; HttpOnly; SameSite=Lax"
    );
  });

  it("returns null when the name is not present", () => {
    expect(
      pickSetCookie(["other=value"], "authjs.session-token")
    ).toBeNull();
  });

  it("returns the first match when the same name appears twice (shouldn't happen)", () => {
    const out = pickSetCookie(
      ["authjs.session-token=first", "authjs.session-token=second"],
      "authjs.session-token"
    );
    expect(out).toBe("authjs.session-token=first");
  });

  it("does not match prefixes (must start with name=)", () => {
    // A cookie named `authjs.session-token-extra` should NOT match a
    // lookup for `authjs.session-token`.
    expect(
      pickSetCookie(
        ["authjs.session-token-extra=evil"],
        "authjs.session-token"
      )
    ).toBeNull();
  });

  it("preserves attributes verbatim", () => {
    // Critical for the auto-login path: HttpOnly, Path, Expires,
    // SameSite, Secure must all survive.
    const out = pickSetCookie(
      [
        "authjs.session-token=jwe; Path=/; Expires=Sat, 14 Nov 2026 05:58:53 GMT; HttpOnly; SameSite=Lax",
      ],
      "authjs.session-token"
    );
    expect(out).toContain("HttpOnly");
    expect(out).toContain("Path=/");
    expect(out).toContain("Expires=");
    expect(out).toContain("SameSite=Lax");
  });
});
