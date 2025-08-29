// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const isCI = !!process.env.CI;

// Load environment-specific configuration
const environment = process.env.TEST_ENV || 'development';
const envConfigPath = path.join(__dirname, 'environments', `${environment}.json`);

let envConfig = {
  baseURL: 'https://magento.softwaretestingboard.com',
  apiBaseURL: 'https://magento.softwaretestingboard.com/rest',
  timeout: { action: 30000, navigation: 30000, test: 60000 },
  retries: 0,
  workers: undefined,
  browsers: ['chromium', 'firefox', 'webkit'],
  headless: true,
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',
  trace: 'on-first-retry',
};

if (fs.existsSync(envConfigPath)) {
  envConfig = { ...envConfig, ...JSON.parse(fs.readFileSync(envConfigPath, 'utf8')) };
  console.log(`Loaded configuration for environment: ${environment}`);
} else {
  console.warn(`Environment config not found: ${envConfigPath}, using defaults`);
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: path.join(__dirname, '../automated-tests'),
  testIgnore: ['**/contract-tests/**', '**/load-tests/**'],

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Environment-specific retries */
  retries: process.env.CI ? envConfig.retries || 2 : envConfig.retries || 0,

  /* Environment-specific workers */
  workers: process.env.CI ? 1 : envConfig.workers || undefined,

  /* Reporter configuration with environment-specific paths */
  reporter: [
    [
      'html',
      {
        outputFolder: `reports/test-execution/${environment}/playwright-report`,
        open: environment === 'development' ? 'on-failure' : 'never',
      },
    ],
    [
      'json',
      {
        outputFile: `reports/test-execution/${environment}/test-results.json`,
      },
    ],
    [
      'junit',
      {
        outputFile: `reports/junit.xml`,
      },
    ],
    ['list', { printSteps: environment === 'development' }],
  ],

  /* Shared settings for all projects */
  use: {
    /* Environment-specific base URL */
    baseURL: envConfig.baseURL,

    /* Environment-specific timeouts */
    actionTimeout: envConfig.timeout.action,
    navigationTimeout: envConfig.timeout.navigation,

    /* Environment-specific media settings */
    trace: (() => {
      const trace = envConfig.trace;
      if (trace === 'on-first-retry') return 'on-first-retry';
      if (trace === 'retain-on-failure') return 'retain-on-failure';
      if (trace === 'on') return 'on';
      return 'off';
    })(),
    screenshot: (() => {
      const screenshot = envConfig.screenshot;
      if (screenshot === 'only-on-failure') return 'only-on-failure';
      if (screenshot === 'on') return 'on';
      return 'off';
    })(),
    video: (() => {
      const video = envConfig.video;
      if (video === 'retain-on-failure') return 'retain-on-failure';
      if (video === 'on') return 'on';
      return 'off';
    })(),

    /* Browser settings */
    headless: envConfig.headless,

    /* Slow motion for development debugging */
    ...(envConfig.slowMo && { slowMo: envConfig.slowMo }),

    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',

    /* Ignore HTTPS errors in non-production environments */
    ignoreHTTPSErrors: environment !== 'production',

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /* Environment-specific browser projects */
  projects: [
    // Desktop browsers - using simple names that match TestExecutor expectations
    ...(envConfig.browsers.includes('chromium')
      ? [
          {
            name: 'chromium',
            use: {
              ...devices['Desktop Chrome'],
              // In CI, rely on Playwright's bundled Chromium instead of system Chrome
              ...(isCI ? {} : { channel: 'chrome' }),
            },
          },
        ]
      : []),

    ...(envConfig.browsers.includes('firefox')
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
        ]
      : []),

    ...(envConfig.browsers.includes('webkit')
      ? [
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),

    // Mobile browsers (development/staging only, and never in CI)
    ...(environment !== 'production' && !isCI
      ? [
          {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
          },
          {
            name: 'mobile-safari',
            use: { ...devices['iPhone 12'] },
          },
          {
            name: 'tablet',
            use: { ...devices['iPad Pro'] },
          },
        ]
      : []),

    // Edge browser for comprehensive testing (not in CI)
    ...(environment === 'development' && !isCI
      ? [
          {
            name: 'edge',
            use: {
              ...devices['Desktop Edge'],
              channel: 'msedge',
            },
          },
        ]
      : []),
  ],

  /* Environment-specific web server configuration */
  // webServer: environment === 'development' ? {
  //   command: 'echo "Note: Start your e-commerce application on ' + envConfig.baseURL + '"',
  //   url: envConfig.baseURL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  //   ignoreHTTPSErrors: true
  // } : undefined,

  /* Global setup and teardown */
  globalSetup: require.resolve('../automated-tests/ui-tests/global-setup.js'),
  globalTeardown: require.resolve('../automated-tests/ui-tests/global-teardown.js'),

  /* Output directories with environment separation */
  outputDir: `test-results/${environment}/`,

  /* Environment-specific test timeout */
  timeout: envConfig.timeout.test,

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000,
    // Stabilize visual comparisons across environments
    toHaveScreenshot: {
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Keep one of these unset by default to allow per-test tuning if needed
      // maxDiffPixelRatio: 0.01,
      // maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      threshold: 0.2,
    },
  },

  /* Test metadata */
  metadata: {
    environment: environment,
    baseURL: envConfig.baseURL,
    browsers: envConfig.browsers,
    timestamp: new Date().toISOString(),
  },
});
