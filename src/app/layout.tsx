import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getThemeScript } from "@/lib/theme/theme-script";

export const metadata: Metadata = {
  title: {
    default: "TestimonialHub",
    template: "%s · TestimonialHub",
  },
  description:
    "Collect, moderate, and display customer testimonials. Built for freelancers, creators, and small businesses.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Pre-hydration theme script. Runs before any React code so the
          <html> element already has the correct `.dark` class on first
          paint and there is no flash of wrong theme.
        */}
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeScript()}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
