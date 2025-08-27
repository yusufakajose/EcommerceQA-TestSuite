#!/usr/bin/env node

/**
 * User Journey Simulator
 * Simulates realistic user behavior patterns for performance testing
 */

const fs = require('fs');
const path = require('path');

class UserJourneySimulator {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'automated-tests/performance-tests');
    this.scenariosFile = path.join(this.baseDir, 'scenarios/load-test-scenarios.json');
    this.outputDir = path.join(this.baseDir, 'jmeter/generated-plans');

    this.scenarios = this.loadScenarios();
    this.ensureDirectories();
  }

  /**
   * Load scenario configurations
   */
  loadScenarios() {
    try {
      const scenariosData = fs.readFileSync(this.scenariosFile, 'utf8');
      return JSON.parse(scenariosData);
    } catch (error) {
      throw new Error(`Failed to load scenarios: ${error.message}`);
    }
  }

  /**
   * Ensure output directories exist
   */
  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate realistic think times based on user behavior
   */
  generateThinkTime(action, userType = 'normal') {
    const thinkTimes = {
      casual_browser: {
        browse_products: { min: 2000, max: 8000 },
        search_products: { min: 1500, max: 5000 },
        view_product_details: { min: 3000, max: 12000 },
        filter_products: { min: 1000, max: 4000 },
      },
      registered_shopper: {
        user_login: { min: 500, max: 2000 },
        browse_products: { min: 1500, max: 6000 },
        add_to_cart: { min: 2000, max: 5000 },
        view_cart: { min: 1000, max: 3000 },
        checkout: { min: 3000, max: 15000 },
      },
      new_user_registration: {
        user_registration: { min: 2000, max: 8000 },
        browse_products: { min: 2000, max: 8000 },
        search_products: { min: 1500, max: 5000 },
        add_to_cart: { min: 2000, max: 6000 },
        checkout: { min: 5000, max: 20000 },
      },
      power_shopper: {
        user_login: { min: 300, max: 1000 },
        search_products: { min: 800, max: 2500 },
        add_multiple_to_cart: { min: 1000, max: 3000 },
        modify_cart: { min: 500, max: 2000 },
        quick_checkout: { min: 1500, max: 5000 },
      },
    };

    const userThinkTimes = thinkTimes[userType] || thinkTimes.registered_shopper;
    const actionThinkTime = userThinkTimes[action] || { min: 1000, max: 3000 };

    return actionThinkTime;
  }

  /**
   * Generate comprehensive test scenario
   */
  generateTestScenario(scenarioName, options = {}) {
    const scenario = this.scenarios.scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Scenario '${scenarioName}' not found`);
    }

    const userJourneys = Object.keys(this.scenarios.userJourneys).map((journeyName) => {
      const journey = this.scenarios.userJourneys[journeyName];
      return {
        name: journey.name,
        description: journey.description,
        weight: journey.weight,
        steps: journey.steps.map((step) => ({
          ...step,
          thinkTime: this.generateThinkTime(step.action, journeyName),
        })),
      };
    });

    const testScenario = {
      name: scenario.name,
      description: scenario.description,
      configuration: {
        totalUsers: scenario.users,
        rampUpPeriod: scenario.rampUp,
        testDuration: scenario.duration,
        loops: scenario.loops,
        baseUrl: options.baseUrl || 'http://localhost:3000',
      },
      userJourneys,
      performanceThresholds: this.scenarios.performanceThresholds,
    };

    return testScenario;
  }

  /**
   * Save generated test scenario to file
   */
  saveTestScenario(scenarioName, testScenario) {
    const filename = `${scenarioName}-enhanced-scenario.json`;
    const filepath = path.join(this.outputDir, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(testScenario, null, 2));
      console.log(`Enhanced test scenario saved: ${filepath}`);
      return filepath;
    } catch (error) {
      throw new Error(`Failed to save test scenario: ${error.message}`);
    }
  }

  /**
   * Generate all enhanced test scenarios
   */
  generateAllScenarios(options = {}) {
    const generatedScenarios = [];

    console.log('Generating enhanced test scenarios with realistic user journeys...');

    Object.keys(this.scenarios.scenarios).forEach((scenarioName) => {
      try {
        console.log(`\nGenerating scenario: ${scenarioName}`);
        const testScenario = this.generateTestScenario(scenarioName, options);
        const filepath = this.saveTestScenario(scenarioName, testScenario);

        generatedScenarios.push({
          name: scenarioName,
          filepath,
          scenario: testScenario,
        });

        console.log(`  ✓ Generated ${testScenario.userJourneys.length} user journeys`);
      } catch (error) {
        console.error(`Failed to generate scenario ${scenarioName}:`, error.message);
      }
    });

    console.log(`\nGenerated ${generatedScenarios.length} enhanced test scenarios`);
    return generatedScenarios;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
User Journey Simulator

Usage: node scenarios/user-journey-simulator.js [OPTIONS]

Options:
  --base-url URL        Base URL for testing (default: http://localhost:3000)
  --scenario NAME       Generate specific scenario only
  --help, -h            Show this help message

Examples:
  node scenarios/user-journey-simulator.js
  node scenarios/user-journey-simulator.js --scenario peak_load
`);
    process.exit(0);
  }

  const simulator = new UserJourneySimulator();
  const options = {};
  let specificScenario = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--base-url':
        if (nextArg) {
          options.baseUrl = nextArg;
          i++;
        }
        break;
      case '--scenario':
        if (nextArg) {
          specificScenario = nextArg;
          i++;
        }
        break;
    }
  }

  try {
    if (specificScenario) {
      console.log(`Generating specific scenario: ${specificScenario}`);
      const testScenario = simulator.generateTestScenario(specificScenario, options);
      const filepath = simulator.saveTestScenario(specificScenario, testScenario);

      console.log(`\nGenerated enhanced test scenario: ${filepath}`);
      console.log(`User journeys: ${testScenario.userJourneys.length}`);
    } else {
      const generatedScenarios = simulator.generateAllScenarios(options);
    }

    console.log('\nUser journey simulation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('User journey simulation failed:', error.message);
    process.exit(1);
  }
}

module.exports = UserJourneySimulator;
