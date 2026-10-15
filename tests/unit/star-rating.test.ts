import { describe, it, expect, afterEach } from "vitest";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { StarRating } from "@/components/ui/star-rating";

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
});

function mount(node: React.ReactNode): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(node);
  });
  return container;
}

function controlled(initial: number | null = null, onChange?: (n: number) => void) {
  function C() {
    const [v, setV] = React.useState<number | null>(initial);
    return React.createElement(StarRating, {
      id: "rating",
      name: "rating",
      label: "Your rating",
      value: v,
      onChange: (n: number) => {
        setV(n);
        onChange?.(n);
      },
    });
  }
  return React.createElement(C);
}

function clickStar(container: HTMLElement, value: string) {
  const input = container.querySelector<HTMLInputElement>(
    `input[type="radio"][name="rating"][value="${value}"]`
  );
  if (!input) throw new Error(`star input value=${value} not found`);
  act(() => {
    input.click();
  });
}

function keyOnGroup(container: HTMLElement, key: string) {
  const group = container.querySelector<HTMLElement>('[role="radiogroup"]');
  if (!group) throw new Error("radiogroup not found");
  act(() => {
    group.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

describe("StarRating", () => {
  it("renders five radio inputs named 'rating' with values 1..5", () => {
    const c = mount(controlled());
    const radios = c.querySelectorAll<HTMLInputElement>('input[type="radio"][name="rating"]');
    expect(radios).toHaveLength(5);
    expect(Array.from(radios).map((r) => r.value)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("uses role=radiogroup and has an accessible name", () => {
    const c = mount(controlled());
    const group = c.querySelector<HTMLElement>('[role="radiogroup"]');
    expect(group).toBeTruthy();
    expect(group?.getAttribute("aria-labelledby")).toBe("rating-label");
  });

  it("each option has a unique, descriptive aria-label", () => {
    const c = mount(controlled());
    const radios = c.querySelectorAll<HTMLInputElement>('input[type="radio"][name="rating"]');
    const labels = Array.from(radios).map((r) => r.getAttribute("aria-label"));
    expect(labels).toEqual([
      "1 out of 5 stars",
      "2 out of 5 stars",
      "3 out of 5 stars",
      "4 out of 5 stars",
      "5 out of 5 stars",
    ]);
  });

  it("clicking a star sets the corresponding value and checks the input", () => {
    const c = mount(controlled());
    clickStar(c, "4");
    const checked = c.querySelectorAll<HTMLInputElement>('input[type="radio"][name="rating"]:checked');
    expect(checked).toHaveLength(1);
    expect(checked[0]?.value).toBe("4");
  });

  it("selecting each rating 1..5 fires onChange with that integer", () => {
    for (let target = 1; target <= 5; target += 1) {
      const seen: number[] = [];
      const c = mount(controlled(null, (n) => seen.push(n)));
      clickStar(c, String(target));
      expect(seen).toEqual([target]);
      // Reset for next iteration.
      act(() => {
        root?.unmount();
      });
      root = null;
      container?.remove();
      container = null;
    }
  });

  it("arrow-key navigation moves the selection right and left", () => {
    const seen: number[] = [];
    const c = mount(controlled(3, (n) => seen.push(n)));
    keyOnGroup(c, "ArrowRight");
    keyOnGroup(c, "ArrowRight");
    keyOnGroup(c, "ArrowLeft");
    expect(seen).toEqual([4, 5, 4]);
  });

  it("clamps arrow-key navigation to the 1..5 range", () => {
    const seen: number[] = [];
    const c = mount(controlled(1, (n) => seen.push(n)));
    // Going left from 1 is a no-op.
    keyOnGroup(c, "ArrowLeft");
    keyOnGroup(c, "ArrowLeft");
    expect(seen).toEqual([]);
    // Right 4 times should clamp at 5.
    keyOnGroup(c, "ArrowRight");
    keyOnGroup(c, "ArrowRight");
    keyOnGroup(c, "ArrowRight");
    keyOnGroup(c, "ArrowRight");
    keyOnGroup(c, "ArrowRight");
    expect(seen[seen.length - 1]).toBe(5);
  });

  it("renders an error message with role=alert and wires aria-describedby", () => {
    const c = mount(
      React.createElement(StarRating, {
        id: "rating",
        name: "rating",
        label: "Your rating",
        value: null,
        onChange: () => {},
        error: "Please choose a rating.",
      })
    );
    const alert = c.querySelector<HTMLElement>('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toBe("Please choose a rating.");
    const group = c.querySelector<HTMLElement>('[role="radiogroup"]');
    expect(group?.getAttribute("aria-describedby")).toBe("rating-error");
  });

  it("marks itself required for assistive tech and form validation", () => {
    const c = mount(controlled());
    const group = c.querySelector<HTMLElement>('[role="radiogroup"]');
    expect(group?.getAttribute("aria-required")).toBe("true");
    const radios = c.querySelectorAll<HTMLInputElement>('input[type="radio"][name="rating"]');
    radios.forEach((r) => expect(r.required).toBe(true));
  });
});