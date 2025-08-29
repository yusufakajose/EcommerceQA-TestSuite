#!/usr/bin/env node

/// <reference types="newman" />
// @ts-check
/**
 * Newman Test Runner
 * Simplified script to run Postman collections with Newman
 */

const newman = require('newman');
const fs = require('fs');
const path = require('path');

class NewmanRunner {
  constructor() {
    this.configPath = path.join(process.cwd(), 'config/postman/newman.config.json');
    this.config = this.loadConfig();
    this.reportsDir = path.join(process.cwd(), 'reports');

    this.ensureReportsDirectory();
  }

  /**
   * Load Newman configuration
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Failed to load Newman config:', error.message);
    }

    return this.getDefaultConfig();
  }

  /**
   * Get default configuration if config file doesn't exist
   */
  getDefaultConfig() {
    return {
      environments: {
        development: 'config/postman/environments/development.postman_environment.json',
        staging: 'config/postman/environments/staging.postman_environment.json',
        production: 'config/postman/environments/production.postman_environment.json',
      },
      collections: {
        'user-management': 'config/postman/collections/user-management.postman_collection.json',
        'product-catalog': 'config/postman/collections/product-catalog.postman_collection.json',
        'order-processing': 'config/postman/collections/order-processing.postman_collection.json',
        'complete-suite':
          'config/postman/collections/ecommerce-api-complete.postman_collection.json',
        'auth-workflow': 'config/postman/workflows/authentication-workflow.postman_collection.json',
      },
      defaultOptions: {
        reporters: ['cli', 'htmlextra'],
        timeout: 10000,
        delayRequest: 100,
      },
    };
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Run Newman collection
   */
  /**
   * Run Newman collection
   * @param {string} collectionName
   * @param {string} [environmentName]
   * @param {Partial<import('newman').NewmanRunOptions> & { verbose?: boolean }} [options]
   */
  async runCollection(collectionName, environmentName = 'development', options = {}) {
    const collection = this.config.collections[collectionName];
    const environment = this.config.environments[environmentName];

    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found in config`);
    }

    if (!environment) {
      throw new Error(`Environment '${environmentName}' not found in config`);
    }

    /** @type {import('newman').NewmanRunOptions} */
    const newmanOptions = {
      ...options,
      collection: path.resolve(collection),
      environment: path.resolve(environment),
      reporters: this.config.defaultOptions.reporters,
      timeout: this.config.defaultOptions.timeout,
      delayRequest: this.config.defaultOptions.delayRequest,
    };

    // Set up HTML reporter
    const reporters = Array.isArray(newmanOptions.reporters)
      ? newmanOptions.reporters
      : newmanOptions.reporters
        ? [newmanOptions.reporters]
        : [];

    if (reporters.includes('htmlextra')) {
      const reportName = `${collectionName}-${environmentName}-report.html`;
      newmanOptions.reporter = {
        htmlextra: {
          export: path.join(this.reportsDir, reportName),
          template: 'dashboard',
          logs: true,
          browserTitle: `${collectionName} API Test Report`,
          title: `${collectionName} Test Results - ${environmentName}`,
          displayProgressBar: true,
        },
      };
    }

    // Set up JSON reporter if specified
    if (reporters.includes('json')) {
      const jsonReportName = `${collectionName}-${environmentName}-results.json`;
      newmanOptions.reporter = {
        ...newmanOptions.reporter,
        json: {
          export: path.join(this.reportsDir, jsonReportName),
        },
      };
    }

    console.log(`🚀 Running ${collectionName} collection on ${environmentName} environment...`);
    console.log(`📁 Collection: ${collection}`);
    console.log(`🌍 Environment: ${environment}`);

    if (options.iterationData) {
      console.log(`📊 Data file: ${options.iterationData}`);
    }

    return new Promise((resolve, reject) => {
      newman.run(newmanOptions, (err, /** @type {import('newman').NewmanRunSummary} */ summary) => {
        if (err) {
          console.error('❌ Newman run failed:', err);
          reject(err);
          return;
        }

        const stats = summary.run.stats;
        const failures = summary.run.failures;

        console.log('\n📊 Test Results Summary:');
        console.log(`   Total Requests: ${stats.requests.total}`);
        console.log(`   Requests Failed: ${stats.requests.failed}`);
        console.log(`   Total Assertions: ${stats.assertions.total}`);
        console.log(`   Assertions Failed: ${stats.assertions.failed}`);
        console.log(`   Total Test Scripts: ${stats.testScripts.total}`);
        console.log(`   Test Scripts Failed: ${stats.testScripts.failed}`);

        if (failures.length > 0) {
          console.log('\n❌ Test Failures:');
          failures.forEach((failure, index) => {
            console.log(`   ${index + 1}. ${failure.error.name}: ${failure.error.message}`);
            if (failure.source && failure.source.name) {
              console.log(`      Source: ${failure.source.name}`);
            }
          });
        }

        const reportPath = newmanOptions.reporter?.htmlextra?.export;
        if (reportPath) {
          console.log(`\n📄 HTML Report: ${reportPath}`);
        }

        const failedAssertions = stats.assertions.failed || 0;
        const failedRequests = stats.requests.failed || 0;
        if (failedAssertions > 0 || failedRequests > 0) {
          console.log('\n⚠️  Some tests failed. Check the detailed report for more information.');
          resolve({ success: false, summary });
        } else {
          console.log('\n✅ All tests passed successfully!');
          resolve({ success: true, summary });
        }
      });
    });
  }

  /**
   * Run predefined script from config
   */
  async runScript(scriptName) {
    const script = this.config.scripts?.[scriptName];

    if (!script) {
      throw new Error(`Script '${scriptName}' not found in config`);
    }

    const options = {
      ...script.options,
      iterationData: script.data ? path.resolve(this.config.data[script.data]) : undefined,
    };

    return this.runCollection(script.collection, script.environment, options);
  }

  /**
   * List available collections and environments
   */
  listOptions() {
    console.log('📚 Available Collections:');
    Object.keys(this.config.collections).forEach((name) => {
      console.log(`   - ${name}`);
    });

    console.log('\n🌍 Available Environments:');
    Object.keys(this.config.environments).forEach((name) => {
      console.log(`   - ${name}`);
    });

    if (this.config.scripts) {
      console.log('\n🎯 Available Scripts:');
      Object.keys(this.config.scripts).forEach((name) => {
        console.log(`   - ${name}`);
      });
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
Newman Test Runner

Usage: node scripts/api-tests/run-newman.js [command] [options]

Commands:
  run <collection> [environment]    Run a specific collection
  script <scriptName>               Run a predefined script
  list                             List available options
  help                             Show this help message

Examples:
  node scripts/api-tests/run-newman.js run user-management development
  node scripts/api-tests/run-newman.js run complete-suite staging
  node scripts/api-tests/run-newman.js script test:api:all
  node scripts/api-tests/run-newman.js list

Options:
  --data <file>                    Use data file for iterations
  --iterations <count>             Number of iterations to run
  --timeout <ms>                   Request timeout in milliseconds
  --delay <ms>                     Delay between requests
  --reporters <list>               Comma-separated list of reporters
  --bail                           Stop on first failure
  --verbose                        Verbose output

Environment Variables:
  NEWMAN_ENVIRONMENT               Default environment to use
  NEWMAN_TIMEOUT                   Default timeout value
  NEWMAN_DELAY                     Default delay between requests
`);
  }
}

