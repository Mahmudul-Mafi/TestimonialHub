/**
 * Centralized app configuration. All env access goes through this module so
 * that the rest of the code can rely on typed, validated values.
 *
 * NOTE: This module is intentionally lightweight. Environment parsing and
 * runtime validation will be hardened in Stage 3 once Prisma is wired up.
 */

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const appConfig = {
  appName: optional("NEXT_PUBLIC_APP_NAME", "TestimonialHub"),
  appUrl: optional("APP_URL", "http://localhost:3000"),
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  auth: {
    secret: optional("AUTH_SECRET", "dev-only-secret-replace-in-prod-32chars+"),
    trustHost: optional("AUTH_TRUST_HOST", "true") === "true",
  },
  database: {
    url: optional(
      "DATABASE_URL",
      "mysql://testimonialhub_app:changeme@127.0.0.1:3306/testimonialhub"
    ),
  },
  stripe: {
    secretKey: optional("STRIPE_SECRET_KEY", "sk_test_placeholder"),
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET", "whsec_placeholder"),
    paidPriceId: optional("STRIPE_PAID_PRICE_ID", "price_placeholder"),
  },
  resend: {
    apiKey: optional("RESEND_API_KEY", "re_placeholder"),
    from: optional("EMAIL_FROM", "TestimonialHub <noreply@localhost>"),
  },
  captcha: {
    enabled: optional("CAPTCHA_ENABLED", "false") === "true",
    siteKey: optional("HCAPTCHA_SITE_KEY", ""),
    secret: optional("HCAPTCHA_SECRET", ""),
  },
} as const;

export type AppConfig = typeof appConfig;
