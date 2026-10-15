"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Wraps the app with Auth.js v5's SessionProvider so that client components
 * can call `useSession`, `signIn`, and `signOut`. The provider re-uses
 * the JWT session returned by the server.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
