import { describe, it, expect } from "vitest";
import { escapeCsvCell, toCsv } from "@/lib/security/csv";

describe("escapeCsvCell", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("prefixes cells that start with formula trigger characters", () => {
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell("+1234567890")).toBe("'+1234567890");
    expect(escapeCsvCell("-1+1")).toBe("'-1+1");
    expect(escapeCsvCell("@vlookup")).toBe("'@vlookup");
  });

  it("quotes cells with commas, quotes, or newlines", () => {
    expect(escapeCsvCell("hello, world")).toBe('"hello, world"');
    expect(escapeCsvCell("she said \"hi\"")).toBe('"she said ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("combines formula-injection guard and quoting", () => {
    // = triggers the formula guard (prefix '), the comma forces RFC 4180
    // quoting, and any embedded " would be doubled — but ' is not special
    // in CSV and passes through literally.
    expect(escapeCsvCell("=cmd,'arg'")).toBe('"\'=cmd,\'arg\'"');
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF and cells with commas", () => {
    const out = toCsv([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(out).toBe("a,b\r\n1,2");
  });

  it("handles mixed types", () => {
    const out = toCsv([
      ["id", "score"],
      [1, 0.95],
    ]);
    expect(out).toBe("id,score\r\n1,0.95");
  });
});
