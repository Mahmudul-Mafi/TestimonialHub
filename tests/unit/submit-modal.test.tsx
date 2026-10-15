import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { SubmitModal } from "@/app/c/[slug]/submit-modal";

/**
 * Tests for the public-page submission modal.
 *
 * Renders <SubmitModal> directly. Drives interactions through the DOM.
 * Mocks global.fetch so the form's POST to /api/public/[slug]/submit
 * is intercepted without hitting a real server.
 */

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
let originalFetch: typeof fetch | undefined;

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
  if (originalFetch) {
    global.fetch = originalFetch;
    originalFetch = undefined;
  }
  document.body.style.overflow = "";
});

beforeEach(() => {
  originalFetch = global.fetch;
  // jsdom/happy-dom don't implement scrollTo in some cases; noop is fine.
});

function mountModal(props?: Partial<React.ComponentProps<typeof SubmitModal>>) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      React.createElement(SubmitModal, {
        slug: "my-portfolio",
        brandColor: "#000000",
        ...props,
      })
    );
  });
  return {
    trigger: () => container!.querySelector<HTMLButtonElement>('[data-testid="submit-modal-trigger"]'),
    dialog: () => document.querySelector<HTMLElement>('[data-testid="dialog-panel"]'),
    closeBtn: () => document.querySelector<HTMLButtonElement>('[data-testid="submit-modal-close"]'),
    backdrop: () => document.querySelector<HTMLElement>('[data-testid="dialog-backdrop"]'),
    input: (name: string) =>
      document.querySelector<HTMLInputElement>(`[data-testid="dialog-panel"] input[name="${name}"]`),
  };
}

function open() {
  const t = container!.querySelector<HTMLButtonElement>('[data-testid="submit-modal-trigger"]');
  act(() => {
    t!.click();
  });
  // Allow rAF to flush so the dialog has captured focus.
  return new Promise<void>((r) => setTimeout(r, 0));
}

