/**
 * Smoke Tests
 * Basic tests to verify the testing framework is working
 */

const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests', () => {
  test('should load a working page', async ({ page }) => {
    // Navigate to a reliable page and wait for DOM ready
    await page.goto('https://playwright.dev', { waitUntil: 'domcontentloaded' });

    // Verify the page loads
    await expect(page).toHaveTitle(/Playwright/i);

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-test.png' });
  });

  test('should have basic navigation', async ({ page }) => {
    await page.goto('https://playwright.dev', { waitUntil: 'domcontentloaded' });

    // Prefer role-based selector; fall back between common labels and click the first match
    const navLink = page.getByRole('link', { name: /(get started|docs)/i });
    await expect(navLink.first()).toBeVisible();

    // Click the link and verify navigation
    await navLink.first().click();

    // Verify we navigated to the docs (intro or docs path)
    await expect(page).toHaveURL(/docs/i);
  });

  test('should handle multiple browsers', async ({ page, browserName }) => {
    console.log(`Running test in ${browserName}`);

    await page.goto('https://playwright.dev', { waitUntil: 'domcontentloaded' });

    // Verify basic functionality works across browsers
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();

    // Browser-specific screenshot
    await page.screenshot({
      path: `test-results/smoke-${browserName}.png`,
    });
  });
});
