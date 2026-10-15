import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Privacy</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: 14 October 2026</p>
      <div className="prose prose-gray mt-6 max-w-none text-sm text-gray-700 dark:text-gray-300">
        <p>
          TestimonialHub is a learning and portfolio project. This page describes the data we collect when you
          use the product. It is not legal advice.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Data we collect</h2>
        <ul>
          <li>Your account email and a bcrypt-hashed password.</li>
          <li>The testimonials and collections you create.</li>
          <li>Submitter email addresses (private; never displayed publicly).</li>
        </ul>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">How we use it</h2>
        <p>
          Account data is used to authenticate you. Testimonials and collections are used to render the
          public pages and widgets you create. Submitter email addresses are stored privately to allow
          the owner to follow up if needed, and are never shown on public pages or widgets.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Data sharing</h2>
        <p>
          We do not sell personal data. We share data only with the service providers necessary to operate
          the product (hosting, email delivery, payment processing) and as required by law.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Account deletion</h2>
        <p>
          You can delete your account at any time from <Link href="/dashboard/settings" className="text-brand-600 underline">Settings</Link>.
          Deletion removes your collections, testimonials, and widgets from public pages immediately. Backup and
          operational-log retention may persist for a limited period.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">Contact</h2>
        <p>Questions? Open an issue on the project repository.</p>
      </div>
    </div>
  );
}
