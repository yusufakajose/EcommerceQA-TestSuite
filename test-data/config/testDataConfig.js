/**
 * Test Data Configuration
 * Central configuration for test data management
 */

const testDataConfig = {
  // Data generation settings
  generation: {
    defaultPasswordLength: 12,
    defaultUserAge: { min: 18, max: 65 },
    defaultPhoneFormat: 'US',
    uniqueEmailDomain: 'testautomation.com',
    
    // Bulk generation limits
    maxBulkGeneration: 1000,
    defaultBulkSize: 10
  },

  // Fixture file mappings
  fixtures: {
    users: {
      file: 'users.json',
      validUsersKey: 'validUsers',
      invalidUsersKey: 'invalidUsers',
      existingUsersKey: 'existingUsers'
    },
    products: {
      file: 'products.json',
      featuredProductsKey: 'featuredProducts',
      searchTestDataKey: 'searchTestData',
      filterTestDataKey: 'filterTestData',
      outOfStockProductsKey: 'outOfStockProducts'
    },
    cart: {
      file: 'cart.json',
      cartScenariosKey: 'cartScenarios',
      cartValidationKey: 'cartValidation',
      cartCalculationsKey: 'cartCalculations'
    },
    checkout: {
      file: 'checkout.json',
      checkoutScenariosKey: 'checkoutScenarios',
      paymentMethodsKey: 'paymentMethods',
      validationErrorsKey: 'validationErrors',
      shippingOptionsKey: 'shippingOptions'
    }
  },

  // Validation schemas
  schemas: {
    user: {
      firstName: { required: true, type: 'string', minLength: 1, maxLength: 50 },
      lastName: { required: true, type: 'string', minLength: 1, maxLength: 50 },
      email: { 
        required: true, 
        type: 'string', 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 255
      },
      password: { 
        required: true, 
        type: 'string', 
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/
      },
      phone: { 
        required: true, 
        type: 'string',
        pattern: /^\+?[\d\s\-\(\)]+$/
      },
      dateOfBirth: {
        required: false,
        type: 'string',
        pattern: /^\d{4}-\d{2}-\d{2}$/
      }
    },
    
    product: {
      id: { required: true, type: 'string' },
      name: { required: true, type: 'string', minLength: 1, maxLength: 200 },
      category: { required: true, type: 'string' },
      price: { required: true, type: 'number', min: 0 },
      rating: { required: false, type: 'number', min: 0, max: 5 },
      inStock: { required: true, type: 'boolean' },
      stockQuantity: { required: true, type: 'number', min: 0 }
    },
    
    address: {
      street: { required: true, type: 'string', minLength: 1, maxLength: 100 },
      city: { required: true, type: 'string', minLength: 1, maxLength: 50 },
      state: { required: true, type: 'string', minLength: 2, maxLength: 50 },
      zipCode: { required: true, type: 'string', pattern: /^\d{5}(-\d{4})?$/ },
      country: { required: true, type: 'string', minLength: 1, maxLength: 50 }
    },
    
    creditCard: {
      cardNumber: { 
        required: true, 
        type: 'string',
        pattern: /^\d{13,19}$/
      },
      expiryMonth: { 
        required: true, 
        type: 'string',
        pattern: /^(0[1-9]|1[0-2])$/
      },
      expiryYear: { 
        required: true, 
        type: 'string',
        pattern: /^\d{4}$/
      },
      cvv: { 
        required: true, 
        type: 'string',
        pattern: /^\d{3,4}$/
      },
      cardholderName: { 
        required: true, 
        type: 'string', 
        minLength: 1, 
        maxLength: 100 
      }
    }
  },

  // Test scenarios configuration
  scenarios: {
    userRegistration: {
      fixtures: [
        { name: 'users', key: 'validUsers', dataKey: 'validUsers' },
        { name: 'users', key: 'invalidUsers', dataKey: 'invalidUsers' }
      ],
      generated: [
        { key: 'dynamicUser', dataType: 'user', overrides: {} }
      ]
    },
    
    productSearch: {
      fixtures: [
        { name: 'products', key: 'products', dataKey: 'featuredProducts' },
        { name: 'products', key: 'searchData', dataKey: 'searchTestData' }
      ]
    },
    
    shoppingCart: {
      fixtures: [
        { name: 'cart', key: 'scenarios', dataKey: 'cartScenarios' },
        { name: 'products', key: 'products', dataKey: 'featuredProducts' }
      ],
      generated: [
        { key: 'testUser', dataType: 'user' }
      ]
    },
    
    checkoutProcess: {
      fixtures: [
        { name: 'checkout', key: 'scenarios', dataKey: 'checkoutScenarios' },
        { name: 'checkout', key: 'paymentMethods', dataKey: 'paymentMethods' }
      ],
      generated: [
        { key: 'testUser', dataType: 'user' },
        { key: 'testCard', dataType: 'creditCard', cardType: 'visa' }
      ]
    }
  },

  // Environment-specific settings
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3001/api',
      database: 'test_dev',
      cleanupAfterTest: true
    },
    staging: {
      baseUrl: 'https://staging.example.com',
      apiUrl: 'https://staging-api.example.com/api',
      database: 'test_staging',
      cleanupAfterTest: true
    },
    production: {
      baseUrl: 'https://example.com',
      apiUrl: 'https://api.example.com/api',
      database: 'test_prod',
      cleanupAfterTest: false // Never cleanup in production
    }
  },

  // File paths
  paths: {
    fixtures: './test-data/fixtures',
    temp: './test-data/temp',
    exports: './test-data/exports',
    reports: './reports/test-data'
  },

  // Cleanup settings
  cleanup: {
    tempFilesAfterTest: true,
    tempFilesAfterSuite: true,
    generatedDataAfterTest: false,
    generatedDataAfterSuite: true,
    maxTempFileAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxTempFiles: 100
  },

  // Logging settings
  logging: {
    enabled: true,
    level: 'info', // debug, info, warn, error
    logDataGeneration: true,
    logDataCleanup: true,
    logFileOperations: false
  }
};

module.exports = testDataConfig;