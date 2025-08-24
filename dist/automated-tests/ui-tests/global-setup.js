/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
async function globalSetup() {
    console.log('Starting global setup...');
    // Ensure test directories exist
    const directories = [
        'test-results',
        'reports/test-execution',
        'automated-tests/ui-tests/screenshots',
        'automated-tests/ui-tests/videos'
    ];
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
    // Clean up previous test artifacts
    const cleanupDirs = [
        'test-results',
        'reports/test-execution/playwright-report'
    ];
    cleanupDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Cleaned up directory: ${dir}`);
        }
    });
    // Create test environment configuration
    const testConfig = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'test',
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        browsers: ['chromium', 'firefox', 'webkit'],
        testDataPath: path.resolve('test-data/fixtures')
    };
    fs.writeFileSync('test-results/test-config.json', JSON.stringify(testConfig, null, 2));
    console.log('Global setup completed');
    console.log(`Test configuration saved to test-results/test-config.json`);
    return testConfig;
}
module.exports = globalSetup;
