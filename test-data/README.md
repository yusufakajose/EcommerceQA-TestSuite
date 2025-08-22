# Test Data Management System

A comprehensive test data management system for Playwright UI automation tests. This system provides structured test data through JSON fixtures, dynamic data generation, and automated cleanup mechanisms.

## Overview

The test data management system consists of:

- **JSON Fixtures**: Pre-defined test data for consistent scenarios
- **Data Generator**: Dynamic test data creation with uniqueness guarantees
- **Data Manager**: File operations, validation, and cleanup
- **Test Data Helper**: Main interface for test integration
- **Configuration**: Centralized settings and schemas

## Directory Structure

```
test-data/
├── fixtures/           # JSON fixture files
│   ├── users.json      # User test data
│   ├── products.json   # Product test data
│   ├── cart.json       # Shopping cart scenarios
│   └── checkout.json   # Checkout and payment data
├── generators/         # Dynamic data generation
│   └── DataGenerator.js
├── utils/             # Utility classes
│   └── DataManager.js
├── config/            # Configuration files
│   └── testDataConfig.js
├── temp/              # Temporary files (auto-created)
├── TestDataHelper.js  # Main interface
└── README.md          # This file
```

## Quick Start

### 1. Initialize Test Data Helper

```javascript
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

test.beforeAll(async () => {
  testDataHelper = new TestDataHelper('development');
  await testDataHelper.initializeTestSuite('MyTestSuite');
});

test.afterAll(async () => {
  testDataHelper.cleanupTestSuite();
});
```

### 2. Use Fixture Data

```javascript
// Get valid user data
const validUser = testDataHelper.getUserData('valid', 0);

// Get random product
const randomProduct = testDataHelper.getProductData('featured');

// Get specific cart scenario
const cartScenario = testDataHelper.getCartData('singleItem');
```

### 3. Generate Dynamic Data

```javascript
// Generate unique user
const newUser = testDataHelper.generateUniqueData('user');

// Generate user with overrides
const customUser = testDataHelper.generateUniqueData('user', {
  firstName: 'TestUser',
  preferences: { newsletter: true }
});

// Generate bulk data
const bulkUsers = testDataHelper.generateBulkData('user', 5);
```

### 4. Create Scenario Data

```javascript
// Get complete scenario data (fixtures + generated)
const scenarioData = testDataHelper.getScenarioData('userRegistration');

// Create custom test data
const testData = testDataHelper.createTestData('myTest', {
  user: { type: 'generated', dataType: 'user' },
  products: { type: 'fixture', fixture: 'products', dataKey: 'featuredProducts' }
});
```

## Available Test Data

### Users (`users.json`)

- **validUsers**: Complete user profiles with valid data
- **invalidUsers**: Users with validation errors for negative testing
- **existingUsers**: Users that already exist in the system

```javascript
// Examples
const validUser = testDataHelper.getUserData('valid');
const invalidUser = testDataHelper.getUserData('invalid');
const generatedUser = testDataHelper.getUserData('generated');
```

### Products (`products.json`)

- **featuredProducts**: Main product catalog
- **searchTestData**: Search query test cases
- **filterTestData**: Product filtering scenarios
- **outOfStockProducts**: Products with zero inventory

```javascript
// Examples
const product = testDataHelper.getProductData('featured');
const outOfStock = testDataHelper.getProductData('outOfStock');
```

### Shopping Cart (`cart.json`)

- **cartScenarios**: Complete cart workflows
- **cartValidation**: Error scenarios and limits
- **cartCalculations**: Tax and shipping calculations

```javascript
// Examples
const singleItem = testDataHelper.getCartData('singleItem');
const multipleItems = testDataHelper.getCartData('multipleItems');
```

### Checkout (`checkout.json`)

- **checkoutScenarios**: Complete checkout flows
- **paymentMethods**: Credit card test data
- **validationErrors**: Form validation scenarios
- **shippingOptions**: Available shipping methods

```javascript
// Examples
const checkout = testDataHelper.getCheckoutData('successfulCheckout');
const visa = testDataHelper.getPaymentMethodData('visa');
```

## Data Generation

### User Generation

```javascript
const user = testDataHelper.generateUniqueData('user', {
  firstName: 'Custom',
  age: { min: 25, max: 35 },
  preferences: { newsletter: false }
});
```

### Product Generation

```javascript
const product = testDataHelper.generateUniqueData('product', {
  category: 'Electronics',
  price: 99.99,
  inStock: true
});
```

### Credit Card Generation

```javascript
const visa = testDataHelper.generateUniqueData('creditCard', { type: 'visa' });
const amex = testDataHelper.generateUniqueData('creditCard', { type: 'amex' });
```

