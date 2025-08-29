/**
 * Playwright test fixtures
 * Provides reusable test setup and teardown functionality
 */

const { test: base, expect } = require('@playwright/test');
const { TestSetup } = require('./test-setup');

// Extend base test with custom fixtures
const test = base.extend({
  // Custom test setup fixture
  testSetup: async ({ page, context }, use) => {
    const testSetup = new TestSetup(page, context);
    await testSetup.initialize();

    // Provide testSetup to the test
    await use(testSetup);

    // Cleanup after test
    await testSetup.cleanup();
  },

  // Authenticated user fixture
  authenticatedUser: async ({ page, context }, use) => {
    const testSetup = new TestSetup(page, context);
    await testSetup.initialize();

    // Load user test data
    const userData = await testSetup.loadTestData('users');
    const validUser = userData.validUsers?.[0] || {
      email: 'test@example.com',
      password: 'password123',
    };

    // Authenticate using standard helper
    await testSetup.loginViaUI(validUser.email, validUser.password);

    await use({ testSetup, user: validUser });

    // Logout and cleanup
    try {
      await testSetup.navigateToApp('/logout');
    } catch (error) {
      console.warn('Logout failed, clearing session data');
      await testSetup.clearBrowserData();
    }

    await testSetup.cleanup();
  },

  // Shopping cart fixture with items
  cartWithItems: async ({ page, context }, use) => {
    const testSetup = new TestSetup(page, context);
    await testSetup.initialize();

    // Load product test data
    const productData = await testSetup.loadTestData('products');
    const testProducts = productData.sampleProducts || [
      { id: '1', name: 'Test Product 1', price: 29.99 },
      { id: '2', name: 'Test Product 2', price: 49.99 },
    ];

    // Navigate to products and add items to cart
    await testSetup.navigateToApp('/products');

    const cartItems = [];
    for (const product of testProducts.slice(0, 2)) {
      try {
        await testSetup.clickElement(`[data-testid="add-to-cart-${product.id}"]`);
        cartItems.push(product);
        await page.waitForTimeout(500); // Brief pause between additions
      } catch (error) {
        console.warn(`Could not add product ${product.id} to cart: ${error.message}`);
      }
    }

    await use({ testSetup, cartItems });

    // Clear cart and cleanup
    await testSetup.ensureCartEmpty();

    await testSetup.cleanup();
  },

  // Mobile device fixture
  mobileDevice: async ({ browser }, use) => {
    const context = await browser.newContext({
      ...require('@playwright/test').devices['iPhone 12'],
      locale: 'en-US',
      timezoneId: 'America/New_York',
    });

    const page = await context.newPage();
    const testSetup = new TestSetup(page, context);
    await testSetup.initialize();

    await use({ page, context, testSetup });

    await testSetup.cleanup();
    await context.close();
  },

  // API context fixture for hybrid testing
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    await use(apiContext);
    await apiContext.dispose();
  },
});

// Export custom test and expect
module.exports = { test, expect };
