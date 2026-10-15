import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { Dialog } from "@/components/ui/dialog";

/**
 * Tests for the accessible Dialog primitive.
 *
 * The dialog portals to document.body and uses effects to manage focus,
 * scroll lock, and document-level keydown listeners. The tests mount
 * the dialog into a real container, drive events through the DOM, and
 * inspect document.activeElement / document.body.style.overflow to
 * assert behavior.
 */

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
  // Defensive: clear any leftover body overflow that the dialog should
  // have cleaned up. If this trips, the cleanup logic regressed.
  document.body.style.overflow = "";
});

/**
 * Mounts a tiny test harness that renders a trigger button outside the
 * dialog and the dialog itself. Returns the trigger and a getter for
 * the dialog panel.
 */
function mountHarness(opts: {
  open: boolean;
  onClose: () => void;
  titleId?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children?: React.ReactNode;
}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.textContent = "trigger";
  container.appendChild(trigger);
  root = createRoot(container);
  act(() => {
    root!.render(
      React.createElement(
        Dialog,
        {
          open: opts.open,
          onClose: opts.onClose,
          titleId: opts.titleId ?? "dialog-title",
          closeOnBackdrop: opts.closeOnBackdrop,
          closeOnEscape: opts.closeOnEscape,
        },
        React.createElement(
          "h2",
          { id: opts.titleId ?? "dialog-title" },
          "Test title"
        ),
        opts.children ?? React.createElement(
          "div",
          null,
          React.createElement("input", { "data-testid": "dlg-input", type: "text" }),
          React.createElement("button", { type: "button", "data-testid": "dlg-btn" }, "OK")
        )
      )
    );
  });
  // Flush effects (requestAnimationFrame, etc.).
  return { trigger, getPanel: () => document.querySelector('[data-testid="dialog-panel"]') as HTMLElement | null };
}

function getBackdrop(): HTMLElement | null {
  return document.querySelector('[data-testid="dialog-backdrop"]');
}

beforeEach(() => {
  // Reset any pre-existing body overflow between tests.
  document.body.style.overflow = "";
});

