export function TestimonialCard({
  testimonial,
  brandColor,
}: {
  testimonial: {
    submitterName: string;
    company: string | null;
    role: string | null;
    body: string;
    rating: number;
    createdAt: string;
  };
  brandColor: string;
}) {
  return (
    <figure
      className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      style={{ borderTopColor: brandColor, borderTopWidth: 3 }}
    >
      <div className="flex items-center gap-1 text-yellow-500" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" width="16" height="16" className={`h-4 w-4 ${i < testimonial.rating ? "fill-current" : "fill-gray-300 dark:fill-gray-700"}`} aria-hidden="true">
            <path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.4l-5.3 2.7 1-5.8L1.5 7.2l5.9-.9L10 1z" />
          </svg>
        ))}
      </div>
      <blockquote className="mt-3 flex-1 text-sm text-gray-700 dark:text-gray-200">
        “{testimonial.body}”
      </blockquote>
      <figcaption className="mt-4 text-sm">
        <div className="font-semibold text-gray-900 dark:text-white">{testimonial.submitterName}</div>
        {(testimonial.role || testimonial.company) ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {[testimonial.role, testimonial.company].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </figcaption>
    </figure>
  );
}
