import { describe, it, expect } from "vitest";
import { validateSlug, normalizeSlug, RESERVED_SLUGS } from "@/lib/security/slug";

describe("validateSlug", () => {
  it("accepts simple alphanumeric slugs", () => {
    const r = validateSlug("acme");
    expect(r.ok).toBe(true);
  });

  it("accepts dashes in the middle", () => {
    expect(validateSlug("acme-corp").ok).toBe(true);
  });

  it("rejects leading dash", () => {
    const r = validateSlug("-acme");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("invalid_format");
  });

  it("rejects trailing dash", () => {
    const r = validateSlug("acme-");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("invalid_format");
  });

  it("rejects uppercase and underscores", () => {
    expect(validateSlug("Acme").ok).toBe(false);
    expect(validateSlug("acme_corp").ok).toBe(false);
  });

  it("rejects empty", () => {
    const r = validateSlug("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("empty");
  });

  it("rejects slugs longer than 40 characters", () => {
    const r = validateSlug("a".repeat(41));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("too_long");
  });

  it("rejects reserved slugs", () => {
    for (const reserved of ["admin", "api", "dashboard", "c", "login", "register", "widgets"]) {
      const r = validateSlug(reserved);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.code).toBe("reserved");
    }
  });
});

describe("normalizeSlug", () => {
  it("lowercases and replaces non-allowed characters", () => {
    expect(normalizeSlug("Acme Corp!")).toBe("acme-corp");
  });
  it("trims leading and trailing dashes", () => {
    expect(normalizeSlug("--hi--")).toBe("hi");
  });
  it("clamps to 40 characters", () => {
    expect(normalizeSlug("a".repeat(80)).length).toBe(40);
  });
});

describe("reserved slug list", () => {
  it("contains the application route roots", () => {
    expect(RESERVED_SLUGS.has("dashboard")).toBe(true);
    expect(RESERVED_SLUGS.has("api")).toBe(true);
    expect(RESERVED_SLUGS.has("c")).toBe(true);
    expect(RESERVED_SLUGS.has("widgets")).toBe(true);
  });
});
