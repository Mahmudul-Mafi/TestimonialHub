import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Terms</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: 14 October 2026</p>
      <div className="prose prose-gray mt-6 max-w-none text-sm text-gray-700 dark:text-gray-300">
        <p>
          TestimonialHub is a learning and portfolio project. By using it you agree to use it lawfully and
          to be responsible for the content you publish.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Your content</h2>
        <p>
          You retain ownership of the content you submit. You give us a limited license to display it
          through the public pages and widgets you create, and to use it to operate the service.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Prohibited use</h2>
        <ul>
          <li>Submitting testimonials you know to be false or that you don&apos;t have permission to publish.</li>
          <li>Using the service to harass, defame, or impersonate others.</li>
          <li>Attempting to bypass the Free-plan limits through automated means.</li>
        </ul>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">No warranty</h2>
        <p>
          This is provided as-is. There is no guarantee of availability, accuracy, or fitness for a
          particular purpose.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Changes</h2>
        <p>
          These terms may be updated as the project evolves. Continued use after an update constitutes
          acceptance.
        </p>
      </div>
    </div>
  );
}
