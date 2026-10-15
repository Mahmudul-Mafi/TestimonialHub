import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Source-level tests for the dashboard <SideNav> nav order.
 *
 * The sidebar is the primary way the dashboard's features are
 * discoverable. We assert the rendered order matches the spec:
 *
 *   Overview → Collections → Testimonials → Widgets → Analytics →
 *   Export → Wall of Love → Billing → Settings
 *
 * These are read-only assertions against the on-disk source, so the
 * test does not need to instantiate React or hit a database.
 */

const SIDE_NAV = path.resolve(
  process.cwd(),
  "src/components/dashboard/side-nav.tsx"
);

describe("dashboard <SideNav> order", () => {
  it("side-nav file exists", () => {
    expect(fs.existsSync(SIDE_NAV)).toBe(true);
  });

  it("includes the Wall of Love entry directly above Billing", () => {
    const src = fs.readFileSync(SIDE_NAV, "utf8");
    // Capture the nav array contents. The nav is a const array of
    // { href, label, icon } objects; we read everything between the
    // array literal brackets to look at ordering.
    const arrayMatch = src.match(/const nav\s*=\s*\[([\s\S]*?)\]\s*as const/);
    expect(arrayMatch).not.toBeNull();
    const body = arrayMatch?.[1] ?? "";
    // Find the index of "Wall of Love" and "Billing" in the array body.
    const wallIdx = body.indexOf('label: "Wall of Love"');
    const billingIdx = body.indexOf('label: "Billing"');
    expect(wallIdx).toBeGreaterThanOrEqual(0);
    expect(billingIdx).toBeGreaterThanOrEqual(0);
    // Wall of Love must appear before Billing in the source order.
    expect(wallIdx).toBeLessThan(billingIdx);
  });

  it("preserves the relative order of all other items", () => {
    const src = fs.readFileSync(SIDE_NAV, "utf8");
    const order = [
      "Overview",
      "Collections",
      "Testimonials",
      "Widgets",
      "Analytics",
      "Export",
      "Wall of Love",
      "Billing",
      "Settings",
    ];
    let last = -1;
    for (const label of order) {
      const idx = src.indexOf(`label: "${label}"`);
      expect(idx, `missing nav label: ${label}`).toBeGreaterThanOrEqual(0);
      expect(idx, `nav label out of order: ${label}`).toBeGreaterThan(last);
      last = idx;
    }
  });

  it("uses an existing dashboard route for Wall of Love (no new route)", () => {
    // The Wall of Love entry must reuse an existing dashboard route
    // (the spec forbids inventing a new route). We assert the entry's
    // href starts with /dashboard/ and matches an existing route.
    const src = fs.readFileSync(SIDE_NAV, "utf8");
    const match = src.match(/href:\s*"([^"]+)"[^}]*label:\s*"Wall of Love"/);
    expect(match).not.toBeNull();
    const href = match?.[1] ?? "";
    expect(href.startsWith("/dashboard/")).toBe(true);
    // Sanity check: the href should match one of the existing pages.
    const allowed = [
      "/dashboard/collections",
      "/dashboard",
      "/dashboard/testimonials",
      "/dashboard/widgets",
      "/dashboard/analytics",
      "/dashboard/export",
      "/dashboard/billing",
      "/dashboard/settings",
    ];
    expect(allowed).toContain(href);
  });

  it("defines a heart icon for the Wall of Love entry", () => {
    const src = fs.readFileSync(SIDE_NAV, "utf8");
    expect(src).toMatch(/icon:\s*"heart"/);
    expect(src).toMatch(/heart:\s*</);
  });
});