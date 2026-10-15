import { customAlphabet } from "nanoid";
import { validateSlug } from "@/lib/security/slug";

// URL-safe 32-char tokens for widget public IDs (PRD §3.5 FR-DIS-002).
// 21 chars gives us ~120 bits of entropy, ample for unguessable URLs.
const tokenChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const tokenLength = 21;
export const generateWidgetToken = customAlphabet(tokenChars, tokenLength);

/** CUID-friendly ID generator for use in routes that need a token. */
export function generatePublicToken(): string {
  return customAlphabet(tokenChars, tokenLength)();
}

/**
 * Suggest the next available slug by appending a numeric suffix. Useful
 * in the "create collection" form when the user picks a slug that's
 * already taken.
 */
export function suggestSlugVariant(
  base: string,
  takenSlugs: ReadonlySet<string>
): string {
  const validated = validateSlug(base);
  const root = validated.ok ? validated.slug : "collection";
  if (!takenSlugs.has(root)) return root;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${root}-${i}`;
    if (candidate.length > 40) break;
    if (!takenSlugs.has(candidate)) return candidate;
  }
  // Extremely unlikely; fall back to a random suffix.
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${root}-${suffix}`.slice(0, 40);
}
