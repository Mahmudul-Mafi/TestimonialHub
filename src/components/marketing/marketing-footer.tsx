import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row dark:text-gray-400">
        <p>© {new Date().getFullYear()} TestimonialHub. Built as a portfolio project.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="focus-ring rounded hover:text-gray-900 dark:hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="focus-ring rounded hover:text-gray-900 dark:hover:text-white">
            Terms
          </Link>
          <Link
            href="https://github.com/Mahmudul-Mafi/TestimonialHub"
            className="focus-ring rounded hover:text-gray-900 dark:hover:text-white"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
