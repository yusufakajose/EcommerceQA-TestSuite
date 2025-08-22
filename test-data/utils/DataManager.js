/**
 * Data Manager Utility
 * Handles test data loading, cleanup, and reset operations
 */

const fs = require('fs');
const path = require('path');
const DataGenerator = require('../generators/DataGenerator');

class DataManager {
  constructor() {
    this.dataGenerator = new DataGenerator();
    this.fixturesPath = path.join(__dirname, '..', 'fixtures');
    this.tempDataPath = path.join(__dirname, '..', 'temp');
    this.loadedFixtures = new Map();
    this.createdTempFiles = new Set();
    
    // Ensure temp directory exists
    this.ensureTempDirectory();
  }

  /**
   * Ensure temp directory exists
   */
  ensureTempDirectory() {
    if (!fs.existsSync(this.tempDataPath)) {
      fs.mkdirSync(this.tempDataPath, { recursive: true });
    }
  }

  /**
   * Load fixture data from JSON file
   * @param {string} fixtureName - Name of the fixture file (without .json extension)
   * @returns {object} Parsed fixture data
   */
  loadFixture(fixtureName) {
    if (this.loadedFixtures.has(fixtureName)) {
      return this.loadedFixtures.get(fixtureName);
    }

    const fixturePath = path.join(this.fixturesPath, `${fixtureName}.json`);
    
    if (!fs.existsSync(fixturePath)) {
      throw new Error(`Fixture file not found: ${fixturePath}`);
    }

    try {
      const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
      this.loadedFixtures.set(fixtureName, fixtureData);
      return fixtureData;
    } catch (error) {
      throw new Error(`Error loading fixture ${fixtureName}: ${error.message}`);
    }
  }

  /**
   * Get specific test data from a fixture
   * @param {string} fixtureName - Name of the fixture file
   * @param {string} dataKey - Key to access specific data within the fixture
   * @returns {any} Specific test data
   */
  getTestData(fixtureName, dataKey = null) {
    const fixture = this.loadFixture(fixtureName);
    
    if (dataKey) {
      if (!fixture.hasOwnProperty(dataKey)) {
        throw new Error(`Data key '${dataKey}' not found in fixture '${fixtureName}'`);
      }
      return fixture[dataKey];
    }
    
    return fixture;
  }

  /**
   * Get a random item from test data array
   * @param {string} fixtureName - Name of the fixture file
   * @param {string} dataKey - Key to access specific data array
   * @returns {any} Random item from the array
   */
  getRandomTestData(fixtureName, dataKey) {
    const data = this.getTestData(fixtureName, dataKey);
    
    if (!Array.isArray(data)) {
      throw new Error(`Data at '${dataKey}' in fixture '${fixtureName}' is not an array`);
    }
    
    if (data.length === 0) {
      throw new Error(`Data array at '${dataKey}' in fixture '${fixtureName}' is empty`);
    }
    
    return data[Math.floor(Math.random() * data.length)];
  }

