import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export async function MarketingHeader() {
  const session = await auth();
  const isAuthed = Boolean(session?.user);
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-md font-semibold text-gray-900 dark:text-gray-100">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span>TestimonialHub</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/#features" className="focus-ring hidden rounded-md px-2 py-1 text-gray-600 hover:text-gray-900 sm:inline-block dark:text-gray-300 dark:hover:text-white">
            Features
          </Link>
          <Link href="/#pricing" className="focus-ring hidden rounded-md px-2 py-1 text-gray-600 hover:text-gray-900 sm:inline-block dark:text-gray-300 dark:hover:text-white">
            Pricing
          </Link>
          <Link href="/#faq" className="focus-ring hidden rounded-md px-2 py-1 text-gray-600 hover:text-gray-900 sm:inline-block dark:text-gray-300 dark:hover:text-white">
            FAQ
          </Link>
          <ThemeToggle />
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="focus-ring rounded-md bg-brand-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="focus-ring rounded-md px-3 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="focus-ring rounded-md bg-brand-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-brand-700"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
