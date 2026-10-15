import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Privacy / data-safety contract for the public Wall of Love.
 *
 * The page at /wall/[slug] is the most visible public surface in
 * TestimonialHub. It must:
 *
 *   1. Restrict to approved testimonials only (status filter at the
 *      Prisma `where`).
 *   2. Never include submitter email in the `select`.
 *   3. Never include status, internalNotes, approvedBy, or rejectedBy
 *      in the `select`.
 *   4. Exclude soft-deleted collections.
 *   5. Expose every testimonial `id` (so direct review links resolve
 *      to a stable, non-sequential anchor).
 *   6. Use the safe public id as the hash anchor (`#review-{id}`).
 *   7. Render a "Copy review link" affordance per card.
 *   8. Include a copyable embed-code block on the collection
 *      dashboard (via WallEmbedCode).
 *
 * We assert the contract against the on-disk source because the page
 * pulls in next-auth via MarketingHeader, which is not loadable in
 * vitest's happy-dom. This is the same pattern as
 * tests/unit/submit-page-fallback.test.ts.
 */

const WALL_PAGE = path.resolve(process.cwd(), "src/app/wall/[slug]/page.tsx");
const CARD = path.resolve(process.cwd(), "src/components/public/wall-testimonial-card.tsx");
const COPY = path.resolve(process.cwd(), "src/components/public/copy-review-link.tsx");
const DASH_EMBED = path.resolve(
  process.cwd(),
  "src/app/dashboard/collections/[id]/wall-embed.tsx"
);
const DASH_PAGE = path.resolve(
  process.cwd(),
  "src/app/dashboard/collections/[id]/page.tsx"
);
const CSS = path.resolve(process.cwd(), "src/app/globals.css");
const NEXT_CONFIG = path.resolve(process.cwd(), "next.config.ts");

describe("/wall/[slug] page — privacy / data-safety contract", () => {
  it("exists at the expected path", () => {
    expect(fs.existsSync(WALL_PAGE)).toBe(true);
  });

  it("queries the collection with deletedAt: null", () => {
    const src = fs.readFileSync(WALL_PAGE, "utf8");
    expect(src).toMatch(/prisma\.collection\.findFirst/);
    expect(src).toMatch(/deletedAt:\s*null/);
  });

  it("filters testimonials to status: approved", () => {
    const src = fs.readFileSync(WALL_PAGE, "utf8");
    expect(src).toMatch(/testimonials:\s*\{[\s\S]*?where:\s*\{[\s\S]*?status:\s*"approved"/);
  });

  it("selects the public-safe fields", () => {
    const src = fs.readFileSync(WALL_PAGE, "utf8");
    expect(src).toMatch(/select:\s*\{/);
    expect(src).toMatch(/id:\s*true/);
    expect(src).toMatch(/submitterName:\s*true/);
    expect(src).toMatch(/company:\s*true/);
    expect(src).toMatch(/role:\s*true/);
    expect(src).toMatch(/body:\s*true/);
    expect(src).toMatch(/rating:\s*true/);
    expect(src).toMatch(/createdAt:\s*true/);
  });

  it("does NOT select submitterEmail (privacy)", () => {
    const src = fs.readFileSync(WALL_PAGE, "utf8");
    // The select block must not reference submitterEmail.
    const selectMatch = src.match(/select:\s*\{([\s\S]*?)\}/);
    expect(selectMatch).not.toBeNull();
    const block = selectMatch?.[1] ?? "";
    expect(block).not.toMatch(/submitterEmail/);
  });

  it("does NOT select status / internalNotes / approvedBy / rejectedBy", () => {
    const src = fs.readFileSync(WALL_PAGE, "utf8");
    const selectMatch = src.match(/select:\s*\{([\s\S]*?)\}/);
    const block = selectMatch?.[1] ?? "";
    expect(block).not.toMatch(/status/);
    expect(block).not.toMatch(/internalNotes/);
    expect(block).not.toMatch(/approvedBy/);
    expect(block).not.toMatch(/rejectedBy/);
  });

  it("uses the testimonial id as the per-card hash anchor", () => {
    const cardSrc = fs.readFileSync(CARD, "utf8");
    expect(cardSrc).toMatch(/id=\{`review-\$\{testimonial\.id\}`\}/);
    expect(cardSrc).toMatch(/href=\{`#review-\$\{testimonial\.id\}`\}/);
  });

  it("renders a Copy review link button per card", () => {
    const cardSrc = fs.readFileSync(CARD, "utf8");
    expect(cardSrc).toMatch(/<CopyReviewLink/);
  });

  it("CopyReviewLink component targets the canonical wall URL with hash", () => {
    const cardSrc = fs.readFileSync(CARD, "utf8");
    expect(cardSrc).toMatch(/fullUrl\s*=\s*`\$\{baseUrl\}\$\{reviewPath\}`/);
    expect(cardSrc).toMatch(/reviewPath\s*=\s*`\/review-\$\{testimonial\.id\}`/);
  });

  it("CopyReviewLink writes to the clipboard on click and shows feedback", () => {
    const src = fs.readFileSync(COPY, "utf8");
    expect(src).toMatch(/navigator\.clipboard\?\.writeText/);
    expect(src).toMatch(/document\.execCommand\(["']copy["']\)/);
    expect(src).toMatch(/setCopied\(true\)/);
  });

  it("dashboard embeds the wall via copyable iframe snippet", () => {
    expect(fs.existsSync(DASH_EMBED)).toBe(true);
    const embedSrc = fs.readFileSync(DASH_EMBED, "utf8");
    expect(embedSrc).toMatch(/<iframe/);
    expect(embedSrc).toMatch(/wallUrl/);
    const dashSrc = fs.readFileSync(DASH_PAGE, "utf8");
    expect(dashSrc).toMatch(/<WallEmbedCode/);
    // The wall URL is built from appConfig.appUrl + /wall/ + slug —
    // the source may or may not include whitespace inside the
    // template literal; we just check the parts are present.
    expect(dashSrc).toMatch(/appConfig\.appUrl/);
    expect(dashSrc).toMatch(/\/wall\/\$\{collection\.slug\}/);
  });

  it("globals.css includes :target highlight and scroll-margin for direct review links", () => {
    const css = fs.readFileSync(CSS, "utf8");
    expect(css).toMatch(/:target/);
    expect(css).toMatch(/scroll-margin-top/);
  });

  it("next.config.ts allows the wall route to be framed by any origin", () => {
    const cfg = fs.readFileSync(NEXT_CONFIG, "utf8");
    expect(cfg).toMatch(/source:\s*"\/wall\/:slug"/);
    expect(cfg).toMatch(/frame-ancestors\s*\*/);
  });
});