/**
 * Extract every `Set-Cookie` line from a `Headers`-like object, handling
 * both modern undici (`Headers.getSetCookie()` returning `string[]`) and
 * the legacy single joined header returned by `Headers.get("set-cookie")`.
 *
 * Used by the auto-login flow in `/api/auth/register`, where the server
 * fetches `/api/auth/csrf` and `/api/auth/callback/credentials`, then needs
 * to forward the `authjs.session-token` cookie to the original client.
 * Misparsing these headers would either drop the session cookie or leak
 * unrelated cookies into the response.
 */
export function readSetCookies(
  headers: {
    get(name: string): string | null;
    getSetCookie?(): string[];
  }
): string[] {
  const maybe = headers.getSetCookie;
  if (typeof maybe === "function") {
    try {
      const arr = maybe.call(headers);
      if (arr && arr.length) return arr;
    } catch {
      // fall through to legacy path
    }
  }
  const single = headers.get("set-cookie");
  if (!single) return [];
  // Split a joined Set-Cookie header on `, <name>=` boundaries. This is
  // the standard format used when proxies concatenate multiple
  // Set-Cookie headers into one.
  return single.split(/, (?=[^ ;]+=)/);
}

/**
 * Find a Set-Cookie line for the given cookie name and return it
 * verbatim (preserving attributes such as HttpOnly, Path, Max-Age,
 * SameSite, Secure). Returns null when not found.
 *
 * Intentionally does NOT strip attributes — callers that need only the
 * `name=value` pair should split on the first `;` themselves.
 */
export function pickSetCookie(headers: string[], name: string): string | null {
  for (const header of headers) {
    if (header.startsWith(`${name}=`)) {
      return header;
    }
  }
  return null;
}
