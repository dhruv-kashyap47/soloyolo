import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:4321';

/**
 * Tablet coverage is a defined subset rather than a third copy of every flow.
 * The point is to prove the desktop-to-tablet breakpoints, not to triple the
 * suite: layout, accessibility, SEO/route audits, the home page, one
 * calculator and one generator exercise every layout shape on the device.
 */
const TABLET_SPECS = [
  '**/accessibility.spec.ts',
  '**/audit.spec.ts',
  '**/home.spec.ts',
  '**/hourly-rate.spec.ts',
  '**/invoice-generator.spec.ts',
  '**/layout.spec.ts',
  '**/screen-reader.spec.ts',
  '**/seo.spec.ts',
  '**/theme.spec.ts',
];

/**
 * P6-12: a small smoke flow runs in the four browsers a visitor is most
 * likely to use. Chrome and Edge are the branded channels; Firefox and WebKit
 * are Playwright's bundled engines (WebKit is the Safari engine).
 */
const SMOKE_SPEC = '**/smoke.spec.ts';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'tablet-webkit',
      testMatch: TABLET_SPECS,
      use: { ...devices['iPad Pro 11'], browserName: 'webkit' },
    },
    {
      name: 'cross-browser-chrome',
      testMatch: SMOKE_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'cross-browser-edge',
      testMatch: SMOKE_SPEC,
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'cross-browser-firefox',
      testMatch: SMOKE_SPEC,
      use: {
        ...devices['Desktop Firefox'],
        browserName: 'firefox',
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'cross-browser-webkit',
      testMatch: SMOKE_SPEC,
      use: {
        ...devices['Desktop Safari'],
        browserName: 'webkit',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4321',
    url: baseURL,
    // Never reuse a preview server. The command rebuilds `dist`, and a server
    // started before that rebuild can hold stale file handles on Windows and
    // serve 404s for pages the build just wrote. Failing fast on a busy port is
    // better than testing an artifact that no longer exists.
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
