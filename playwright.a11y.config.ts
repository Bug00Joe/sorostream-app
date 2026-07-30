import { defineConfig, devices } from "@playwright/test";

/**
 * Accessibility audit configuration.
 * Run with: npm run a11y
 *
 * Requires the dev server to be running (npm run dev) or set webServer below.
 * Uses @axe-core/playwright to inject axe into each page and report violations.
 */
export default defineConfig({
  testDir: "./e2e/a11y",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-a11y", open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    headless: true,
    colorScheme: "dark",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
