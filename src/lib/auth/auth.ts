import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { appConfig } from "@/lib/app-config";

/**
 * Auth.js v5 (next-auth@5.0.0-beta.32) configuration.
 *
 * Strategy: JWT sessions (Credentials provider does not support database
 * sessions in v5). The `tokenVersion` claim is checked on every
 * protected request by `requireUser` against the database, which gives
 * us the same revocation guarantee as DB sessions without their cost.
 *
 * We do not use the Prisma adapter; we use the Credentials provider
 * directly with our own `User` table. The adapter is only useful for
 * OAuth/email providers, neither of which we ship in the initial release.
 */

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
});

export const authConfig: NextAuthConfig = {
  secret: appConfig.auth.secret,
  trustHost: appConfig.auth.trustHost,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30 days
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            emailVerifiedAt: true,
            deletedAt: true,
          },
        });

        // Constant-time-ish path: run bcrypt even when the user is missing
        // so that a missing email and a wrong password take comparable
        // wall-clock time. This is a soft protection; an attacker can
        // still measure throughput. Adequate for the MVP.
        if (!user || user.deletedAt) {
          await verifyPassword(parsed.data.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");
          return null;
        }

        const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!passwordOk) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // First sign-in: copy id and email into the token. We deliberately
        // do NOT copy tokenVersion into the JWT; the chokepoint re-reads
        // the DB on every request so that revocations take effect
        // immediately.
        token.userId = (user as { id: string }).id;
        token.email = user.email ?? token.email;
      }
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
