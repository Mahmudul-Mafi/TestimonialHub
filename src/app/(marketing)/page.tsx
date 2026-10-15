import Link from "next/link";
import type { Metadata } from "next";
import { PLAN_PRICING } from "@/lib/plans";
import { DisabledLink } from "@/components/ui/disabled-link";

export const metadata: Metadata = {
  title: "Collect and display customer testimonials",
  description:
    "TestimonialHub helps freelancers, creators, and small businesses collect, moderate, and display customer testimonials on a public page or embedded widget.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TestimonialHub — collect and display customer testimonials",
    description:
      "A polished, multi-tenant platform for freelancers, creators, and small businesses. Share a link, approve submissions, and display real customer voices on your public page or any website.",
    type: "website",
    siteName: "TestimonialHub",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "TestimonialHub — collect and display customer testimonials",
    description:
      "A polished, multi-tenant platform for freelancers, creators, and small businesses.",
  },
};

const features = [
  {
    title: "Shareable submission forms",
    body: "Send a single link or embed a form on your site. Submitters enter their name, email, message, and a 1–5 star rating. Email stays private.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Moderation you control",
    body: "Every submission starts as Pending. Approve, reject, or re-review later. Only Approved testimonials ever appear publicly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Public pages & widgets",
    body: "A clean public page at /c/your-slug plus embeddable grid and carousel widgets for any site.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Tenant isolation",
    body: "Every account sees only its own collections, testimonials, and widgets. Authorization is enforced server-side on every operation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "CSV export with safety",
    body: "Export your testimonials with spreadsheet formula-injection protection. No submitter email ever leaves your account.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Free to start",
    body: "Up to 2 collections, 50 testimonials, and 2 widgets on the Free plan. Upgrade any time for unlimited resources and no branding.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "Do my submitters need an account?",
    a: "No. They open your public submission link, type their testimonial, and submit. They never see a sign-in screen.",
  },
  {
    q: "Are testimonial emails exposed publicly?",
    a: "Never. Submitter email addresses are private to the collection owner and are stripped from every public and widget response.",
  },
  {
    q: "What happens to my data if I cancel the Paid plan?",
    a: "Resources you've already created are preserved. If you go over a Free limit, you simply cannot add more until you delete some. Nothing is automatically deleted.",
  },
  {
    q: "Can I remove the TestimonialHub branding?",
    a: "Yes, on the Paid plan. The Free plan shows a small 'Powered by TestimonialHub' attribution on public pages and widgets.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-950/40 dark:via-gray-950 dark:to-gray-950" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/60 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur dark:border-brand-900 dark:bg-gray-900/60 dark:text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> TestimonialHub v0.1
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              The simplest way to collect and show
              <span className="block bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                customer testimonials.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              A polished, multi-tenant platform for freelancers, creators, and small businesses. Share a link, approve submissions, and display real customer voices on your public page or any website.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="focus-ring inline-flex h-12 items-center justify-center rounded-md bg-brand-600 px-6 text-base font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Start free
              </Link>
              <Link
                href="/#features"
                className="focus-ring inline-flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-6 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                See features
              </Link>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">No credit card required. 2 collections, 50 testimonials, 2 widgets on the Free plan.</p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div
              className="rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-900"
              role="img"
              aria-label="Sample testimonial wall. Names, roles, and quotes below are illustrative examples of how approved testimonials appear on a public collection page."
            >
              <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900/60">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">/c/your-slug</span>
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Sample
                  </span>
                </div>
                <div className="grid gap-6 p-8 sm:grid-cols-2">
                  {[
                    { name: "Sample user A", role: "Marketing Lead", rating: 5, body: "Set up took five minutes. We had our first testimonial the same hour." },
                    { name: "Sample user B", role: "Founder, Example Co.", rating: 5, body: "The embeddable widget was the killer feature for us. Drop-in iframe and done." },
                    { name: "Sample user C", role: "Creator", rating: 4, body: "Clean, fast, and the moderation flow is exactly what I needed." },
                    { name: "Sample user D", role: "CTO, Example Inc.", rating: 5, body: "Privacy and tenant isolation are first-class. We trust this with our customers." },
                  ].map((t) => (
                    <figure key={t.name} className="rounded-lg border border-gray-100 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-900/40">
                      <div className="flex items-center gap-1 text-yellow-500" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} viewBox="0 0 20 20" width="16" height="16" className={`h-4 w-4 ${i < t.rating ? "fill-current" : "fill-gray-300 dark:fill-gray-700"}`} aria-hidden="true">
                            <path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.4l-5.3 2.7 1-5.8L1.5 7.2l5.9-.9L10 1z" />
                          </svg>
                        ))}
                      </div>
                      <blockquote className="mt-3 text-sm text-gray-700 dark:text-gray-300">“{t.body}”</blockquote>
                      <figcaption className="mt-3 text-xs font-medium text-gray-900 dark:text-gray-100">
                        {t.name} <span className="text-gray-500 dark:text-gray-400">· {t.role}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
              Preview of a public collection page. Names and quotes above are sample placeholders, not real customer endorsements.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">Everything you need to launch a testimonial wall</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Built for solo operators and small teams. No marketing jargon, no enterprise upsell.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-gray-200 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-950/50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Start free. Upgrade when you outgrow it.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            <PricingCard
              name={PLAN_PRICING.free.name}
              price={0}
              tagline={PLAN_PRICING.free.tagline}
              cta={{ label: "Start free", href: "/register" }}
              features={[
                "2 collections",
                "50 testimonials (all statuses)",
                "2 active widgets",
                "Email + password auth",
                "Public collection page",
                "Powered by TestimonialHub badge",
              ]}
            />
            <PricingCard
              name={PLAN_PRICING.paid.name}
              price={PLAN_PRICING.paid.price}
              tagline={PLAN_PRICING.paid.tagline}
              cta={{ label: "Billing not available yet", href: "/register", disabled: true }}
              features={[
                "Unlimited collections",
                "Unlimited testimonials",
                "Unlimited widgets",
                "Remove TestimonialHub branding",
                "Priority support",
              ]}
              highlight
            />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-gray-500 dark:text-gray-400">
            Paid-plan billing is not available in the current release. The features above describe the intended
            plan; pricing, currency, and availability are subject to change. Free plan accounts are not charged
            and never expire.
          </p>
        </div>
      </section>

      <section id="faq" className="border-t border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">Frequently asked questions</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-lg border border-gray-200 bg-white p-5 open:shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded text-base font-medium text-gray-900 dark:text-white">
                  <span>{f.q}</span>
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4 flex-none text-gray-500 transition-transform group-open:rotate-180 dark:text-gray-400"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 8l5 5 5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-950/50">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">Ready to collect your first testimonial?</h2>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-300">Free forever. No credit card.</p>
          <div className="mt-6">
            <Link
              href="/register"
              className="focus-ring inline-flex h-12 items-center justify-center rounded-md bg-brand-600 px-6 text-base font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Create your account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function PricingCard({
  name,
  price,
  tagline,
  features,
  cta,
  highlight = false,
}: {
  name: string;
  price: number;
  tagline: string;
  features: string[];
  cta: { label: string; href: string; disabled?: boolean };
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border-2 border-brand-600 bg-white p-6 shadow-lg dark:bg-gray-900"
          : "rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      }
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
        {highlight ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
            Most popular
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{tagline}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">${price}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/ month</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 flex-none text-brand-600" aria-hidden="true">
              <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {cta.disabled ? (
        <DisabledLink
          href={cta.href}
          disabled
          className={
            highlight
              ? "mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white opacity-60"
              : "mt-6 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          }
        >
          {cta.label}
        </DisabledLink>
      ) : (
        <Link
          href={cta.href}
          className={
            highlight
              ? "focus-ring mt-6 inline-flex w-full items-center justify-center rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              : "focus-ring mt-6 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          }
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
