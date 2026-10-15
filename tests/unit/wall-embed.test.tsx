import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { WallEmbedCode } from "@/app/dashboard/collections/[id]/wall-embed";

/**
 * Tests for the dashboard's <WallEmbedCode> copy-to-clipboard block.
 *
 * The component renders:
 *   • the iframe snippet (containing the wallUrl) inside a <code>
 *   • a Copy button that writes the snippet to the clipboard
 *   • a direct link with the wallUrl
 *
 * The tests assert the snippet contains the wall URL, the direct link
 * points to it, and clicking Copy invokes the Clipboard API with the
 * exact snippet.
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

function mount(props: { wallUrl: string; height?: number }) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(React.createElement(WallEmbedCode, props));
  });
  return {
    code: container.querySelector<HTMLElement>('[data-testid="wall-embed-code"]'),
    copyBtn: container.querySelector<HTMLButtonElement>('[data-testid="wall-embed-copy"]'),
    link: container.querySelector<HTMLAnchorElement>('[data-testid="wall-public-link"]'),
  };
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

describe("WallEmbedCode", () => {
  it("renders an iframe snippet containing the wallUrl", () => {
    const { code } = mount({ wallUrl: "https://example.com/wall/your-slug" });
    expect(code).toBeTruthy();
    expect(code?.textContent).toContain("https://example.com/wall/your-slug");
    expect(code?.textContent).toMatch(/<iframe/);
  });

  it("renders a direct link to the wall", () => {
    const { link } = mount({ wallUrl: "https://example.com/wall/your-slug" });
    expect(link?.getAttribute("href")).toBe("https://example.com/wall/your-slug");
  });

  it("copies the snippet to the clipboard on click and shows 'Copied!'", async () => {
    const writeText = vi.fn(async () => {});
    setClipboard({ writeText });
    const { copyBtn, code } = mount({ wallUrl: "https://example.com/wall/your-slug" });
    await act(async () => {
      copyBtn!.click();
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(writeText).toHaveBeenCalledTimes(1);
    const calls = writeText.mock.calls as unknown as Array<[string]>;
    const passed = calls[0]?.[0];
    expect(passed).toContain("https://example.com/wall/your-slug");
    expect(passed).toContain("<iframe");
    expect(passed).toBe(code?.textContent);
    expect(copyBtn?.textContent).toMatch(/Copied/);
  });
});