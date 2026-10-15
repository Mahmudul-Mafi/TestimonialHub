/**
 * Slug format, normalization, and reserved-name enforcement.
 *
 * Format: 2..40 chars, lowercase alphanumeric, dashes allowed in the
 * middle, must start and end with an alphanumeric character. Single
 * character is not allowed (minimum 2). Underscores are NOT allowed.
 *
 * Reserved names: paths that would collide with application routes
 * (`/dashboard`, `/c`, `/widgets`, `/api`, `/login`, `/register`, etc.)
 * and known sensitive segments. The reserved list is enforced in
 * addition to format validation.
 */

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "c",
  "collections",
  "dashboard",
  "docs",
  "embed",
  "help",
  "home",
  "login",
  "logout",
  "pricing",
  "privacy",
  "register",
  "settings",
  "signup",
  "static",
  "status",
  "support",
  "terms",
  "testimonials",
  "user",
  "users",
  "widget",
  "widgets",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export type SlugValidation =
  | { ok: true; slug: string }
  | { ok: false; code: SlugErrorCode; message: string };

export type SlugErrorCode =
  | "empty"
  | "too_long"
  | "invalid_format"
  | "reserved";

const MESSAGES: Record<SlugErrorCode, string> = {
  empty: "Slug cannot be empty.",
  too_long: "Slug must be 40 characters or fewer.",
  invalid_format:
    "Slug must be lowercase letters, digits, or dashes, and start and end with a letter or digit.",
  reserved:
    "This slug is reserved. Please choose a different one.",
};

/**
 * Normalize a user-supplied slug: trim, lower-case, and replace runs of
 * non-allowed characters with a single dash. This is a best-effort cleanup
 * for forms where the user types free text; it is NOT a substitute for
 * final validation.
 */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function validateSlug(input: string): SlugValidation {
  if (!input || input.length === 0) {
    return { ok: false, code: "empty", message: MESSAGES.empty };
  }
  if (input.length > 40) {
    return { ok: false, code: "too_long", message: MESSAGES.too_long };
  }
  if (!SLUG_PATTERN.test(input)) {
    return {
      ok: false,
      code: "invalid_format",
      message: MESSAGES.invalid_format,
    };
  }
  if (RESERVED_SLUGS.has(input)) {
    return { ok: false, code: "reserved", message: MESSAGES.reserved };
  }
  return { ok: true, slug: input };
}
