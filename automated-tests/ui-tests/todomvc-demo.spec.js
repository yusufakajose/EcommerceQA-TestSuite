/**
 * TodoMVC Demo Test Suite
 * Basic tests to demonstrate the testing framework using the TodoMVC demo application
 */

const { test, expect } = require('@playwright/test');

test.describe('TodoMVC Demo Tests', () => {
  
  test('should load TodoMVC application successfully', async ({ page }) => {
    // Navigate to the TodoMVC demo
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Verify the page loads correctly
    await expect(page).toHaveTitle(/TodoMVC/i);
    
    // Verify the main input is visible
    await expect(page.locator('.new-todo')).toBeVisible();
    
    console.log('✅ TodoMVC application loaded successfully');
  });

  test('should add a new todo item', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Add a new todo
    const todoText = 'Test todo item';
    await page.fill('.new-todo', todoText);
    await page.press('.new-todo', 'Enter');
    
    // Verify the todo was added
    await expect(page.locator('.todo-list li')).toContainText(todoText);
    
    console.log('✅ Todo item added successfully');
  });

  test('should mark todo as completed', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Add a todo first
    const todoText = 'Complete this task';
    await page.fill('.new-todo', todoText);
    await page.press('.new-todo', 'Enter');
    
    // Mark as completed
    await page.click('.todo-list li .toggle');
    
    // Verify it's marked as completed
    await expect(page.locator('.todo-list li')).toHaveClass(/completed/);
    
    console.log('✅ Todo marked as completed successfully');
  });

  test('should filter todos by status', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Add multiple todos
    await page.fill('.new-todo', 'Active todo');
    await page.press('.new-todo', 'Enter');
    
    await page.fill('.new-todo', 'Completed todo');
    await page.press('.new-todo', 'Enter');
    
    // Mark second todo as completed
    await page.click('.todo-list li:nth-child(2) .toggle');
    
    // Filter by active (check that we have at least one active todo)
    await page.click('text=Active');
    await expect(page.locator('.todo-list li:not(.completed)')).toHaveCount(1);
    await expect(page.locator('.todo-list li:not(.completed)')).toContainText('Active todo');
    
    // Filter by completed (check that we have at least one completed todo)
    await page.click('text=Completed');
    await expect(page.locator('.todo-list li.completed')).toHaveCount(1);
    await expect(page.locator('.todo-list li.completed')).toContainText('Completed todo');
    
    console.log('✅ Todo filtering works correctly');
  });

  test('should demonstrate error handling', async ({ page }) => {
    // Test navigation to the app
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Verify page is accessible
    await expect(page.locator('.todoapp')).toBeVisible();
    
    // Test that empty todos are not added
    await page.fill('.new-todo', '   '); // Only spaces
    await page.press('.new-todo', 'Enter');
    
    // Should not add empty todo
    await expect(page.locator('.todo-list li')).toHaveCount(0);
    
    console.log('✅ Error handling test completed');
  });
});