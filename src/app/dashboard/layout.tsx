import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/require-user";
import { SideNav } from "@/components/dashboard/side-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  // headers() is included so this layout is dynamic; without it Next.js
  // might try to statically optimize the dashboard shell.
  await headers();
  const h = await headers();
  const pathname = h.get("x-invoke-path") ?? h.get("x-pathname") ?? "/dashboard";
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <SideNav pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
