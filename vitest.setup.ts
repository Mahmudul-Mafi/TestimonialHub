// Vitest setup — runs before every test file.
// Loads .env / .env.test, ensures env defaults are present for unit tests.

import { config as loadEnv } from "dotenv";

// Attempt to load .env.test first, then .env. If neither exists, fall back to safe defaults.
loadEnv({ path: ".env.test" });
loadEnv({ path: ".env" });

// Node's typings treat `process.env` keys as readonly literal types under
// `NodeJS.ProcessEnv`. Use `Reflect.set` so the assignment is legal under
// strict TS and survives later typechecks.
const setIfMissing = (key: string, value: string) => {
  if (process.env[key] === undefined) Reflect.set(process.env, key, value);
};

setIfMissing("NODE_ENV", "test");
setIfMissing("APP_URL", "http://localhost:3000");
setIfMissing("AUTH_SECRET", "test-only-secret-not-for-production-use-32chars");
setIfMissing(
  "DATABASE_URL",
  "mysql://test:test@127.0.0.1:3306/testimonialhub_test"
);
setIfMissing("STRIPE_SECRET_KEY", "sk_test_placeholder");
setIfMissing("RESEND_API_KEY", "re_placeholder");
