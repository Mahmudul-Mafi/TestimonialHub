/**
 * Open-redirect guard for `?next=...` style parameters.
 *
 * Accepts only same-origin absolute paths. Anything else — protocol-relative
 * URLs, fully qualified URLs, backslash tricks, embedded whitespace, control
 * characters, or non-`/` inputs — falls back to a safe default.
 *
 * This is the *only* way the auth flow constructs a post-login /
 * post-registration redirect target. Callers must not bypass it.
 *
 * Examples:
 *   safeNext("/dashboard")                       -> "/dashboard"
 *   safeNext("/dashboard?x=1")                   -> "/dashboard?x=1"
 *   safeNext("/dashboard/")                      -> "/dashboard/"
 *   safeNext(undefined)                          -> "/dashboard"
 *   safeNext("//evil.com/path")                  -> "/dashboard"
 *   safeNext("http://evil.com")                  -> "/dashboard"
 *   safeNext("\\\\evil.com")                     -> "/dashboard"
 *   safeNext("/dashboard\nfoo")                  -> "/dashboard"
 *   safeNext("javascript:alert(1)")              -> "/dashboard"
 */
const SAFE_NEXT_PATTERN = /^\/(?![/\\])[^\s\\]*$/;

export const DEFAULT_NEXT = "/dashboard";

export function safeNext(value: string | undefined | null): string {
  if (!value) return DEFAULT_NEXT;
  if (typeof value !== "string") return DEFAULT_NEXT;
  if (value.length > 2048) return DEFAULT_NEXT;
  if (!SAFE_NEXT_PATTERN.test(value)) return DEFAULT_NEXT;
  return value;
}
