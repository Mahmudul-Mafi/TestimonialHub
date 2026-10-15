import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    // Public, embeddable routes. We allow any site to iframe these so
    // owners can drop them into their own pages. No X-Frame-Options is
    // set (Next.js does not set one by default), and the CSP
    // `frame-ancestors *` is the modern equivalent for browsers that
    // honor CSP. Other routes remain DENY by default.
    return [
      {
        source: "/wall/:slug",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
      {
        source: "/widgets/:token",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;
