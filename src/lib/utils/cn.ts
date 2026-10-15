/**
 * Tailwind-aware className joiner. Avoids pulling in a full class-variance
 * library for the small surface area we use.
 */
export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}
