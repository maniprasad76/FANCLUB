import { defineConfig, devices } from '@playwright/test';

/**
 * Runs the suite against the local dev server by default.
 * To target an external (staging/prod) deployment:
 *   PLAYWRIGHT_BASE_URL=https://staging.example E2E_API_URL=https://staging-api.example/api \
 *     npx playwright test tests/e2e-flow.spec.ts
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const targetingExternal = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only boot the local dev server when running against localhost — external
  // runs (staging/production) navigate straight to the deployed site.
  ...(targetingExternal
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
        },
      }),
});
