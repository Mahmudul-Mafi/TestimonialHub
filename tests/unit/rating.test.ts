import { describe, it, expect } from "vitest";

import { submissionSchema, type SubmissionInput } from "@/lib/public/submission-schema";

const validInput: SubmissionInput = {
  submitterName: "Ada Lovelace",
  submitterEmail: "ada@example.com",
  company: "Analytical Engine Co.",
  role: "Founder",
  body: "A truly polished, multi-tenant platform.",
  rating: 5,
};

describe("submissionSchema.rating", () => {
  it("accepts each integer rating 1..5", () => {
    for (const r of [1, 2, 3, 4, 5]) {
      const result = submissionSchema.safeParse({ ...validInput, rating: r });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(r);
      }
    }
  });

  it("rejects rating = 0", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects rating = 6", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: 6 });
    expect(r.success).toBe(false);
  });

  it("rejects fractional rating (4.5)", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: 4.5 });
    expect(r.success).toBe(false);
  });

  it("rejects negative rating (-1)", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects string rating ('5')", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: "5" });
    expect(r.success).toBe(false);
  });

  it("rejects null rating", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: null });
    expect(r.success).toBe(false);
  });

  it("rejects missing rating", () => {
    const { rating, ...rest } = validInput;
    void rating;
    const r = submissionSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it("rejects rating submitted as a JS string of digits ('4')", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: "4" });
    expect(r.success).toBe(false);
  });

  it("rejects NaN", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: Number.NaN });
    expect(r.success).toBe(false);
  });

  it("rejects Infinity", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: Number.POSITIVE_INFINITY });
    expect(r.success).toBe(false);
  });

  it("accepts the smallest valid body when rating is at the boundary (1)", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: 1, body: "1234567890" });
    expect(r.success).toBe(true);
  });

  it("accepts the smallest valid body when rating is at the boundary (5)", () => {
    const r = submissionSchema.safeParse({ ...validInput, rating: 5, body: "1234567890" });
    expect(r.success).toBe(true);
  });
});

describe("submissionSchema — existing fields preserved", () => {
  it("rejects an invalid email even with a valid rating", () => {
    const r = submissionSchema.safeParse({ ...validInput, submitterEmail: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects a too-short body even with a valid rating", () => {
    const r = submissionSchema.safeParse({ ...validInput, body: "short" });
    expect(r.success).toBe(false);
  });

  it("accepts an input with no company/role (optional fields)", () => {
    const r = submissionSchema.safeParse({ ...validInput, company: undefined, role: undefined });
    expect(r.success).toBe(true);
  });
});
