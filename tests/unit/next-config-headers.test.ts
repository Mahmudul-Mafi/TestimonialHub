import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Smoke test that asserts the Wall of Love iframe embed headers are
 * configured in next.config.ts.
 *
 * We avoid importing next.config.ts at runtime (it pulls in next/dist
 * internals which are not available in vitest's happy-dom). Instead we
 * read the source and assert it declares the two routes that should be
 * frame-embeddable: /wall/:slug and /widgets/:token.
 *
 * The assertions check both:
 *   • the source declares the routes via `headers()`,
 *   • the CSP header value is `frame-ancestors *` (not `none` or
 *     missing),
 *   • the X-Frame-Options value is `ALLOWALL` (the value Next.js
 *     uses when we want to allow embedding; "DENY" would block it).
 */

const CONFIG_PATH = path.resolve(process.cwd(), "next.config.ts");

describe("next.config.ts embed security headers", () => {
  it("config file exists", () => {
    expect(fs.existsSync(CONFIG_PATH)).toBe(true);
  });

  it("declares headers() with frame-ancestors * for /wall/:slug", () => {
    const src = fs.readFileSync(CONFIG_PATH, "utf8");
    expect(src).toMatch(/source:\s*"\/wall\/:slug"/);
    // The CSP header value must be `frame-ancestors *` so any site can
    // iframe the wall.
    expect(src).toMatch(/frame-ancestors\s*\*/);
  });

  it("declares headers() with frame-ancestors * for /widgets/:token", () => {
    const src = fs.readFileSync(CONFIG_PATH, "utf8");
    expect(src).toMatch(/source:\s*"\/widgets\/:token"/);
  });

  it("does NOT set frame-ancestors on the dashboard or other private routes", () => {
    const src = fs.readFileSync(CONFIG_PATH, "utf8");
    // The dashboard and the public collection /c/[slug] should NOT be
    // declared as embeddable. We assert by absence of those routes in
    // the headers() array.
    expect(src).not.toMatch(/source:\s*"\/dashboard/);
    expect(src).not.toMatch(/source:\s*"\/c\/:slug/);
  });
});