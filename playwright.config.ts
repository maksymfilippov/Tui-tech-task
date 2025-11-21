import { defineConfig, devices } from '@playwright/test';
import { EnvironmentKey, getEnvValue, isCI } from '@/internal/config';

export default defineConfig({
  testDir: './tests',

  timeout: isCI() ? 5 * 60 * 1000 : 60 * 1000,

  expect: {
    timeout: isCI() ? 30 * 1000 : 8 * 1000,
  },

  forbidOnly: isCI(),
  retries: isCI() ? 2 : 0,
  workers: isCI() ? '50%' : undefined,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    actionTimeout: 0,
    headless: true,
    baseURL: getEnvValue(EnvironmentKey.Url),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'nl-NL',
  },

  projects: [
    {
      name: 'e2e | ui',
      testMatch: '**/ui/*.spec.ts',
      timeout: 180000,
      expect: { timeout: 10000 },
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
          ],
        },
        channel: 'chrome',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
      },
      fullyParallel: true,
    },
  ],

  outputDir: 'test-results/',
});
