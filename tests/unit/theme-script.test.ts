import { describe, it, expect } from "vitest";
import {
  getThemeScript,
  THEME_STORAGE_KEY,
  type Theme,
  type ResolvedTheme,
} from "@/lib/theme/theme-script";

describe("getThemeScript", () => {
  it("returns a non-empty string", () => {
    const s = getThemeScript();
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });

  it("stays under 2 KB to keep the pre-hydration payload small", () => {
    // 2 KB is generous; the actual script is well under 1 KB. This is
    // a regression guard against accidental bloat.
    expect(getThemeScript().length).toBeLessThan(2_000);
  });

  it("reads the persisted choice from localStorage under the documented key", () => {
    const s = getThemeScript();
    expect(s).toContain(THEME_STORAGE_KEY);
    expect(s).toMatch(/localStorage\.getItem\(/);
  });

  it("falls back to prefers-color-scheme when no choice is stored", () => {
    const s = getThemeScript();
    expect(s).toContain("prefers-color-scheme: dark");
    expect(s).toMatch(/matchMedia/);
  });

  it("applies the .dark class on documentElement and removes it when light", () => {
    // The minified script aliases `classList` to a local var (`c`).
    // We assert both the aliasing pattern and the add/remove calls.
    const s = getThemeScript();
    expect(s).toContain("documentElement.classList");
    expect(s).toMatch(/\.add\(["']dark["']\)/);
    expect(s).toMatch(/\.remove\(["']dark["']\)/);
  });

  it("is wrapped in a defensive try/catch so privacy-mode localStorage is a no-op", () => {
    const s = getThemeScript();
    expect(s).toMatch(/try\s*\{/);
    expect(s).toMatch(/catch\s*\(/);
  });

  it("targets the <html> element via documentElement", () => {
    const s = getThemeScript();
    expect(s).toContain("documentElement");
  });
});

describe("theme types", () => {
  it("THEME_STORAGE_KEY is a stable string", () => {
    expect(THEME_STORAGE_KEY).toBe("theme");
  });

  it("Theme and ResolvedTheme type exports compile (smoke check)", () => {
    // If the type aliases are removed, this file fails to compile.
    // We don't need runtime assertions; the typecheck step covers this.
    const themes: Theme[] = ["light", "dark", "system"];
    const resolved: ResolvedTheme[] = ["light", "dark"];
    expect(themes).toHaveLength(3);
    expect(resolved).toHaveLength(2);
  });
});
