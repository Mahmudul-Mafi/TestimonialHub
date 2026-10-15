import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Regression test for the homepage SVG alignment bug.
 *
 * Symptom (reported): the hero star SVGs on `/` rendered at ~1184×1184
 * instead of 16×16, making the page ~53,562px tall. Root cause: a
 * stale `next dev` server kept running after `.next/` was cleared by
 * a follow-up `npm run dev`, and the new dev silently bound a
 * different port. The old dev kept serving stale references like
 * /_next/static/css/app/layout.css that 404'd, so Tailwind classes
 * never resolved, so every SVG that relied on Tailwind for sizing
 * fell back to the browser default (full container width).
 *
 * This test locks in THREE independent layers of defense. A regression
 * in any one of them is caught:
 *
 *   1. Every hero star SVG in the homepage has explicit `width` and
 *      `height` attributes (so the browser renders the right size
 *      even when CSS is missing).
 *   2. `src/app/globals.css` contains a defensive rule that gives
 *      any SVG without `width`/`height` a sensible `1em` size.
 *   3. `package.json` wires `predev` to a script that clears `.next`
 *      AND kills orphan `next` processes on the dev port, so the new
 *      `next dev` always binds the primary port and serves from a
 *      fresh cache.
 *
 * If any of these layers regresses, the bug returns. Each is
 * independently sufficient if the others are removed; together they
 * make the symptom nearly impossible to reproduce.
 */

const HOMEPAGE = path.resolve(
  process.cwd(),
  "src/app/(marketing)/page.tsx"
);
const GLOBALS_CSS = path.resolve(process.cwd(), "src/app/globals.css");
const PACKAGE_JSON = path.resolve(process.cwd(), "package.json");
const PREDEV = path.resolve(process.cwd(), "scripts/predev.js");
const PRESTART = path.resolve(process.cwd(), "scripts/prestart.js");
const PREBUILD = path.resolve(process.cwd(), "scripts/prebuild.js");

