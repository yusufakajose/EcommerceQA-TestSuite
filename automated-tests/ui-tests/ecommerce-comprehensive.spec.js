/**
 * Comprehensive E-commerce Test Suite for SauceDemo
 * Tests all major e-commerce functionality using the SauceDemo site with performance monitoring
 */

const { test, expect } = require('@playwright/test');
const PerformanceMonitor = require('./utils/performance-monitor');

test.describe('E-commerce Comprehensive Tests', () => {
  
  test('should load homepage and verify basic elements', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Swag Labs/);
    
    // Verify login form elements
    await expect(page.locator('#user-name')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#login-button')).toBeVisible();
    
    // Verify branding
    await expect(page.locator('.login_logo')).toBeVisible();
    
    console.log('✅ Homepage verification completed');
  });

  test('should successfully login and verify product catalog', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login with valid credentials
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    
    // Verify we're on inventory page
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.title')).toHaveText('Products');
    
    // Verify products are displayed
    await expect(page.locator('.inventory_item')).toHaveCount(6);
    await expect(page.locator('.inventory_item_name').first()).toBeVisible();
    await expect(page.locator('.inventory_item_price').first()).toBeVisible();
    await expect(page.locator('.btn_inventory').first()).toBeVisible();
    
    console.log('✅ Login and product catalog verification completed');
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Submit empty form
    await page.click('#login-button');
    
    // Verify validation errors appear
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
    
    console.log('✅ Login validation completed');
  });

  test('should sort products by different criteria', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login first
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    
    // Test sorting by name (Z to A)
    await page.selectOption('.product_sort_container', 'za');
    const firstProductName = await page.locator('.inventory_item_name').first().textContent();
    expect(firstProductName).toContain('Test.allTheThings()');
    
    // Test sorting by price (low to high)
    await page.selectOption('.product_sort_container', 'lohi');
    const firstProductPrice = await page.locator('.inventory_item_price').first().textContent();
    expect(firstProductPrice).toContain('$7.99');
    
    console.log('✅ Product sorting verification completed');
  });

  test('should view product details', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login and navigate to product details
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    
    // Click on first product
    await page.locator('.inventory_item_name').first().click();
    
    // Verify we're on product details page
    await expect(page).toHaveURL(/inventory-item/);
    await expect(page.locator('.inventory_details_name')).toBeVisible();
    await expect(page.locator('.inventory_details_price')).toBeVisible();
    await expect(page.locator('.inventory_details_desc')).toBeVisible();
    await expect(page.locator('button[id^="add-to-cart"]')).toBeVisible();
    
    console.log('✅ Product details verification completed');
  });

  test('should add product to cart', async ({ page }) => {
    const perfMonitor = new PerformanceMonitor(page);
    
    await page.goto('https://www.saucedemo.com');
    
    // Login and add product to cart
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
    
    console.log('✅ Add to cart verification completed');
    console.log('📊 Performance Report:', JSON.stringify(perfMonitor.generateReport().summary, null, 2));
  });

  test('should view shopping cart', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login and add item to cart
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await page.locator('.btn_inventory').first().click();
    
    // Navigate to cart
    await page.click('.shopping_cart_link');
    
    // Verify cart page
    await expect(page).toHaveURL(/cart/);
    await expect(page.locator('.title')).toHaveText('Your Cart');
    await expect(page.locator('.cart_item')).toHaveCount(1);
    await expect(page.locator('.inventory_item_name')).toBeVisible();
    await expect(page.locator('.inventory_item_price')).toBeVisible();
    
    console.log('✅ Shopping cart verification completed');
  });

  test('should navigate to checkout', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login, add item to cart, and proceed to checkout
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await page.locator('.btn_inventory').first().click();
    await page.click('.shopping_cart_link');
    await page.click('#checkout');
    
    // Verify checkout page
    await expect(page).toHaveURL(/checkout-step-one/);
    await expect(page.locator('.title')).toHaveText('Checkout: Your Information');
    await expect(page.locator('#first-name')).toBeVisible();
    await expect(page.locator('#last-name')).toBeVisible();
    await expect(page.locator('#postal-code')).toBeVisible();
    
    console.log('✅ Checkout navigation verification completed');
  });

  test('should complete checkout process', async ({ page }) => {
    const perfMonitor = new PerformanceMonitor(page);
    
    // Measure page load
    await perfMonitor.startMeasurement('pageLoad');
    await page.goto('https://www.saucedemo.com');
    await perfMonitor.endMeasurement('pageLoad');
    await perfMonitor.assertPageLoadPerformance(3000);
    
    // Measure complete checkout flow performance
    await perfMonitor.measureInteraction(async () => {
      // Login, add item to cart, and navigate to checkout
      await page.fill('#user-name', 'standard_user');
      await page.fill('#password', 'secret_sauce');
      await page.click('#login-button');
      await page.waitForURL(/inventory/);
      await page.locator('.btn_inventory').first().click();
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
    }, 'completeCheckoutFlow', 5000);
    
    // Verify order completion
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
    
    console.log('✅ Complete checkout process verification completed');
    console.log('📊 Performance Report:', JSON.stringify(perfMonitor.generateReport().summary, null, 2));
  });

  test('should show validation on checkout form', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login, add item to cart, and go to checkout
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await page.locator('.btn_inventory').first().click();
    await page.click('.shopping_cart_link');
    await page.click('#checkout');
    
    // Try to continue without filling required fields
    await page.click('#continue');
    
    // Verify validation error appears
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');
    
    console.log('✅ Checkout form validation verification completed');
  });
});