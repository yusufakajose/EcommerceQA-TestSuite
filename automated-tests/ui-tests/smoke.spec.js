/**
 * Smoke Tests
 * Basic tests to verify the testing framework is working
 */

const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests', () => {
  test('should load a working page', async ({ page }) => {
    // Navigate to a reliable demo page
    await page.goto('https://playwright.dev/');

    // Verify the page loads
    await expect(page).toHaveTitle(/Playwright/);

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-test.png' });
  });

  test('should have basic navigation', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // Check if the main navigation exists
    const getStartedLink = page.locator('text=Get started');
    await expect(getStartedLink).toBeVisible();

    // Click the link and verify navigation
    await getStartedLink.click();

    // Verify we navigated to the docs
    await expect(page).toHaveURL(/.*docs.*/);
  });

  test('should handle multiple browsers', async ({ page, browserName }) => {
    console.log(`Running test in ${browserName}`);

    await page.goto('https://playwright.dev/');

    // Verify basic functionality works across browsers
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();

    // Browser-specific screenshot
    await page.screenshot({
      path: `test-results/smoke-${browserName}.png`,
    });
  });
});