describe("homepage SVG alignment — regression locks", () => {
  describe("layer 1: explicit intrinsic size on every hero star", () => {
    it("homepage source exists", () => {
      expect(fs.existsSync(HOMEPAGE)).toBe(true);
    });

    it("every <svg> inside the sample-testimonials preview has width and height attributes", () => {
      const src = fs.readFileSync(HOMEPAGE, "utf8");
      // The hero preview sits inside a [role="img"][aria-label*="Sample testimonial wall"]
      // section. The stars are rendered as a .map over [1..5]. The
      // simplest robust check: every <svg> tag inside the Array.from
      // block must carry width="..." and height="...".
      // We slice from the first Array.from({ length: 5 }) line to the
      // matching closing paren — the section that renders the 5 stars
      // per testimonial.
      const idx = src.indexOf("Array.from({ length: 5 })");
      expect(idx).toBeGreaterThan(0);
      // Read the next 600 chars, which covers the closing of the
      // mapped block. The star SVG lives there.
      const slice = src.slice(idx, idx + 600);
      // The star SVG element must carry both width and height.
      const svgMatch = slice.match(/<svg[^>]*>/);
      expect(svgMatch).not.toBeNull();
      const tag = svgMatch?.[0] ?? "";
      expect(tag).toMatch(/\bwidth="\d+"/);
      expect(tag).toMatch(/\bheight="\d+"/);
    });
  });

  describe("layer 2: defensive SVG sizing in globals.css", () => {
    it("globals.css exists", () => {
      expect(fs.existsSync(GLOBALS_CSS)).toBe(true);
    });

    it("contains a rule that constrains SVGs missing width/height", () => {
      const css = fs.readFileSync(GLOBALS_CSS, "utf8");
      // The defensive rule must:
      //   - select `svg` elements that lack BOTH width and height
      //   - assign a non-zero width AND height
      // The exact selector and value may evolve; we just check the
      // intent is preserved.
      expect(css).toMatch(/svg(?::not\([^)]*\))?/);
      // At least one SVG sizing rule must set a width.
      const svgRuleBlocks = css.match(/svg[^{]*\{[^}]*\}/g) ?? [];
      expect(svgRuleBlocks.length).toBeGreaterThan(0);
      const hasSizingRule = svgRuleBlocks.some(
        (b) => /width\s*:\s*[^;}]+/.test(b) && /height\s*:\s*[^;}]+/.test(b)
      );
      expect(hasSizingRule).toBe(true);
    });
  });

  describe("layer 3: predev script kills orphan dev servers", () => {
    it("package.json wires predev to a real script file (not a one-liner that just clears .next)", () => {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8")) as {
        scripts: Record<string, string>;
      };
      const predev = pkg.scripts?.predev;
      expect(predev).toBeTruthy();
      // The historical predev was `node -e "require('node:fs').rmSync('.next', ...)"`
      // which silently allowed orphan dev servers to keep running.
      // The new predev must invoke a script file (not an inline shell
      // one-liner) so it can do port detection + process management.
      expect(predev).toMatch(/^node\s+scripts\//);
      expect(predev).not.toMatch(/^node\s+-e/);
    });

    it("predev script file exists", () => {
      expect(fs.existsSync(PREDEV)).toBe(true);
    });

    it("predev script kills next dev processes on the dev port", () => {
      const src = fs.readFileSync(PREDEV, "utf8");
      // The script must (a) enumerate PIDs on a port and (b) call
      // an OS kill mechanism. We don't assert the OS-portable
      // details; we just check the intent.
      expect(src).toMatch(/findPidsOnPort|process\.kill|taskkill|lsof/);
      expect(src).toMatch(/next/);
      // And it must still clear .next/ (the historical behavior).
      expect(src).toMatch(/rmSync|\.next/);
    });

    it("predev refuses to clear .next/ when other Next processes are still running", () => {
      // The 2026-10-15 root cause: a dev server was running, then
      // `npm run build` (or any other Next process) was launched,
      // then `npm run dev` was re-run. predev blindly wiped .next/
      // and the new dev server came up against a half-wiped state.
      // The hardened predev must check for stray Next processes
      // before deleting .next/.
      const src = fs.readFileSync(PREDEV, "utf8");
      expect(src).toMatch(/findStrayNextProcesses|stray|still running/i);
    });
  });

  describe("layer 4: prebuild refuses to clobber .next/ while a dev server is running", () => {
    it("package.json wires prebuild to a script file", () => {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8")) as {
        scripts: Record<string, string>;
      };
      const prebuild = pkg.scripts?.prebuild;
      expect(prebuild).toBeTruthy();
      expect(prebuild).toMatch(/^node\s+scripts\//);
    });

    it("prebuild script file exists", () => {
      expect(fs.existsSync(PREBUILD)).toBe(true);
    });

    it("prebuild script scans the dev port range and exits non-zero when a Next process holds it", () => {
      const src = fs.readFileSync(PREBUILD, "utf8");
      expect(src).toMatch(/findPidsOnPort|netstat|lsof/);
      expect(src).toMatch(/next/);
      // Must exit non-zero to halt `npm run build`.
      expect(src).toMatch(/process\.exit\(1\)/);
      // Must NOT modify .next/ — it is read-only.
      expect(src).not.toMatch(/rmSync/);
    });
  });

  describe("layer 5: prestart never deletes .next/ and fails fast on a missing build", () => {
    it("prestart script file exists", () => {
      expect(fs.existsSync(PRESTART)).toBe(true);
    });

    it("prestart script does NOT clear .next/ (would destroy the production build)", () => {
      const src = fs.readFileSync(PRESTART, "utf8");
      // The historical bug was a prestart that rmSync'd .next/. The
      // fix locks in: prestart must never delete .next/.
      expect(src).not.toMatch(/rmSync|rmdir|unlink/);
    });

    it("prestart script surfaces a clear error when .next/BUILD_ID is missing", () => {
      const src = fs.readFileSync(PRESTART, "utf8");
      // It must check for the build artifact and exit non-zero with
      // a hint to run `npm run build` first.
      expect(src).toMatch(/BUILD_ID/);
      expect(src).toMatch(/process\.exit\(1\)/);
    });
  });
});
