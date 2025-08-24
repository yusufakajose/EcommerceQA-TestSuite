// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
// Load environment-specific configuration
const environment = process.env.TEST_ENV || 'development';
const envConfigPath = path.join(__dirname, 'environments', `${environment}.json`);
let envConfig = {
    baseURL: 'http://localhost:3000',
    apiBaseURL: 'http://localhost:3001/api',
    timeout: { action: 30000, navigation: 30000, test: 60000 },
    retries: 0,
    workers: undefined,
    browsers: ['chromium', 'firefox', 'webkit'],
    headless: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
};
if (fs.existsSync(envConfigPath)) {
    envConfig = { ...envConfig, ...JSON.parse(fs.readFileSync(envConfigPath, 'utf8')) };
    console.log(`Loaded configuration for environment: ${environment}`);
}
else {
    console.warn(`Environment config not found: ${envConfigPath}, using defaults`);
}
/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
    testDir: path.join(__dirname, '../automated-tests/ui-tests'),
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Environment-specific retries */
    retries: process.env.CI ? (envConfig.retries || 2) : (envConfig.retries || 0),
    /* Environment-specific workers */
    workers: process.env.CI ? 1 : (envConfig.workers || undefined),
    /* Reporter configuration with environment-specific paths */
    reporter: [
        ['html', {
                outputFolder: `reports/test-execution/${environment}/playwright-report`,
                open: environment === 'development' ? 'on-failure' : 'never'
            }],
        ['json', {
                outputFile: `reports/test-execution/${environment}/test-results.json`
            }],
        ['junit', {
                outputFile: `reports/test-execution/${environment}/junit-results.xml`
            }],
        ['list', { printSteps: environment === 'development' }]
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
            if (trace === 'on-first-retry')
                return 'on-first-retry';
            if (trace === 'retain-on-failure')
                return 'retain-on-failure';
            if (trace === 'on')
                return 'on';
            return 'off';
        })(),
        screenshot: (() => {
            const screenshot = envConfig.screenshot;
            if (screenshot === 'only-on-failure')
                return 'only-on-failure';
            if (screenshot === 'on')
                return 'on';
            return 'off';
        })(),
        video: (() => {
            const video = envConfig.video;
            if (video === 'retain-on-failure')
                return 'retain-on-failure';
            if (video === 'on')
                return 'on';
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
            'Accept-Language': 'en-US,en;q=0.9'
        }
    },
    /* Environment-specific browser projects */
    projects: [
        // Desktop browsers
        ...(envConfig.browsers.includes('chromium') ? [{
                name: 'Desktop Chrome',
                use: {
                    ...devices['Desktop Chrome'],
                    channel: 'chrome'
                },
            }] : []),
        // Brave Browser support
        {
            name: 'Brave Browser',
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chrome',
                executablePath: process.env.BRAVE_EXECUTABLE_PATH || '/usr/bin/brave-browser'
            },
        },
        ...(envConfig.browsers.includes('firefox') ? [{
                name: 'Desktop Firefox',
                use: { ...devices['Desktop Firefox'] },
            }] : []),
        ...(envConfig.browsers.includes('webkit') ? [{
                name: 'Desktop Safari',
                use: { ...devices['Desktop Safari'] },
            }] : []),
        // Mobile browsers (only in development and staging)
        ...(environment !== 'production' ? [
            {
                name: 'Mobile Chrome',
                use: { ...devices['Pixel 5'] },
            },
            {
                name: 'Mobile Safari',
                use: { ...devices['iPhone 12'] },
            },
            {
                name: 'Mobile Chrome Small',
                use: {
                    ...devices['Galaxy S5'],
                    viewport: { width: 360, height: 640 }
                },
            },
            {
                name: 'Mobile Safari Small',
                use: {
                    ...devices['iPhone SE'],
                    viewport: { width: 375, height: 667 }
                },
            },
            {
                name: 'Tablet',
                use: { ...devices['iPad Pro'] },
            },
            {
                name: 'Tablet Landscape',
                use: {
                    ...devices['iPad Pro'],
                    viewport: { width: 1024, height: 768 }
                },
            },
            {
                name: 'Tablet Portrait',
                use: {
                    ...devices['iPad Pro'],
                    viewport: { width: 768, height: 1024 }
                },
            }
        ] : []),
        // Edge browser for comprehensive testing
        ...(environment === 'development' ? [{
                name: 'Microsoft Edge',
                use: {
                    ...devices['Desktop Edge'],
                    channel: 'msedge'
                },
            }] : [])
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
        toHaveScreenshot: {
            threshold: 0.2
        },
        toMatchSnapshot: {
            threshold: 0.2
        }
    },
    /* Test metadata */
    metadata: {
        environment: environment,
        baseURL: envConfig.baseURL,
        browsers: envConfig.browsers,
        timestamp: new Date().toISOString()
    }
});
