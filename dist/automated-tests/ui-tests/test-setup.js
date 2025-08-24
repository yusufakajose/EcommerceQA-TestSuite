/**
 * Test setup utilities for Playwright tests
 * Provides common setup and teardown functionality for individual tests
 */
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
class TestSetup {
    constructor(page, context) {
        this.page = page;
        this.context = context;
        this.testData = {};
        this.screenshots = [];
    }
    /**
     * Initialize test environment
     */
    async initialize() {
        // Set default viewport for consistent testing
        await this.page.setViewportSize({ width: 1280, height: 720 });
        // Set up request/response logging for debugging
        this.page.on('request', request => {
            if (process.env.DEBUG_REQUESTS === 'true') {
                console.log(`🔄 Request: ${request.method()} ${request.url()}`);
            }
        });
        this.page.on('response', response => {
            if (process.env.DEBUG_RESPONSES === 'true' && !response.ok()) {
                console.log(`❌ Failed Response: ${response.status()} ${response.url()}`);
            }
        });
        // Set up console logging
        this.page.on('console', msg => {
            if (process.env.DEBUG_CONSOLE === 'true') {
                console.log(`🖥️  Console ${msg.type()}: ${msg.text()}`);
            }
        });
        // Set up error handling
        this.page.on('pageerror', error => {
            console.error(`💥 Page Error: ${error.message}`);
        });
    }
    /**
     * Load test data from fixtures
     */
    async loadTestData(dataFile) {
        try {
            const dataPath = path.join('test-data/fixtures', `${dataFile}.json`);
            if (fs.existsSync(dataPath)) {
                this.testData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                return this.testData;
            }
            else {
                console.warn(`⚠️  Test data file not found: ${dataPath}`);
                return {};
            }
        }
        catch (error) {
            console.error(`❌ Error loading test data: ${error.message}`);
            return {};
        }
    }
    /**
     * Take screenshot with custom name
     */
    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `automated-tests/ui-tests/screenshots/${name}-${timestamp}.png`;
        await this.page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        this.screenshots.push(screenshotPath);
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
        return screenshotPath;
    }
    /**
     * Wait for page to be fully loaded
     */
    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
    }
    /**
     * Clear browser data between tests
     */
    async clearBrowserData() {
        try {
            // Clear cookies
            await this.context.clearCookies();
            // Clear local storage and session storage
            await this.page.evaluate(() => {
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                }
                catch (error) {
                    // Ignore localStorage errors in demo environment
                    console.log('localStorage not available');
                }
            });
            console.log('🧹 Browser data cleared');
        }
        catch (error) {
            console.log('⚠️  Browser data cleanup skipped:', error.message);
        }
    }
    /**
     * Navigate to application with error handling
     */
    async navigateToApp(path = '/') {
        const baseURL = process.env.BASE_URL || 'http://localhost:3000';
        const fullURL = `${baseURL}${path}`;
        try {
            await this.page.goto(fullURL, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            // Verify page loaded successfully
            await expect(this.page).toHaveURL(new RegExp(path));
            console.log(`🌐 Navigated to: ${fullURL}`);
        }
        catch (error) {
            console.error(`❌ Navigation failed to ${fullURL}: ${error.message}`);
            await this.takeScreenshot('navigation-error');
            throw error;
        }
    }
    /**
     * Wait for element with enhanced error handling
     */
    async waitForElement(selector, options = {}) {
        const defaultOptions = {
            timeout: 10000,
            state: 'visible',
            ...options
        };
        try {
            await this.page.waitForSelector(selector, defaultOptions);
            console.log(`✅ Element found: ${selector}`);
        }
        catch (error) {
            console.error(`❌ Element not found: ${selector}`);
            await this.takeScreenshot(`element-not-found-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
            throw error;
        }
    }
    /**
     * Fill form field with validation
     */
    async fillField(selector, value, options = {}) {
        await this.waitForElement(selector);
        // Clear field first
        await this.page.fill(selector, '');
        // Fill with new value
        await this.page.fill(selector, value);
        // Verify value was set
        if (options.verify !== false) {
            const actualValue = await this.page.inputValue(selector);
            expect(actualValue).toBe(value);
        }
        console.log(`📝 Filled field ${selector} with: ${value}`);
    }
    /**
     * Click element with retry logic
     */
    async clickElement(selector, options = {}) {
        const maxRetries = options.retries || 3;
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.waitForElement(selector);
                await this.page.click(selector, options);
                console.log(`👆 Clicked element: ${selector}`);
                return;
            }
            catch (error) {
                lastError = error;
                console.warn(`⚠️  Click attempt ${i + 1} failed for ${selector}: ${error.message}`);
                if (i < maxRetries - 1) {
                    await this.page.waitForTimeout(1000); // Wait 1 second before retry
                }
            }
        }
        await this.takeScreenshot(`click-failed-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
        throw lastError;
    }
    /**
     * Cleanup after test
     */
    async cleanup() {
        try {
            // Clear any remaining data
            await this.clearBrowserData();
            // Log cleanup completion
            console.log('🧹 Test cleanup completed');
        }
        catch (error) {
            console.error(`❌ Cleanup error: ${error.message}`);
        }
    }
    /**
     * Generate test report data
     */
    getTestReport() {
        return {
            screenshots: this.screenshots,
            testData: this.testData,
            timestamp: new Date().toISOString()
        };
    }
}
module.exports = { TestSetup };
