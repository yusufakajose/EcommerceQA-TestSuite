const { test, expect } = require('@playwright/test');

test('simple test to verify setup', async ({ page }) => {
  // This is a simple test to verify the Playwright setup works
  console.log('Simple test executed successfully');
  expect(true).toBe(true);
});

test('basic navigation test', async ({ page }) => {
  // Test basic navigation to the configured baseURL
  await page.goto('https://demo.playwright.dev/todomvc');
  
  // Verify page loads (should work with any valid URL)
  await expect(page).toHaveURL(/demo\.playwright\.dev/);
  
  console.log('✅ Basic navigation test completed');
});