async function fillAndSubmit(ratingValue: number | null) {
  const panel = document.querySelector<HTMLElement>('[data-testid="dialog-panel"]');
  if (!panel) throw new Error("dialog not open");
  // Set the input values via the DOM (controlled inputs reflect this).
  const setVal = (name: string, v: string) => {
    const el = panel.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${name}"]`
    );
    if (!el) throw new Error(`no input ${name}`);
    el.value = v;
    // Dispatch input event so React's onChange picks it up (the form
    // is uncontrolled so this is mostly a no-op, but it keeps the
    // browser semantics consistent).
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  setVal("submitterName", "Ada Lovelace");
  setVal("submitterEmail", "ada@example.com");
  setVal("company", "Co");
  setVal("role", "Founder");
  setVal("body", "This is a perfectly fine body of text.");

  // Pick a rating by clicking the corresponding star input if requested.
  if (ratingValue !== null) {
    const radio = panel.querySelector<HTMLInputElement>(
      `input[type="radio"][name="rating"][value="${ratingValue}"]`
    );
    if (!radio) throw new Error(`no rating ${ratingValue}`);
    act(() => {
      radio.click();
    });
  }

  // Submit the form by dispatching a real submit event on the form.
  // happy-dom does not always fire React's onSubmit from .click() on
  // a submit button, so we drive the form event directly.
  const form = panel.querySelector<HTMLFormElement>("form");
  if (!form) throw new Error("no form");
  const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
  await act(async () => {
    form.dispatchEvent(submitEvent);
  });
  // Allow any microtasks (fetch is async).
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

describe("SubmitModal", () => {
  it("renders only the trigger button when closed (no dialog in the DOM)", () => {
    const els = mountModal();
    expect(els.trigger()).toBeTruthy();
    expect(els.dialog()).toBeNull();
  });

  it("opens the modal without navigating", async () => {
    const els = mountModal();
    const beforePath = window.location.pathname;
    await open();
    expect(els.dialog()).toBeTruthy();
    expect(window.location.pathname).toBe(beforePath);
  });

  it("renders the existing submission form and star-rating inside the dialog", async () => {
    const els = mountModal();
    await open();
    const panel = els.dialog()!;
    expect(panel.querySelector('input[name="submitterName"]')).toBeTruthy();
    expect(panel.querySelector('input[name="submitterEmail"]')).toBeTruthy();
    expect(panel.querySelector('input[name="company"]')).toBeTruthy();
    expect(panel.querySelector('input[name="role"]')).toBeTruthy();
    expect(panel.querySelector('textarea[name="body"]')).toBeTruthy();
    expect(panel.querySelector('input[type="radio"][name="rating"]')).toBeTruthy();
    expect(panel.querySelector('[role="radiogroup"]')).toBeTruthy();
  });

  it("shows the rating-required error and does not close when submitted with no rating", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const els = mountModal();
    await open();
    await fillAndSubmit(null);
    // Modal must remain open.
    expect(els.dialog()).toBeTruthy();
    // No fetch should have been issued.
    expect(fetchMock).not.toHaveBeenCalled();
    // The rating error from the form should be visible.
    const ratingAlert = document.querySelector('[data-testid="dialog-panel"] [role="alert"]');
    expect(ratingAlert?.textContent).toMatch(/rating/i);
  });

  it("displays server errors without closing the modal", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Bad input." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    ) as unknown as typeof fetch;
    const els = mountModal();
    await open();
    await fillAndSubmit(4);
    expect(els.dialog()).toBeTruthy();
    const alerts = document.querySelectorAll('[data-testid="dialog-panel"] [role="alert"]');
    const errorTexts = Array.from(alerts).map((a) => a.textContent ?? "");
    expect(errorTexts.some((t) => t.includes("Bad input."))).toBe(true);
  });

  it("auto-closes after a successful submission", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, id: "x" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    ) as unknown as typeof fetch;
    const els = mountModal();
    await open();
    await fillAndSubmit(5);
    // The form should now show its success alert.
    const alerts = document.querySelectorAll('[data-testid="dialog-panel"] [role="alert"]');
    const successText = Array.from(alerts).map((a) => a.textContent ?? "").join(" ");
    expect(successText).toMatch(/Thanks/i);
    // The modal must still be open right after success (delay pending).
    expect(els.dialog()).toBeTruthy();
    // Wait for the auto-close delay (600ms) plus a buffer. Real
    // timers, no fakes — keeps the test environment simple.
    await new Promise((r) => setTimeout(r, 700));
    expect(els.dialog()).toBeNull();
  });

  it("closes when the close button is clicked", async () => {
    const els = mountModal();
    await open();
    expect(els.dialog()).toBeTruthy();
    act(() => {
      els.closeBtn()!.click();
    });
    expect(els.dialog()).toBeNull();
  });

  it("closes on Escape", async () => {
    const els = mountModal();
    await open();
    expect(els.dialog()).toBeTruthy();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(els.dialog()).toBeNull();
  });

  it("does not close when clicking inside the dialog", async () => {
    const els = mountModal();
    await open();
    act(() => {
      els.dialog()!.click();
    });
    expect(els.dialog()).toBeTruthy();
  });

  it("closes on backdrop click", async () => {
    const els = mountModal();
    await open();
    act(() => {
      els.backdrop()!.click();
    });
    expect(els.dialog()).toBeNull();
  });

  it("moves focus into the dialog on open and restores it to the trigger on close", async () => {
    const els = mountModal();
    const trigger = els.trigger()!;
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    await open();
    const active = document.activeElement as HTMLElement | null;
    expect(active?.closest('[data-testid="dialog-panel"]')).toBeTruthy();
    act(() => {
      els.closeBtn()!.click();
    });
    // After close, focus should be on the trigger.
    expect(document.activeElement).toBe(trigger);
  });
});
