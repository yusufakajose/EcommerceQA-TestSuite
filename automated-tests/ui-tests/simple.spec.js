const { test, expect } = require('@playwright/test');

test('simple test to verify setup', async ({ page }) => {
  // This is a simple test to verify the Playwright setup works
  console.log('✅ Simple test executed successfully');
  expect(true).toBe(true);
});