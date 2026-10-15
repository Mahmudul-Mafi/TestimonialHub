import Link from "next/link";
import { signOut } from "@/lib/auth/auth";

const nav = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/collections", label: "Collections", icon: "stack" },
  { href: "/dashboard/testimonials", label: "Testimonials", icon: "chat" },
  { href: "/dashboard/widgets", label: "Widgets", icon: "code" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/dashboard/export", label: "Export", icon: "download" },
  { href: "/dashboard/collections", label: "Wall of Love", icon: "heart" },
  { href: "/dashboard/billing", label: "Billing", icon: "card" },
  { href: "/dashboard/settings", label: "Settings", icon: "cog" },
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <path d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    stack: <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    chat: <path d="M4 5h16v11H7l-3 3V5z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />,
    code: <path d="M8 6L2 12l6 6m8-12l6 6-6 6M14 4l-4 16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    chart: <path d="M4 19h16M7 16V9m5 7V5m5 11v-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
    download: <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    card: <path d="M3 7h18v10H3z M3 11h18" stroke="currentColor" strokeWidth="1.5" fill="none" />,
    heart: <path d="M12 20s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 10c0 5.65-7 10-7 10z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />,
    cog: (
      <>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.5-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.5 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}

export function SideNav({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 md:block">
      <Link href="/" className="mb-6 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span>TestimonialHub</span>
      </Link>
      <nav className="space-y-1">
        {nav.map((item, idx) => {
          // A pathname may match more than one nav entry when two
          // entries share an href (e.g. Collections and Wall of Love
          // both point at /dashboard/collections). We mark the first
          // match as active and treat later duplicates as inactive so
          // the highlighted state is unambiguous.
          const claimedActive = nav.slice(0, idx).some(
            (other) =>
              pathname === other.href ||
              (other.href !== "/dashboard" && pathname.startsWith(other.href))
          );
          const isActive =
            !claimedActive &&
            (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex items-center gap-3 rounded-md bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                  : "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="mt-6"
      >
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M14 4h-7a2 2 0 00-2 2v12a2 2 0 002 2h7M16 8l4 4-4 4M10 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Sign out</span>
        </button>
      </form>
    </aside>
  );
}
