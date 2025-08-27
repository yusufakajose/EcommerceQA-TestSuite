/**
 * Test Data Helper
 * Main interface for test data operations in Playwright tests
 */

const DataManager = require('./utils/DataManager');
const DataGenerator = require('./generators/DataGenerator');
const testDataConfig = require('./config/testDataConfig');

class TestDataHelper {
  constructor(environment = 'development') {
    this.dataManager = new DataManager();
    this.dataGenerator = new DataGenerator();
    this.environment = environment;
    this.config = testDataConfig;
    this.currentTestData = new Map();
  }

  /**
   * Initialize test data for a test suite
   * @param {string} suiteName - Name of the test suite
   */
  async initializeTestSuite(suiteName) {
    console.log(`Initializing test data for suite: ${suiteName}`);
    this.currentSuite = suiteName;

    // Reset generators for clean state
    this.dataManager.reset();

    // Log initialization if enabled
    if (this.config.logging.enabled && this.config.logging.logDataGeneration) {
      console.log(`Test data initialized for environment: ${this.environment}`);
    }
  }

  /**
   * Get test data for a specific scenario
   * @param {string} scenarioName - Name of the scenario
   * @param {object} customConfig - Custom configuration overrides
   * @returns {object} Complete test data for the scenario
   */
  getScenarioData(scenarioName, customConfig = {}) {
    const scenarioConfig = this.config.scenarios[scenarioName];

    if (!scenarioConfig) {
      throw new Error(`Scenario '${scenarioName}' not found in configuration`);
    }

    // Merge custom config with default scenario config
    const mergedConfig = {
      ...scenarioConfig,
      ...customConfig,
    };

    const scenarioData = this.dataManager.createScenarioData(mergedConfig);

    // Store for cleanup later
    this.currentTestData.set(scenarioName, scenarioData);

    return scenarioData;
  }

  /**
   * Get user test data
   * @param {string} userType - Type of user (valid, invalid, existing)
   * @param {number} index - Index of user to get (optional)
   * @returns {object} User data
   */
  getUserData(userType = 'valid', index = null) {
    const users = this.dataManager.getTestData('users');
    let userData;

    switch (userType) {
      case 'valid':
        userData =
          index !== null
            ? users.validUsers[index]
            : this.dataManager.getRandomTestData('users', 'validUsers');
        break;
      case 'invalid':
        userData =
          index !== null
            ? users.invalidUsers[index]
            : this.dataManager.getRandomTestData('users', 'invalidUsers');
        break;
      case 'existing':
        userData =
          index !== null
            ? users.existingUsers[index]
            : this.dataManager.getRandomTestData('users', 'existingUsers');
        break;
      case 'generated':
        userData = this.dataGenerator.generateUser();
        break;
      default:
        throw new Error(`Unknown user type: ${userType}`);
    }

    return userData;
  }

  /**
   * Get product test data
   * @param {string} productType - Type of product data
   * @param {number} index - Index of product to get (optional)
   * @returns {object} Product data
   */
  getProductData(productType = 'featured', index = null) {
    const products = this.dataManager.getTestData('products');
    let productData;

    switch (productType) {
      case 'featured':
        productData =
          index !== null
            ? products.featuredProducts[index]
            : this.dataManager.getRandomTestData('products', 'featuredProducts');
        break;
      case 'outOfStock':
        productData =
          index !== null
            ? products.outOfStockProducts[index]
            : this.dataManager.getRandomTestData('products', 'outOfStockProducts');
        break;
      case 'generated':
        productData = this.dataGenerator.generateProduct();
        break;
      default:
        throw new Error(`Unknown product type: ${productType}`);
    }

    return productData;
  }

  /**
   * Get cart test data
   * @param {string} scenarioName - Name of cart scenario
   * @returns {object} Cart scenario data
   */
  getCartData(scenarioName) {
    const cartData = this.dataManager.getTestData('cart');
    const scenario = cartData.cartScenarios.find((s) => s.scenarioName === scenarioName);

    if (!scenario) {
      throw new Error(`Cart scenario '${scenarioName}' not found`);
    }

    return scenario;
  }

  /**
   * Get checkout test data
   * @param {string} scenarioName - Name of checkout scenario
   * @returns {object} Checkout scenario data
   */
  getCheckoutData(scenarioName) {
    const checkoutData = this.dataManager.getTestData('checkout');
    const scenario = checkoutData.checkoutScenarios.find((s) => s.scenarioName === scenarioName);

    if (!scenario) {
      throw new Error(`Checkout scenario '${scenarioName}' not found`);
    }

    return scenario;
  }

  /**
   * Get payment method data
   * @param {string} cardType - Type of credit card
   * @returns {object} Payment method data
   */
  getPaymentMethodData(cardType = 'visa') {
    const paymentData = this.dataManager.getTestData('checkout');
    const paymentMethod = paymentData.paymentMethods.find((p) =>
      p.name.toLowerCase().includes(cardType.toLowerCase())
    );

    if (!paymentMethod) {
      // Generate if not found in fixtures
      return this.dataGenerator.generateCreditCard(cardType);
    }

    return paymentMethod;
  }

