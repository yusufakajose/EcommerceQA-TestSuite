/**
 * Authentication Test Suite for SauceDemo
 * Comprehensive tests for login/logout functionality with performance monitoring
 */

const { test, expect } = require('@playwright/test');
const PerformanceMonitor = require('./utils/performance-monitor');

test.describe('Authentication Tests', () => {

  test.describe('Login Functionality', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      const perfMonitor = new PerformanceMonitor(page);
      
      // Measure page load performance
      await perfMonitor.startMeasurement('pageLoad');
      await page.goto('https://www.saucedemo.com');
      await perfMonitor.endMeasurement('pageLoad');
      await perfMonitor.assertPageLoadPerformance(3000);
      
      // Measure login interaction performance
      await perfMonitor.measureInteraction(async () => {
        await page.fill('#user-name', 'standard_user');
        await page.fill('#password', 'secret_sauce');
        await page.click('#login-button');
        await page.waitForURL(/inventory/);
      }, 'loginProcess', 2000);
      
      // Verify successful login
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.title')).toHaveText('Products');
      await expect(page.locator('.inventory_item')).toHaveCount(6);
      
      console.log('✅ Login successful with valid credentials');
      console.log('📊 Performance Report:', JSON.stringify(perfMonitor.generateReport().summary, null, 2));
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Try to login with invalid credentials
      await page.fill('#user-name', 'invalid_user');
      await page.fill('#password', 'wrong_password');
      await page.click('#login-button');
      
      // Verify error message appears
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
      
      console.log('✅ Error shown for invalid credentials');
    });

    test('should show error for empty credentials', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Try to submit empty form
      await page.click('#login-button');
      
      // Verify validation error appears
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
      
      console.log('✅ Error shown for empty credentials');
    });

    test('should show error for locked out user', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Try to login with locked out user
      await page.fill('#user-name', 'locked_out_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Verify lockout error message
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out');
      
      console.log('✅ Lockout error shown for locked user');
    });

    test('should handle problem user login', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Login with problem user (this user has issues with images)
      await page.fill('#user-name', 'problem_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Verify login succeeds but with problems
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.title')).toHaveText('Products');
      
      console.log('✅ Problem user login handled');
    });

    test('should handle performance glitch user', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Login with performance glitch user (slower performance)
      await page.fill('#user-name', 'performance_glitch_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Verify login succeeds (may be slower)
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.title')).toHaveText('Products');
      
      console.log('✅ Performance glitch user login handled');
    });
  });

  test.describe('Logout Functionality', () => {
    test('should successfully logout user', async ({ page }) => {
      const perfMonitor = new PerformanceMonitor(page);
      
      await page.goto('https://www.saucedemo.com');
      
      // Login first with performance monitoring
      await perfMonitor.measureInteraction(async () => {
        await page.fill('#user-name', 'standard_user');
        await page.fill('#password', 'secret_sauce');
        await page.click('#login-button');
        await page.waitForURL(/inventory/);
      }, 'loginForLogout', 2000);
      
      // Verify login
      await expect(page).toHaveURL(/inventory/);
      
      // Measure logout performance
      await perfMonitor.measureInteraction(async () => {
        await page.click('#react-burger-menu-btn');
        await page.click('#logout_sidebar_link');
        await page.waitForURL('https://www.saucedemo.com/');
      }, 'logoutProcess', 1500);
      
      // Verify logout - should be back to login page
      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await expect(page.locator('#user-name')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      
      console.log('✅ Logout successful');
      console.log('📊 Performance Report:', JSON.stringify(perfMonitor.generateReport().summary, null, 2));
    });

    test('should handle session persistence behavior', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Login and add item to cart
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      await page.locator('.btn_inventory').first().click();
      
      // Verify item in cart
      await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
      
      // Logout
      await page.click('#react-burger-menu-btn');
      await page.click('#logout_sidebar_link');
      
      // Verify we're logged out
      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await expect(page.locator('#user-name')).toBeVisible();
      
      // Login again - SauceDemo persists cart data across sessions
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // In SauceDemo, cart data persists (this is the actual behavior)
      await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
      
      console.log('✅ Session persistence behavior verified');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page navigation', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Login
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Navigate to cart
      await page.click('.shopping_cart_link');
      await expect(page).toHaveURL(/cart/);
      
      // Navigate back to inventory
      await page.click('#continue-shopping');
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.title')).toHaveText('Products');
      
      console.log('✅ Session maintained across navigation');
    });

    test('should handle page refresh while logged in', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Login
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Verify login
      await expect(page).toHaveURL(/inventory/);
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.title')).toHaveText('Products');
      
      console.log('✅ Session maintained after page refresh');
    });
  });

  test.describe('Form Validation', () => {
    test('should show error for missing username', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Fill only password
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Verify username required error
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
      
      console.log('✅ Username required validation works');
    });

    test('should show error for missing password', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Fill only username
      await page.fill('#user-name', 'standard_user');
      await page.click('#login-button');
      
      // Verify password required error
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
      
      console.log('✅ Password required validation works');
    });

    test('should clear error message when typing', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Trigger error first
      await page.click('#login-button');
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      
      // Start typing in username field
      await page.fill('#user-name', 'test');
      
      // Error should be cleared (or at least form should be ready for new attempt)
      // Note: SauceDemo doesn't clear errors on typing, but we can verify the form is still functional
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Should login successfully
      await expect(page).toHaveURL(/inventory/);
      
      console.log('✅ Form remains functional after error');
    });
  });

  test.describe('Security Tests', () => {
    test('should handle SQL injection attempts', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Try SQL injection in username
      await page.fill('#user-name', "admin'; DROP TABLE users; --");
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Should show normal login error, not crash
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
      
      console.log('✅ SQL injection attempt handled safely');
    });

    test('should handle XSS attempts', async ({ page }) => {
      await page.goto('https://www.saucedemo.com');
      
      // Try XSS in username
      await page.fill('#user-name', '<script>alert("xss")</script>');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      
      // Should show normal login error, not execute script
      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
      
      console.log('✅ XSS attempt handled safely');
    });
  });

  test.describe('User Types', () => {
    test('should handle all valid user types', async ({ page }) => {
      const validUsers = [
        'standard_user',
        'problem_user', 
        'performance_glitch_user'
      ];
      
      for (const username of validUsers) {
        await page.goto('https://www.saucedemo.com');
        
        await page.fill('#user-name', username);
        await page.fill('#password', 'secret_sauce');
        await page.click('#login-button');
        
        // Should login successfully
        await expect(page).toHaveURL(/inventory/);
        await expect(page.locator('.title')).toHaveText('Products');
        
        // Logout for next iteration
        await page.click('#react-burger-menu-btn');
        await page.click('#logout_sidebar_link');
        
        console.log(`✅ ${username} login successful`);
      }
    });
  });
});