### Bulk Generation

```javascript
// Generate 10 users with common overrides
const users = testDataHelper.generateBulkData('user', 10, {
  preferences: { newsletter: true }
});

// Generate 5 products in same category
const products = testDataHelper.generateBulkData('product', 5, {
  category: 'Test Category'
});
```

## Data Validation

The system includes built-in validation schemas:

```javascript
// Validate user data
const validation = testDataHelper.validateTestData(userData, 'user');
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}

// Available schemas: user, product, address, creditCard
```

## Scenario Configuration

Define complex test scenarios in configuration:

```javascript
// In testDataConfig.js
scenarios: {
  userRegistration: {
    fixtures: [
      { name: 'users', key: 'validUsers', dataKey: 'validUsers' }
    ],
    generated: [
      { key: 'dynamicUser', dataType: 'user' }
    ]
  }
}

// In test
const scenarioData = testDataHelper.getScenarioData('userRegistration');
```

## Environment Configuration

Support for multiple environments:

```javascript
// Initialize with specific environment
const testDataHelper = new TestDataHelper('staging');

// Get environment-specific config
const config = testDataHelper.getEnvironmentConfig();
console.log(config.baseUrl); // https://staging.example.com
```

## Cleanup and Reset

Automatic cleanup prevents data pollution:

```javascript
test.afterEach(async ({ }, testInfo) => {
  // Clean up test-specific data
  testDataHelper.cleanupTestData(testInfo.title);
});

test.afterAll(async () => {
  // Clean up suite data
  testDataHelper.cleanupTestSuite();
});

// Manual reset
testDataHelper.reset();
```

## Advanced Features

### Custom Test Data Requirements

```javascript
const requirements = {
  primaryUser: {
    type: 'generated',
    dataType: 'user',
    overrides: { firstName: 'Primary' }
  },
  testProducts: {
    type: 'generated',
    dataType: 'product',
    bulk: true,
    count: 3
  },
  existingUser: {
    type: 'fixture',
    fixture: 'users',
    dataKey: 'validUsers'
  }
};

const testData = testDataHelper.createTestData('complexTest', requirements);
```

### Data Export and Statistics

```javascript
// Export all fixture data
const exportPath = testDataHelper.exportTestData('./exports/all-data.json');

// Get statistics
const stats = testDataHelper.getTestDataStats();
console.log('Available fixtures:', Object.keys(stats.fixtures));
```

### Configuration Options

Key configuration options in `testDataConfig.js`:

- **Generation settings**: Password length, age ranges, bulk limits
- **Validation schemas**: Field requirements and patterns
- **Cleanup settings**: When to clean temporary files
- **Environment settings**: URLs and database configurations
- **Logging settings**: What to log during operations

## Best Practices

1. **Use fixtures for stable data**: Consistent scenarios across test runs
2. **Generate unique data for isolation**: Prevent test interference
3. **Validate critical data**: Ensure data meets requirements
4. **Clean up after tests**: Prevent resource leaks
5. **Use scenarios for complex flows**: Combine fixtures and generation
6. **Override selectively**: Only override what's necessary for the test
7. **Bulk generate efficiently**: Use bulk operations for performance

## Integration with Page Objects

```javascript
// In your page object
class RegistrationPage extends BasePage {
  async fillRegistrationForm(userData) {
    await this.fillField('#firstName', userData.firstName);
    await this.fillField('#lastName', userData.lastName);
    await this.fillField('#email', userData.email);
    await this.fillField('#password', userData.password);
    // ... etc
  }
}

// In your test
test('user registration with valid data', async ({ page }) => {
  const userData = testDataHelper.getUserData('valid');
  const registrationPage = new RegistrationPage(page);
  
  await registrationPage.fillRegistrationForm(userData);
  await registrationPage.submitForm();
  
  // Assertions...
});
```

## Troubleshooting

### Common Issues

1. **Fixture not found**: Check file path and name in `fixtures/` directory
2. **Validation errors**: Review schema requirements in `testDataConfig.js`
3. **Unique data conflicts**: Call `testDataHelper.reset()` between test suites
4. **Bulk generation limits**: Check `maxBulkGeneration` in configuration
5. **Temp file cleanup**: Ensure proper cleanup in test hooks

### Debug Information

Enable detailed logging:

```javascript
// In testDataConfig.js
logging: {
  enabled: true,
  level: 'debug',
  logDataGeneration: true,
  logDataCleanup: true
}
```

## Examples

See `automated-tests/ui-tests/test-data-demo.spec.js` for comprehensive examples of all features.