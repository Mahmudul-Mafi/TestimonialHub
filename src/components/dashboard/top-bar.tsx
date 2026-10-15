import { getCurrentUser } from "@/lib/auth/require-user";
import { getSubscriptionForUser } from "@/lib/collections/queries";
import { planFor, FREE_LIMITS } from "@/lib/plans";

export async function TopBar({ title, description }: { title: string; description?: string }) {
  const user = await getCurrentUser();
  const subscription = user ? await getSubscriptionForUser(user.id) : null;
  const plan = planFor(subscription);
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              plan === "paid"
                ? "inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                : "inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
            }
          >
            {plan === "paid" ? "Paid plan" : "Free plan"}
          </span>
          {user ? (
            <div className="hidden text-right text-xs text-gray-500 sm:block dark:text-gray-400">
              <div className="font-medium text-gray-900 dark:text-gray-100">{user.name ?? user.email}</div>
              <div>2 collections · 50 testimonials · 2 widgets</div>
              {plan === "free" ? (
                <div className="text-[10px] text-gray-400">Free limits: {FREE_LIMITS.maxCollections}/{FREE_LIMITS.maxTestimonials}/{FREE_LIMITS.maxActiveWidgets}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