  /**
   * Generate unique test data for a test
   * @param {string} dataType - Type of data to generate
   * @param {object} overrides - Property overrides
   * @returns {object} Generated data
   */
  generateUniqueData(dataType, overrides = {}) {
    switch (dataType) {
      case 'user':
        return this.dataGenerator.generateUser(overrides);
      case 'product':
        return this.dataGenerator.generateProduct(overrides);
      case 'creditCard':
        return this.dataGenerator.generateCreditCard(overrides.type || 'visa');
      case 'address':
        return this.dataGenerator.generateAddress();
      default:
        throw new Error(`Unknown data type for generation: ${dataType}`);
    }
  }

  /**
   * Generate bulk test data
   * @param {string} dataType - Type of data to generate
   * @param {number} count - Number of items to generate
   * @param {object} overrides - Common overrides for all items
   * @returns {Array} Array of generated data
   */
  generateBulkData(dataType, count, overrides = {}) {
    if (count > this.config.generation.maxBulkGeneration) {
      throw new Error(
        `Bulk generation count (${count}) exceeds maximum allowed (${this.config.generation.maxBulkGeneration})`
      );
    }

    return this.dataGenerator.generateBulk(dataType, count, overrides);
  }

  /**
   * Validate test data against schema
   * @param {object} data - Data to validate
   * @param {string} schemaName - Name of the schema to validate against
   * @returns {object} Validation result
   */
  validateTestData(data, schemaName) {
    const schema = this.config.schemas[schemaName];

    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    return this.dataManager.validateData(data, schema);
  }

  /**
   * Create test data for specific test case
   * @param {string} testName - Name of the test
   * @param {object} requirements - Data requirements for the test
   * @returns {object} Complete test data set
   */
  createTestData(testName, requirements) {
    const testData = {};

    // Process each requirement
    Object.keys(requirements).forEach((key) => {
      const requirement = requirements[key];

      if (requirement.type === 'fixture') {
        testData[key] = this.dataManager.getTestData(requirement.fixture, requirement.dataKey);
      } else if (requirement.type === 'generated') {
        if (requirement.bulk) {
          testData[key] = this.generateBulkData(
            requirement.dataType,
            requirement.count || this.config.generation.defaultBulkSize,
            requirement.overrides || {}
          );
        } else {
          testData[key] = this.generateUniqueData(
            requirement.dataType,
            requirement.overrides || {}
          );
        }
      } else if (requirement.type === 'random') {
        testData[key] = this.dataManager.getRandomTestData(
          requirement.fixture,
          requirement.dataKey
        );
      }
    });

    // Store for cleanup
    this.currentTestData.set(testName, testData);

    return testData;
  }

  /**
   * Get environment-specific configuration
   * @returns {object} Environment configuration
   */
  getEnvironmentConfig() {
    return this.config.environments[this.environment] || this.config.environments.development;
  }

  /**
   * Clean up test data after test completion
   * @param {string} testName - Name of the completed test
   */
  cleanupTestData(testName) {
    if (this.config.cleanup.tempFilesAfterTest) {
      this.dataManager.cleanupTempFiles();
    }

    if (this.config.cleanup.generatedDataAfterTest) {
      this.currentTestData.delete(testName);
    }

    if (this.config.logging.enabled && this.config.logging.logDataCleanup) {
      console.log(`Cleaned up test data for: ${testName}`);
    }
  }

  /**
   * Clean up all test data after test suite completion
   */
  cleanupTestSuite() {
    if (this.config.cleanup.tempFilesAfterSuite) {
      this.dataManager.cleanupTempFiles();
    }

    if (this.config.cleanup.generatedDataAfterSuite) {
      this.currentTestData.clear();
    }

    // Reset generators
    this.dataManager.reset();

    if (this.config.logging.enabled && this.config.logging.logDataCleanup) {
      console.log(`Cleaned up all test data for suite: ${this.currentSuite}`);
    }
  }

  /**
   * Export test data for reporting or debugging
   * @param {string} outputPath - Path for the export file
   * @returns {string} Path to the exported file
   */
  exportTestData(outputPath = null) {
    return this.dataManager.exportAllFixtures(outputPath);
  }

  /**
   * Get statistics about available test data
   * @returns {object} Test data statistics
   */
  getTestDataStats() {
    const stats = {
      fixtures: {},
      currentTestData: this.currentTestData.size,
      environment: this.environment,
    };

    // Get stats for each fixture
    Object.keys(this.config.fixtures).forEach((fixtureName) => {
      stats.fixtures[fixtureName] = this.dataManager.getDataStats(fixtureName);
    });

    return stats;
  }

  /**
   * Reset all test data and generators
   */
  reset() {
    this.dataManager.reset();
    this.currentTestData.clear();
  }
}

module.exports = TestDataHelper;
