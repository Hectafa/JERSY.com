import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    setupFiles: ["./tests/setup/setupTestEnv.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.js"],
      exclude: ["src/seed/**", "src/config/**"],
    },
  },
});
