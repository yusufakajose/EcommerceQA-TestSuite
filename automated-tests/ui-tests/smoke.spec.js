/**
 * Smoke Tests
 * Basic tests to verify the testing framework is working
 */

const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests', () => {
  test('should load the demo page', async ({ page }) => {
    // Navigate to the demo page
    await page.goto('/');
    
    // Verify the page loads
    await expect(page).toHaveTitle(/TodoMVC/);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/smoke-test.png' });
  });

  test('should have basic functionality', async ({ page }) => {
    await page.goto('/');
    
    // Check if the input field exists
    const todoInput = page.locator('.new-todo');
    await expect(todoInput).toBeVisible();
    
    // Add a simple todo item
    await todoInput.fill('Test todo item');
    await todoInput.press('Enter');
    
    // Verify the item was added
    const todoItem = page.locator('.todo-list li');
    await expect(todoItem).toHaveText('Test todo item');
  });

  test('should handle multiple browsers', async ({ page, browserName }) => {
    console.log(`Running test in ${browserName}`);
    
    await page.goto('/');
    
    // Verify basic functionality works across browsers
    const todoInput = page.locator('.new-todo');
    await expect(todoInput).toBeVisible();
    
    // Browser-specific screenshot
    await page.screenshot({ 
      path: `test-results/smoke-${browserName}.png` 
    });
  });
});