import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command:
          'cross-env NEXT_PUBLIC_CONTRACT_ID=TEST_CONTRACT_ID_12345 NEXT_PUBLIC_STELLAR_NETWORK=testnet next dev -H 127.0.0.1 -p 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
      },
});
