import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { CopyReviewLink } from "@/components/public/copy-review-link";

/**
 * Tests for the <CopyReviewLink> client component.
 *
 * The component:
 *   • renders a <button type="button"> with the URL encoded in the
 *     accessible name (so screen readers announce the destination)
 *   • on click, calls navigator.clipboard.writeText with the URL
 *   • falls back to a hidden-textarea + execCommand path when the
 *     Clipboard API is unavailable (e.g. insecure context)
 *   • briefly shows "Copied!" feedback
 *
 * Tests stub `navigator.clipboard` and assert the right URL is written
 * to the clipboard and the visible label flips to "Copied!".
 */

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
let originalClipboard: PropertyDescriptor | undefined;

afterEach(() => {
  if (root) {
    act(() => root!.unmount());
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
  if (originalClipboard) {
    Object.defineProperty(global.navigator, "clipboard", originalClipboard);
    originalClipboard = undefined;
  }
});

function mount(url: string) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(React.createElement(CopyReviewLink, { url }));
  });
  return container.querySelector<HTMLButtonElement>('[data-testid="copy-review-link"]');
}

function setClipboard(impl: { writeText: (s: string) => Promise<void> } | null) {
  originalClipboard = Object.getOwnPropertyDescriptor(global.navigator, "clipboard");
  Object.defineProperty(global.navigator, "clipboard", {
    configurable: true,
    value: impl ? { writeText: vi.fn(impl.writeText) } : undefined,
  });
}

beforeEach(() => {
  setClipboard({ writeText: async () => {} });
});

describe("CopyReviewLink", () => {
  it("renders a button with the URL in the accessible name", () => {
    const btn = mount("https://example.com/wall/slug#review-abc");
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute("aria-label")).toContain("https://example.com/wall/slug#review-abc");
  });

  it("copies the URL to the clipboard and shows 'Copied!' feedback", async () => {
    const writeText = vi.fn(async () => {});
    setClipboard({ writeText });
    const btn = mount("https://example.com/wall/slug#review-xyz")!;
    await act(async () => {
      btn.click();
    });
    // Allow promise microtasks to resolve.
    await new Promise((r) => setTimeout(r, 0));
    expect(writeText).toHaveBeenCalledWith("https://example.com/wall/slug#review-xyz");
    expect(btn.textContent).toMatch(/Copied/);
  });

  it("falls back to a textarea+execCommand when clipboard API is absent", async () => {
    setClipboard(null);
    const exec = vi.fn();
    const originalExec = (document as unknown as { execCommand?: (s: string) => boolean }).execCommand;
    (document as unknown as { execCommand: (s: string) => boolean }).execCommand = exec;
    try {
      const btn = mount("https://example.com/wall/slug#review-fb")!;
      await act(async () => {
        btn.click();
      });
      await new Promise((r) => setTimeout(r, 0));
      expect(exec).toHaveBeenCalledWith("copy");
    } finally {
      if (originalExec) {
        (document as unknown as { execCommand: (s: string) => boolean }).execCommand = originalExec;
      } else {
        delete (document as unknown as { execCommand?: (s: string) => boolean }).execCommand;
      }
    }
  });

  it("does not throw when the clipboard write rejects", async () => {
    setClipboard({ writeText: async () => { throw new Error("denied"); } });
    const btn = mount("https://example.com/wall/slug#review-err")!;
    // Click — the catch branch should swallow the rejection.
    await act(async () => {
      btn.click();
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(btn.textContent).not.toMatch(/Copied/);
  });
});