describe("Dialog", () => {
  it("renders nothing when open=false", () => {
    mountHarness({ open: false, onClose: () => {} });
    expect(document.querySelector('[data-testid="dialog-panel"]')).toBeNull();
    expect(getBackdrop()).toBeNull();
  });

  it("renders the dialog with role=dialog and aria-modal=true when open", () => {
    mountHarness({ open: true, onClose: () => {} });
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute("aria-modal")).toBe("true");
    expect(panel.getAttribute("aria-labelledby")).toBe("dialog-title");
    const title = document.getElementById("dialog-title");
    expect(title?.textContent).toBe("Test title");
  });

  it("moves keyboard focus into the dialog when it opens", async () => {
    const { trigger } = mountHarness({ open: true, onClose: () => {} });
    // The trigger was outside the dialog. After opening, focus should
    // have moved to the first focusable inside the dialog (the input).
    await new Promise((r) => setTimeout(r, 0));
    const active = document.activeElement;
    expect(active).not.toBe(trigger);
    const insideDialog = (active as HTMLElement)?.closest('[data-testid="dialog-panel"]');
    expect(insideDialog).toBeTruthy();
  });

  it("traps Tab forward on the last focusable by wrapping to the first", async () => {
    mountHarness({ open: true, onClose: () => {} });
    await new Promise((r) => setTimeout(r, 0));
    const input = document.querySelector<HTMLInputElement>('[data-testid="dlg-input"]');
    const btn = document.querySelector<HTMLButtonElement>('[data-testid="dlg-btn"]');
    // Focus the last focusable.
    btn?.focus();
    expect(document.activeElement).toBe(btn);
    // Dispatch a Tab (no shift) on the document.
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    });
    // The trap should have moved focus to the first focusable.
    expect(document.activeElement).toBe(input);
  });

  it("traps Shift+Tab on the first focusable by wrapping to the last", async () => {
    mountHarness({ open: true, onClose: () => {} });
    await new Promise((r) => setTimeout(r, 0));
    const input = document.querySelector<HTMLInputElement>('[data-testid="dlg-input"]');
    const btn = document.querySelector<HTMLButtonElement>('[data-testid="dlg-btn"]');
    input?.focus();
    expect(document.activeElement).toBe(input);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    });
    expect(document.activeElement).toBe(btn);
  });

  it("closes on Escape when closeOnEscape is the default", () => {
    const onClose = vi.fn();
    const { getPanel } = mountHarness({ open: true, onClose });
    const panel = getPanel();
    expect(panel).toBeTruthy();
    act(() => {
      panel!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    // The document-level listener catches Escape; firing it on the
    // panel bubbles up to document, so onClose should fire.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on Escape when closeOnEscape is false", () => {
    const onClose = vi.fn();
    const { getPanel } = mountHarness({ open: true, onClose, closeOnEscape: false });
    const panel = getPanel();
    act(() => {
      panel!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on backdrop click when closeOnBackdrop is the default", () => {
    const onClose = vi.fn();
    mountHarness({ open: true, onClose });
    const backdrop = getBackdrop();
    expect(backdrop).toBeTruthy();
    act(() => {
      backdrop!.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on backdrop click when closeOnBackdrop is false", () => {
    const onClose = vi.fn();
    mountHarness({ open: true, onClose, closeOnBackdrop: false });
    const backdrop = getBackdrop();
    act(() => {
      backdrop!.click();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when clicking inside the dialog panel", () => {
    const onClose = vi.fn();
    const { getPanel } = mountHarness({ open: true, onClose });
    const panel = getPanel();
    act(() => {
      panel!.click();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("restores focus to the trigger on close", async () => {
    // The realistic flow: trigger is mounted; user focuses it; user
    // opens the dialog; user closes the dialog; focus should be back
    // on the trigger.
    let setOpenOuter: (v: boolean) => void = () => {};
    function Harness() {
      const [open, setOpen] = React.useState(false);
      setOpenOuter = setOpen;
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "button",
          { type: "button", "data-testid": "trigger-outside", onClick: () => setOpen(true) },
          "open"
        ),
        React.createElement(
          Dialog,
          { open, onClose: () => setOpen(false), titleId: "t" },
          React.createElement("h2", { id: "t" }, "x"),
          React.createElement("input", { "data-testid": "dlg-input", type: "text" })
        )
      );
    }
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(React.createElement(Harness));
    });
    const trigger = container.querySelector<HTMLButtonElement>('[data-testid="trigger-outside"]');
    trigger?.focus();
    expect(document.activeElement).toBe(trigger);
    // Open the dialog (simulates user click on the trigger).
    act(() => {
      setOpenOuter(true);
    });
    await new Promise((r) => setTimeout(r, 0));
    // Focus should now be inside the dialog.
    const activeInsideDialog = (document.activeElement as HTMLElement)?.closest(
      '[data-testid="dialog-panel"]'
    );
    expect(activeInsideDialog).toBeTruthy();
    // Close by clicking the backdrop.
    act(() => {
      getBackdrop()?.click();
    });
    await new Promise((r) => setTimeout(r, 0));
    // Focus should be back on the trigger.
    expect(document.activeElement).toBe(trigger);
  });

  it("locks body scroll while open and restores it on close", () => {
    const onClose = vi.fn();
    document.body.style.overflow = "auto";
    // Mount open, observe lock, then close.
    function Step({ open }: { open: boolean }) {
      return React.createElement(
        Dialog,
        { open, onClose, titleId: "t" },
        React.createElement("h2", { id: "t" }, "x")
      );
    }
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(React.createElement(Step, { open: true }));
    });
    expect(document.body.style.overflow).toBe("hidden");
    act(() => {
      root!.render(React.createElement(Step, { open: false }));
    });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("restores body scroll on unmount even if the dialog was still open", () => {
    document.body.style.overflow = "";
    const onClose = vi.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(
        React.createElement(
          Dialog,
          { open: true, onClose, titleId: "t" },
          React.createElement("h2", { id: "t" }, "x")
        )
      );
    });
    expect(document.body.style.overflow).toBe("hidden");
    // Unmount while still open.
    act(() => {
      root!.unmount();
    });
    root = null;
    expect(document.body.style.overflow).toBe("");
  });
});
