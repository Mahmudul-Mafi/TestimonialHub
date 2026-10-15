import { TestimonialCard } from "@/components/public/testimonial-card";
import { CopyReviewLink } from "@/components/public/copy-review-link";

/**
 * WallOfLoveTestimonialCard — testimonial card with a stable direct
 * review link and a "Copy review link" action.
 *
 * The link target is `#review-{testimonial.id}` — `id` is a safe,
 * non-sequential CUID generated server-side and never exposed via any
 * field that could leak a counter. The same anchor is rendered as the
 * `id` on the wrapping <figure> so direct URLs scroll the page to the
 * review and the card highlights itself as the focused review.
 *
 * The component accepts a fully-resolved `baseUrl` so the same source
 * renders correctly server-side and in client tests.
 */
export function WallOfLoveTestimonialCard({
  testimonial,
  brandColor,
  baseUrl,
}: {
  testimonial: {
    id: string;
    submitterName: string;
    company: string | null;
    role: string | null;
    body: string;
    rating: number;
    createdAt: string;
  };
  brandColor: string;
  baseUrl: string;
}) {
  const reviewPath = `/review-${testimonial.id}`;
  const fullUrl = `${baseUrl}${reviewPath}`;
  return (
    <figure
      id={`review-${testimonial.id}`}
      data-testid="wall-card"
      className="group relative h-full"
    >
      {/* Anchor: a tiny invisible target so the URL bar shows /review-{id}
          even before any user interaction. Real focus / highlighting is
          driven by the :target CSS pseudo-class. */}
      <a
        href={`#review-${testimonial.id}`}
        aria-label={`Direct link to review by ${testimonial.submitterName}`}
        className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      />
      <div className="relative z-10 h-full">
        <TestimonialCard
          testimonial={{
            submitterName: testimonial.submitterName,
            company: testimonial.company,
            role: testimonial.role,
            body: testimonial.body,
            rating: testimonial.rating,
            createdAt: testimonial.createdAt,
          }}
          brandColor={brandColor}
        />
      </div>
      <div className="relative z-10 mt-2 flex items-center justify-between px-1 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {testimonial.submitterName} · {testimonial.rating}/5
        </span>
        <CopyReviewLink url={fullUrl} />
      </div>
    </figure>
  );
}