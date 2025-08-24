/**
 * SauceDemo E-commerce Test Suite
 * Basic tests to verify the SauceDemo e-commerce application works with performance monitoring
 */

const { test, expect } = require('@playwright/test');
const PerformanceMonitor = require('./utils/performance-monitor');

test.describe('SauceDemo E-commerce Tests', () => {
  
  test('should load SauceDemo homepage successfully', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Verify the page loads correctly
    await expect(page).toHaveTitle(/Swag Labs/);
    
    // Verify login form is visible
    await expect(page.locator('#user-name')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#login-button')).toBeVisible();
    
    console.log('✅ SauceDemo homepage loaded successfully');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login with standard user
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    
    // Verify we're on the inventory page
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.title')).toHaveText('Products');
    await expect(page.locator('.inventory_item')).toHaveCount(6);
    
    console.log('✅ Login successful');
  });

  test('should display product catalog correctly', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login first
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    
    // Verify product elements are present
    await expect(page.locator('.inventory_item')).toHaveCount(6);
    await expect(page.locator('.inventory_item_name').first()).toBeVisible();
    await expect(page.locator('.inventory_item_price').first()).toBeVisible();
    await expect(page.locator('.btn_inventory').first()).toBeVisible();
    
    console.log('✅ Product catalog displays correctly');
  });

  test('should show validation errors for empty login', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Try to submit empty form
    await page.click('#login-button');
    
    // Check for validation messages
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
    
    console.log('✅ Login validation works');
  });

  test('should add product to cart successfully', async ({ page }) => {
    const perfMonitor = new PerformanceMonitor(page);
    
    await page.goto('https://www.saucedemo.com');
    
    // Login first
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await page.waitForURL(/inventory/);
    
    // Measure add to cart performance
    await perfMonitor.measureInteraction(async () => {
      await page.locator('.btn_inventory').first().click();
      await page.waitForSelector('.shopping_cart_badge');
    }, 'addToCart', 1000);
    
    // Verify cart badge shows 1 item
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    
    // Verify button text changed to "Remove"
    await expect(page.locator('.btn_inventory').first()).toHaveText('Remove');
    
    console.log('✅ Product added to cart successfully');
    console.log('📊 Performance Report:', JSON.stringify(perfMonitor.generateReport().summary, null, 2));
  });

  test('should navigate to cart and display items', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login and add item to cart
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await page.locator('.btn_inventory').first().click();
    
    // Navigate to cart
    await page.click('.shopping_cart_link');
    
    // Verify we're on cart page
    await expect(page).toHaveURL(/cart/);
    await expect(page.locator('.title')).toHaveText('Your Cart');
    await expect(page.locator('.cart_item')).toHaveCount(1);
    
    console.log('✅ Cart navigation and display works');
  });

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login and add item to cart
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await page.locator('.btn_inventory').first().click();
    
    // Navigate to cart and checkout
    await page.click('.shopping_cart_link');
    await page.click('#checkout');
    
    // Verify we're on checkout page
    await expect(page).toHaveURL(/checkout-step-one/);
    await expect(page.locator('.title')).toHaveText('Checkout: Your Information');
    await expect(page.locator('#first-name')).toBeVisible();
    await expect(page.locator('#last-name')).toBeVisible();
    await expect(page.locator('#postal-code')).toBeVisible();
    
    console.log('✅ Checkout navigation works');
  });

  test('should complete full checkout process', async ({ page }) => {
    const perfMonitor = new PerformanceMonitor(page);
    
    // Measure page load
    await perfMonitor.startMeasurement('pageLoad');
    await page.goto('https://www.saucedemo.com');
    await perfMonitor.endMeasurement('pageLoad');
    await perfMonitor.assertPageLoadPerformance(3000);
    
    // Measure full checkout flow performance
    await perfMonitor.measureInteraction(async () => {
      // Login and add item to cart
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      await page.waitForURL(/inventory/);
      await page.locator('.btn_inventory').first().click();
      
      // Navigate to cart and checkout
      await page.click('.shopping_cart_link');
      await page.click('#checkout');
      
      // Fill checkout information
      await page.fill('#first-name', 'John');
      await page.fill('#last-name', 'Doe');
      await page.fill('#postal-code', '12345');
      await page.click('#continue');
      
      // Complete the order
      await page.click('#finish');
      await page.waitForURL(/checkout-complete/);
    }, 'fullCheckoutFlow', 6000);
    
    // Verify order completion
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
    
    console.log('✅ Full checkout process completed successfully');
    console.log('📊 Performance Report:', JSON.stringify(perfMonitor.generateReport().summary, null, 2));
  });
});