  /**
   * Generate and save temporary test data
   * @param {string} fileName - Name for the temporary file
   * @param {string} dataType - Type of data to generate
   * @param {number} count - Number of items to generate
   * @param {object} overrides - Overrides for generated data
   * @returns {string} Path to the created temporary file
   */
  generateTempData(fileName, dataType, count = 1, overrides = {}) {
    const data = this.dataGenerator.generateBulk(dataType, count, overrides);
    const tempFilePath = path.join(this.tempDataPath, `${fileName}.json`);
    
    fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2));
    this.createdTempFiles.add(tempFilePath);
    
    return tempFilePath;
  }

  /**
   * Create a custom test data file
   * @param {string} fileName - Name for the file
   * @param {object} data - Data to save
   * @param {boolean} isTemp - Whether this is a temporary file
   * @returns {string} Path to the created file
   */
  createTestDataFile(fileName, data, isTemp = true) {
    const filePath = isTemp ? 
      path.join(this.tempDataPath, `${fileName}.json`) :
      path.join(this.fixturesPath, `${fileName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    if (isTemp) {
      this.createdTempFiles.add(filePath);
    }
    
    return filePath;
  }

  /**
   * Merge multiple fixtures into a single data object
   * @param {Array<string>} fixtureNames - Array of fixture names to merge
   * @returns {object} Merged data object
   */
  mergeFixtures(fixtureNames) {
    const mergedData = {};
    
    fixtureNames.forEach(fixtureName => {
      const fixture = this.loadFixture(fixtureName);
      Object.assign(mergedData, fixture);
    });
    
    return mergedData;
  }

  /**
   * Create test scenario data combining fixtures and generated data
   * @param {object} scenario - Scenario configuration
   * @returns {object} Complete scenario data
   */
  createScenarioData(scenario) {
    const scenarioData = {};
    
    // Load fixture data
    if (scenario.fixtures) {
      scenario.fixtures.forEach(fixture => {
        const fixtureData = this.loadFixture(fixture.name);
        if (fixture.key) {
          scenarioData[fixture.key] = fixtureData[fixture.dataKey || fixture.key];
        } else {
          Object.assign(scenarioData, fixtureData);
        }
      });
    }
    
    // Generate dynamic data
    if (scenario.generated) {
      scenario.generated.forEach(gen => {
        if (gen.type === 'bulk') {
          scenarioData[gen.key] = this.dataGenerator.generateBulk(
            gen.dataType, 
            gen.count, 
            gen.overrides || {}
          );
        } else {
          switch (gen.dataType) {
            case 'user':
              scenarioData[gen.key] = this.dataGenerator.generateUser(gen.overrides || {});
              break;
            case 'product':
              scenarioData[gen.key] = this.dataGenerator.generateProduct(gen.overrides || {});
              break;
            case 'creditCard':
              scenarioData[gen.key] = this.dataGenerator.generateCreditCard(gen.cardType || 'visa');
              break;
            default:
              throw new Error(`Unknown generated data type: ${gen.dataType}`);
          }
        }
      });
    }
    
    return scenarioData;
  }

  /**
   * Clean up all temporary files
   */
  cleanupTempFiles() {
    this.createdTempFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Warning: Could not delete temp file ${filePath}: ${error.message}`);
      }
    });
    
    this.createdTempFiles.clear();
  }

  /**
   * Reset all data generators and clear caches
   */
  reset() {
    this.dataGenerator.reset();
    this.loadedFixtures.clear();
    this.cleanupTempFiles();
  }

  /**
   * Validate test data against a schema
   * @param {object} data - Data to validate
   * @param {object} schema - Validation schema
   * @returns {object} Validation result
   */
  validateData(data, schema) {
    const errors = [];
    const warnings = [];
    
    // Basic validation logic
    Object.keys(schema).forEach(key => {
      const rule = schema[key];
      const value = data[key];
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
      }
      
      if (value !== undefined && rule.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
          errors.push(`${key} should be of type ${rule.type}, got ${actualType}`);
        }
      }
      
      if (value !== undefined && rule.minLength && value.length < rule.minLength) {
        errors.push(`${key} should have minimum length of ${rule.minLength}`);
      }
      
      if (value !== undefined && rule.maxLength && value.length > rule.maxLength) {
        warnings.push(`${key} exceeds maximum length of ${rule.maxLength}`);
      }
      
      if (value !== undefined && rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${key} does not match required pattern`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get data statistics
   * @param {string} fixtureName - Name of the fixture
   * @returns {object} Statistics about the fixture data
   */
  getDataStats(fixtureName) {
    const fixture = this.loadFixture(fixtureName);
    const stats = {
      fixtureName,
      totalKeys: Object.keys(fixture).length,
      dataTypes: {},
      arraySizes: {}
    };
    
    Object.keys(fixture).forEach(key => {
      const value = fixture[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      
      stats.dataTypes[key] = type;
      
      if (Array.isArray(value)) {
        stats.arraySizes[key] = value.length;
      }
    });
    
    return stats;
  }

  /**
   * Export all fixture data to a single file
   * @param {string} outputPath - Path for the exported file
   * @returns {string} Path to the exported file
   */
  exportAllFixtures(outputPath = null) {
    const exportPath = outputPath || path.join(this.tempDataPath, 'all-fixtures-export.json');
    const allFixtures = {};
    
    // Get all fixture files
    const fixtureFiles = fs.readdirSync(this.fixturesPath)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    // Load all fixtures
    fixtureFiles.forEach(fixtureName => {
      allFixtures[fixtureName] = this.loadFixture(fixtureName);
    });
    
    fs.writeFileSync(exportPath, JSON.stringify(allFixtures, null, 2));
    
    if (outputPath === null) {
      this.createdTempFiles.add(exportPath);
    }
    
    return exportPath;
  }
}

module.exports = DataManager;