import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx", "src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["**/*.test.*", "**/types.ts"],
    },
  },
  // The project tsconfig sets "jsx": "preserve" so that Next.js's SWC
  // compiler handles JSX with the automatic runtime. Vitest's esbuild
  // does not invoke SWC, so we configure the automatic JSX runtime
  // here to keep vitest in sync with the production runtime.
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
