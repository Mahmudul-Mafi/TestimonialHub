import { describe, it, expect } from "vitest";

/**
 * Lightweight smoke test for the standalone /c/[slug]/submit fallback
 * route.
 *
 * The page is a Next.js Server Component that pulls in Prisma and
 * next/navigation transitively, which makes a full module load
 * impractical from vitest. Instead we verify the contract that
 * matters for the modal work:
 *
 *   1. The standalone page file still exists at the expected path.
 *   2. The standalone page still imports <SubmitForm> from
 *      ./submit-form.
 *   3. The standalone page does NOT mount the modal — the modal is
 *      layered onto the public collection page only.
 *   4. The SubmitForm function still accepts an optional `onDone`
 *      prop (typed but not required), so the standalone page keeps
 *      working without a callback.
 *
 * These are read-only assertions against the on-disk source, so the
 * test does not need to instantiate React or hit a database.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const PAGE_PATH = path.resolve(process.cwd(), "src/app/c/[slug]/submit/page.tsx");
const FORM_PATH = path.resolve(process.cwd(), "src/app/c/[slug]/submit/submit-form.tsx");
const MODAL_PATH = path.resolve(process.cwd(), "src/app/c/[slug]/submit-modal.tsx");

describe("/c/[slug]/submit page (fallback route)", () => {
  it("standalone page file exists", () => {
    expect(fs.existsSync(PAGE_PATH)).toBe(true);
  });

  it("standalone page still imports the existing SubmitForm Client Component", () => {
    const src = fs.readFileSync(PAGE_PATH, "utf8");
    expect(src).toMatch(/import\s*\{[^}]*SubmitForm[^}]*\}\s*from\s*"\.\/submit-form"/);
  });

  it("standalone page does NOT mount the modal (modal is layered on the collection page only)", () => {
    const src = fs.readFileSync(PAGE_PATH, "utf8");
    expect(src).not.toMatch(/SubmitModal/);
  });

  it("standalone page still hits the same /api/public/[slug]/submit endpoint via the form", () => {
    // The form (which the page renders) POSTs to the public submit
    // route. We assert against the form's source rather than the
    // page's, since the page delegates to <SubmitForm>.
    const formSrc = fs.readFileSync(FORM_PATH, "utf8");
    expect(formSrc).toMatch(/\/api\/public\//);
  });

  it("SubmitForm accepts the optional onDone prop used by the modal", () => {
    const formSrc = fs.readFileSync(FORM_PATH, "utf8");
    // The form's type must declare onDone as an optional prop and
    // the handler must call onDone?.() so the modal can dismiss.
    expect(formSrc).toMatch(/onDone\?:\s*\(\)\s*=>\s*void/);
    expect(formSrc).toMatch(/onDone\?\.\(\)/);
  });

  it("the modal file exists and lives next to the page", () => {
    expect(fs.existsSync(MODAL_PATH)).toBe(true);
  });
});
