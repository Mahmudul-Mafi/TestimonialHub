import { requireUser } from "@/lib/auth/require-user";
import { TopBar } from "@/components/dashboard/top-bar";
import { NameForm, PasswordForm, DeleteAccountForm } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <TopBar title="Settings" description="Account, password, and data controls." />
      <div className="space-y-6 p-4 sm:p-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your email is <span className="font-mono">{user.email}</span>. Contact support to change it.</p>
          <div className="mt-4">
            <NameForm currentName={user.name} />
          </div>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Password</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Changing your password signs out all other devices.</p>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="text-sm font-semibold text-red-900 dark:text-red-100">Delete account</h2>
          <p className="mt-1 text-sm text-red-800 dark:text-red-200">
            Permanently delete your account, all your collections, testimonials, widgets, and subscription data. Public pages will stop loading.
          </p>
          <div className="mt-4">
            <DeleteAccountForm />
          </div>
        </section>
      </div>
    </>
  );
}
