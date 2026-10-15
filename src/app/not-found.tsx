import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-950">
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
        We couldn&apos;t find the page you were looking for. It may have been moved, deleted, or the link could be wrong.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Go home
        </Link>
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
