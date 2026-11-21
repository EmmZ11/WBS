import { defineConfig, devices } from '@playwright/test';
import { ADMIN_STATE, BASE_URL, BOOKER_BASE_URL } from './src/config';

export default defineConfig({
  testDir: './tests',
  // The demo site is shared and public, so keep load modest and retry once in CI
  // to separate real failures from network noise. Retries are reported, not hidden.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: BASE_URL,
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    // Traces record request bodies and typed values, including login credentials.
    // They are kept locally (git-ignored) but never produced in CI, whose reports are shared.
    trace: process.env.CI ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Logs in to the platform once through the API and saves the session.
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { baseURL: BASE_URL } },
    {
      name: 'platform-api',
      testDir: './tests/platform-api',
      dependencies: ['setup'],
    },
    {
      name: 'platform-ui',
      testDir: './tests/platform-ui',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_STATE },
    },
    // Option A: the Restful Booker API. Independent of the platform session.
    {
      name: 'booker-setup',
      testMatch: /booker\.setup\.ts/,
      use: { baseURL: BOOKER_BASE_URL },
    },
    {
      name: 'booker-api',
      testDir: './tests/booker-api',
      dependencies: ['booker-setup'],
    },
  ],
});