// CLI Interface
async function main() {
  const runner = new NewmanRunner();
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help') {
    runner.showHelp();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'run': {
        const collection = args[1];
        const environment = args[2] || process.env.NEWMAN_ENVIRONMENT || 'development';

        if (!collection) {
          console.error('❌ Collection name is required');
          runner.showHelp();
          process.exit(1);
        }

        // Parse additional options
        const options = {};
        for (let i = 3; i < args.length; i++) {
          const arg = args[i];
          const nextArg = args[i + 1];

          switch (arg) {
            case '--data':
              if (nextArg) {
                options.iterationData = path.resolve(nextArg);
                i++;
              }
              break;
            case '--iterations':
              if (nextArg) {
                options.iterationCount = parseInt(nextArg);
                i++;
              }
              break;
            case '--timeout':
              if (nextArg) {
                options.timeout = parseInt(nextArg);
                i++;
              }
              break;
            case '--delay':
              if (nextArg) {
                options.delayRequest = parseInt(nextArg);
                i++;
              }
              break;
            case '--reporters':
              if (nextArg) {
                options.reporters = nextArg.split(',');
                i++;
              }
              break;
            case '--bail':
              options.bail = true;
              break;
            case '--verbose':
              options.verbose = true;
              break;
          }
        }

        const result = await runner.runCollection(collection, environment, options);
        process.exit(result.success ? 0 : 1);
        break;
      }

      case 'script': {
        const scriptName = args[1];

        if (!scriptName) {
          console.error('❌ Script name is required');
          runner.showHelp();
          process.exit(1);
        }

        const scriptResult = await runner.runScript(scriptName);
        process.exit(scriptResult.success ? 0 : 1);
        break;
      }

      case 'list':
        runner.listOptions();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        runner.showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = NewmanRunner;
