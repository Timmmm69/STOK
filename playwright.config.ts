import { defineConfig, devices } from "@playwright/test";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://stok:stok_test@localhost:55433/stok_test?schema=public";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: process.env.CI ? "pnpm exec next start -p 3100" : "pnpm exec next dev -p 3100",
    url: "http://localhost:3100/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      AUTH_ALLOWED_EMAIL: "owner@example.com",
      BETTER_AUTH_SECRET: "playwright-only-secret-at-least-32-characters",
      BETTER_AUTH_URL: "http://localhost:3100",
      GOOGLE_CLIENT_ID: "playwright-google-client",
      GOOGLE_CLIENT_SECRET: "playwright-google-secret",
      HEALTH_DB_TIMEOUT_MS: "1500",
      LOG_LEVEL: "info",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
