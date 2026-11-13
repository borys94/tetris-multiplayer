import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    coverage: {
      provider: "v8",
      include: ["apps/*/src/**", "packages/*/src/**"],
      exclude: ["**/*.test.{ts,tsx}", "apps/*/src/main.{ts,tsx}"],
      reporter: ["text", "html", "lcov"],
    },
  },
});
