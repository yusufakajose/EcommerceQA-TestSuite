/**
 * Test Data Management System Demo
 * Demonstrates the usage of the test data management system
 */

const { test, expect } = require('@playwright/test');
const TestDataHelper = require('../../test-data/TestDataHelper');

// Initialize test data helper
let testDataHelper;

test.describe('Test Data Management System Demo', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('TestDataDemo');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ page }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test('should load and use fixture data for user registration', async () => {
    // Get valid user data from fixtures
    const validUser = testDataHelper.getUserData('valid', 0);

    console.log('Valid User Data:', JSON.stringify(validUser, null, 2));

    // Validate the user data
    const validation = testDataHelper.validateTestData(validUser, 'user');
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Verify user data structure
    expect(validUser).toHaveProperty('firstName');
    expect(validUser).toHaveProperty('lastName');
    expect(validUser).toHaveProperty('email');
    expect(validUser).toHaveProperty('password');
    expect(validUser).toHaveProperty('phone');
    expect(validUser).toHaveProperty('address');

    // Verify address structure
    expect(validUser.address).toHaveProperty('street');
    expect(validUser.address).toHaveProperty('city');
    expect(validUser.address).toHaveProperty('state');
    expect(validUser.address).toHaveProperty('zipCode');
    expect(validUser.address).toHaveProperty('country');
  });

  test('should generate unique user data dynamically', async () => {
    // Generate multiple unique users
    const user1 = testDataHelper.generateUniqueData('user');
    const user2 = testDataHelper.generateUniqueData('user');
    const user3 = testDataHelper.generateUniqueData('user', {
      firstName: 'CustomFirst',
      preferences: { newsletter: true, notifications: false },
    });

    console.log('Generated Users:');
    console.log('User 1:', JSON.stringify(user1, null, 2));
    console.log('User 2:', JSON.stringify(user2, null, 2));
    console.log('User 3:', JSON.stringify(user3, null, 2));

    // Verify uniqueness
    expect(user1.email).not.toBe(user2.email);
    expect(user1.phone).not.toBe(user2.phone);
    expect(user1.id).not.toBe(user2.id);

    // Verify custom overrides
    expect(user3.firstName).toBe('CustomFirst');
    expect(user3.preferences.newsletter).toBe(true);
    expect(user3.preferences.notifications).toBe(false);

    // Validate all generated users
    [user1, user2, user3].forEach((user, index) => {
      const validation = testDataHelper.validateTestData(user, 'user');
      expect(
        validation.isValid,
        `User ${index + 1} validation failed: ${validation.errors.join(', ')}`
      ).toBe(true);
    });
  });

  test('should handle product test data scenarios', async () => {
    // Get featured products from fixtures
    const featuredProduct = testDataHelper.getProductData('featured');
    console.log('Featured Product:', JSON.stringify(featuredProduct, null, 2));

    // Get out of stock product
    const outOfStockProduct = testDataHelper.getProductData('outOfStock');
    console.log('Out of Stock Product:', JSON.stringify(outOfStockProduct, null, 2));

    // Generate a new product
    const generatedProduct = testDataHelper.generateUniqueData('product', {
      category: 'Test Category',
      price: 99.99,
      inStock: true,
    });
    console.log('Generated Product:', JSON.stringify(generatedProduct, null, 2));

    // Validate products
    const featuredValidation = testDataHelper.validateTestData(featuredProduct, 'product');
    expect(featuredValidation.isValid).toBe(true);

    const generatedValidation = testDataHelper.validateTestData(generatedProduct, 'product');
    expect(generatedValidation.isValid).toBe(true);

    // Verify product properties
    expect(featuredProduct.inStock).toBe(true);
    expect(outOfStockProduct.inStock).toBe(false);
    expect(generatedProduct.category).toBe('Test Category');
    expect(generatedProduct.price).toBe(99.99);
  });

  test('should create complete scenario data for shopping cart', async () => {
    // Get cart scenario data
    const cartScenario = testDataHelper.getScenarioData('shoppingCart');

    console.log('Cart Scenario Data:', JSON.stringify(cartScenario, null, 2));

    // Verify scenario contains expected data
    expect(cartScenario).toHaveProperty('scenarios');
    expect(cartScenario).toHaveProperty('products');
    expect(cartScenario).toHaveProperty('testUser');

    // Verify cart scenarios
    expect(Array.isArray(cartScenario.scenarios)).toBe(true);
    expect(cartScenario.scenarios.length).toBeGreaterThan(0);

    // Verify products
    expect(Array.isArray(cartScenario.products)).toBe(true);
    expect(cartScenario.products.length).toBeGreaterThan(0);

    // Verify generated test user
    expect(cartScenario.testUser).toHaveProperty('email');
    expect(cartScenario.testUser).toHaveProperty('firstName');
    expect(cartScenario.testUser).toHaveProperty('lastName');

    // Test specific cart scenario
    const singleItemScenario = testDataHelper.getCartData('singleItem');
    expect(singleItemScenario.scenarioName).toBe('singleItem');
    expect(singleItemScenario.items).toHaveLength(1);
    expect(singleItemScenario.expectedTotal).toBe(79.99);
  });

  test('should handle checkout scenarios with payment methods', async () => {
    // Get checkout scenario
    const checkoutScenario = testDataHelper.getCheckoutData('successfulCheckout');
    console.log('Checkout Scenario:', JSON.stringify(checkoutScenario, null, 2));

    // Get payment method data
    const visaCard = testDataHelper.getPaymentMethodData('visa');
    const mastercardCard = testDataHelper.getPaymentMethodData('mastercard');
    const generatedCard = testDataHelper.generateUniqueData('creditCard', { type: 'amex' });

    console.log('Payment Methods:');
    console.log('Visa:', JSON.stringify(visaCard, null, 2));
    console.log('Mastercard:', JSON.stringify(mastercardCard, null, 2));
    console.log('Generated Amex:', JSON.stringify(generatedCard, null, 2));

    // Validate checkout scenario
    expect(checkoutScenario.scenarioName).toBe('successfulCheckout');
    expect(checkoutScenario.user.isLoggedIn).toBe(true);
    expect(checkoutScenario.shippingAddress).toHaveProperty('firstName');
    expect(checkoutScenario.paymentMethod).toHaveProperty('cardNumber');

    // Validate payment methods
    const cardValidation = testDataHelper.validateTestData(generatedCard, 'creditCard');
    expect(cardValidation.isValid).toBe(true);

    // Verify card types
    expect(visaCard.cardNumber.startsWith('4111')).toBe(true);
    expect(mastercardCard.cardNumber.startsWith('5555')).toBe(true);
    expect(generatedCard.cvv).toHaveLength(4); // Amex has 4-digit CVV
  });

  test('should generate bulk test data efficiently', async () => {
    // Generate bulk users
    const bulkUsers = testDataHelper.generateBulkData('user', 5);
    console.log(`Generated ${bulkUsers.length} users`);

    // Generate bulk products
    const bulkProducts = testDataHelper.generateBulkData('product', 3, {
      category: 'Bulk Test Category',
      inStock: true,
    });
    console.log(`Generated ${bulkProducts.length} products`);

    // Verify bulk generation
    expect(bulkUsers).toHaveLength(5);
    expect(bulkProducts).toHaveLength(3);

    // Verify all users are unique
    const emails = bulkUsers.map((user) => user.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(emails.length);

    // Verify all products have the override category
    bulkProducts.forEach((product) => {
      expect(product.category).toBe('Bulk Test Category');
      expect(product.inStock).toBe(true);
    });

    // Validate all bulk data
    bulkUsers.forEach((user, index) => {
      const validation = testDataHelper.validateTestData(user, 'user');
      expect(validation.isValid, `Bulk user ${index} validation failed`).toBe(true);
    });

    bulkProducts.forEach((product, index) => {
      const validation = testDataHelper.validateTestData(product, 'product');
      expect(validation.isValid, `Bulk product ${index} validation failed`).toBe(true);
    });
  });

  test('should create custom test data requirements', async () => {
    // Define custom test data requirements
    const testRequirements = {
      primaryUser: {
        type: 'generated',
        dataType: 'user',
        overrides: { firstName: 'TestPrimary' },
      },
      secondaryUser: {
        type: 'fixture',
        fixture: 'users',
        dataKey: 'validUsers',
      },
      testProducts: {
        type: 'generated',
        dataType: 'product',
        bulk: true,
        count: 3,
        overrides: { category: 'Custom Test' },
      },
      randomProduct: {
        type: 'random',
        fixture: 'products',
        dataKey: 'featuredProducts',
      },
    };

    // Create test data based on requirements
    const testData = testDataHelper.createTestData('customRequirementsTest', testRequirements);

    console.log('Custom Test Data:', JSON.stringify(testData, null, 2));

    // Verify the created test data
    expect(testData.primaryUser.firstName).toBe('TestPrimary');
    expect(Array.isArray(testData.secondaryUser)).toBe(true);
    expect(testData.testProducts).toHaveLength(3);
    expect(testData.randomProduct).toHaveProperty('id');

    // Verify custom products
    testData.testProducts.forEach((product) => {
      expect(product.category).toBe('Custom Test');
    });
  });

  test('should provide test data statistics and environment info', async () => {
    // Get test data statistics
    const stats = testDataHelper.getTestDataStats();
    console.log('Test Data Statistics:', JSON.stringify(stats, null, 2));

    // Get environment configuration
    const envConfig = testDataHelper.getEnvironmentConfig();
    console.log('Environment Config:', JSON.stringify(envConfig, null, 2));

    // Verify statistics
    expect(stats).toHaveProperty('fixtures');
    expect(stats).toHaveProperty('environment');
    expect(stats.environment).toBe('development');

    // Verify fixture statistics
    expect(stats.fixtures).toHaveProperty('users');
    expect(stats.fixtures).toHaveProperty('products');
    expect(stats.fixtures).toHaveProperty('cart');
    expect(stats.fixtures).toHaveProperty('checkout');

    // Verify environment config
    expect(envConfig).toHaveProperty('baseUrl');
    expect(envConfig).toHaveProperty('apiUrl');
    expect(envConfig.cleanupAfterTest).toBe(true);
  });

  test('should handle data validation and error scenarios', async () => {
    // Test invalid user data
    const invalidUser = {
      firstName: '', // Required field empty
      lastName: 'Test',
      email: 'invalid-email', // Invalid format
      password: '123', // Too short
      phone: 'invalid-phone', // Invalid format
    };

    const validation = testDataHelper.validateTestData(invalidUser, 'user');
    console.log('Validation Result:', JSON.stringify(validation, null, 2));

    // Verify validation catches errors
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);

    // Check specific validation errors
    expect(validation.errors.some((error) => error.includes('firstName'))).toBe(true);
    expect(validation.errors.some((error) => error.includes('email'))).toBe(true);
    expect(validation.errors.some((error) => error.includes('password'))).toBe(true);
    expect(validation.errors.some((error) => error.includes('phone'))).toBe(true);

    // Test getting invalid user data from fixtures
    const fixtureInvalidUser = testDataHelper.getUserData('invalid', 0);
    expect(fixtureInvalidUser).toHaveProperty('expectedErrors');
    expect(Array.isArray(fixtureInvalidUser.expectedErrors)).toBe(true);
  });
});
