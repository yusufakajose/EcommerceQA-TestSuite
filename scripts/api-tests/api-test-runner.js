#!/usr/bin/env node

/**
 * Enhanced API Test Runner
 * Provides advanced Newman automation with data-driven testing capabilities
 */

const newman = require('newman');
const fs = require('fs');
const path = require('path');

class APITestRunner {
  constructor() {
    this.configPath = path.join(process.cwd(), 'config/postman/newman.config.json');
    this.config = this.loadConfig();
    this.reportsDir = path.join(process.cwd(), 'reports/api-tests');
    this.resultsDir = path.join(process.cwd(), 'test-results/api');

    this.ensureDirectories();
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
   * Get default configuration
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
      data: {
        users: 'config/postman/data/users.csv',
        products: 'config/postman/data/products.csv',
        orders: 'config/postman/data/orders.csv',
      },
      defaultOptions: {
        reporters: ['cli', 'htmlextra', 'json'],
        timeout: 10000,
        delayRequest: 100,
        iterationCount: 1,
        bail: false,
      },
    };
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.reportsDir, this.resultsDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Run a single collection with enhanced options
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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPrefix = `${collectionName}-${environmentName}-${timestamp}`;

    const newmanOptions = {
      collection: path.resolve(collection),
      environment: path.resolve(environment),
      reporters: options.reporters || this.config.defaultOptions.reporters,
      timeout: options.timeout || this.config.defaultOptions.timeout,
      delayRequest: options.delayRequest || this.config.defaultOptions.delayRequest,
      iterationCount: options.iterationCount || this.config.defaultOptions.iterationCount,
      bail: options.bail || this.config.defaultOptions.bail,
      ...options,
    };

    // Configure reporters
    newmanOptions.reporter = {};

    if (newmanOptions.reporters.includes('htmlextra')) {
      newmanOptions.reporter.htmlextra = {
        export: path.join(this.reportsDir, `${reportPrefix}-report.html`),
        logs: true,
        browserTitle: `${collectionName} API Test Report`,
        title: `${collectionName} Test Results - ${environmentName}`,
        displayProgressBar: true,
        omitHeaders: false,
        omitRequestBodies: false,
        omitResponseBodies: false,
        showOnlyFails: false,
      };
    }

    if (newmanOptions.reporters.includes('json')) {
      newmanOptions.reporter.json = {
        export: path.join(this.resultsDir, `${reportPrefix}-results.json`),
      };
    }

    if (newmanOptions.reporters.includes('junit')) {
      newmanOptions.reporter.junit = {
        export: path.join(this.resultsDir, `${reportPrefix}-junit.xml`),
      };
    }

    // Add data file if specified
    if (options.dataFile) {
      newmanOptions.iterationData = path.resolve(options.dataFile);
    }

    console.log(`🚀 Running ${collectionName} collection on ${environmentName} environment...`);
    console.log(`📁 Collection: ${collection}`);
    console.log(`🌍 Environment: ${environment}`);

    if (newmanOptions.iterationData) {
      console.log(`📊 Data file: ${newmanOptions.iterationData}`);
      console.log(`🔄 Iterations: ${newmanOptions.iterationCount}`);
    }

    return new Promise((resolve, reject) => {
      newman.run(newmanOptions, (err, summary) => {
        if (err) {
          console.error('❌ Newman run failed:', err);
          reject(err);
          return;
        }

        const result = this.processSummary(summary, collectionName, environmentName);

        // Save summary to file
        const summaryPath = path.join(this.resultsDir, `${reportPrefix}-summary.json`);
        fs.writeFileSync(summaryPath, JSON.stringify(result, null, 2));

        resolve(result);
      });
    });
  }

  /**
   * Process Newman summary and create detailed results
   */
  processSummary(summary, collectionName, environmentName) {
    const stats = summary.run.stats;
    const failures = summary.run.failures;
    const executions = summary.run.executions;

    const result = {
      collection: collectionName,
      environment: environmentName,
      timestamp: new Date().toISOString(),
      duration: summary.run.timings.completed - summary.run.timings.started,
      stats: {
        requests: {
          total: stats.requests.total,
          failed: stats.requests.failed,
          pending: stats.requests.pending,
        },
        assertions: {
          total: stats.assertions.total,
          failed: stats.assertions.failed,
          pending: stats.assertions.pending,
        },
        testScripts: {
          total: stats.testScripts.total,
          failed: stats.testScripts.failed,
          pending: stats.testScripts.pending,
        },
        prerequestScripts: {
          total: stats.prerequestScripts.total,
          failed: stats.prerequestScripts.failed,
          pending: stats.prerequestScripts.pending,
        },
      },
      success: stats.assertions.failed === 0 && stats.requests.failed === 0,
      failures: failures.map((failure) => ({
        name: failure.error.name,
        message: failure.error.message,
        test: failure.error.test,
        source: failure.source
          ? {
              name: failure.source.name,
              type: failure.source.type,
            }
          : null,
      })),
      requests: executions.map((execution) => ({
        name: execution.item.name,
        method: execution.request.method,
        url: execution.request.url.toString(),
        status: execution.response ? execution.response.code : null,
        responseTime: execution.response ? execution.response.responseTime : null,
        responseSize: execution.response ? execution.response.responseSize : null,
        assertions: execution.assertions
          ? execution.assertions.map((assertion) => ({
              assertion: assertion.assertion,
              skipped: assertion.skipped,
              error: assertion.error
                ? {
                    name: assertion.error.name,
                    message: assertion.error.message,
                  }
                : null,
            }))
          : [],
      })),
    };

    this.printSummary(result);
    return result;
  }

  /**
   * Print test summary to console
   */
  printSummary(result) {
    console.log('\\n📊 Test Results Summary:');
    console.log(`   Collection: ${result.collection}`);
    console.log(`   Environment: ${result.environment}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   Total Requests: ${result.stats.requests.total}`);
    console.log(`   Requests Failed: ${result.stats.requests.failed}`);
    console.log(`   Total Assertions: ${result.stats.assertions.total}`);
    console.log(`   Assertions Failed: ${result.stats.assertions.failed}`);

    if (result.failures.length > 0) {
      console.log('\\n❌ Test Failures:');
      result.failures.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.name}: ${failure.message}`);
        if (failure.source && failure.source.name) {
          console.log(`      Source: ${failure.source.name}`);
        }
      });
    }

    if (result.success) {
      console.log('\\n✅ All tests passed successfully!');
    } else {
      console.log('\\n⚠️  Some tests failed. Check the detailed report for more information.');
    }
  }

  /**
   * Run multiple collections in sequence
   */
  async runMultipleCollections(collections, environment = 'development', options = {}) {
    const results = [];

    console.log(`🚀 Running ${collections.length} collections on ${environment} environment...`);

    for (const collection of collections) {
      try {
        const result = await this.runCollection(collection, environment, options);
        results.push(result);

        // Add delay between collections if specified
        if (options.collectionDelay && collections.indexOf(collection) < collections.length - 1) {
          console.log(`⏳ Waiting ${options.collectionDelay}ms before next collection...`);
          await new Promise((resolve) => setTimeout(resolve, options.collectionDelay));
        }
      } catch (error) {
        console.error(`❌ Failed to run collection ${collection}:`, error.message);
        results.push({
          collection,
          environment,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        if (options.bail) {
          console.log('🛑 Stopping execution due to failure (bail option enabled)');
          break;
        }
      }
    }

    // Generate consolidated report
    const consolidatedResult = this.consolidateResults(results, environment);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const consolidatedPath = path.join(
      this.resultsDir,
      `consolidated-${environment}-${timestamp}.json`
    );
    fs.writeFileSync(consolidatedPath, JSON.stringify(consolidatedResult, null, 2));

    console.log('\\n📋 Consolidated Results:');
    console.log(`   Total Collections: ${results.length}`);
    console.log(`   Successful: ${results.filter((r) => r.success).length}`);
    console.log(`   Failed: ${results.filter((r) => !r.success).length}`);
    console.log(`   Consolidated Report: ${consolidatedPath}`);

    return consolidatedResult;
  }

  /**
   * Consolidate multiple test results
   */
  consolidateResults(results, environment) {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const totalStats = results.reduce(
      (acc, result) => {
        if (result.stats) {
          acc.requests.total += result.stats.requests.total;
          acc.requests.failed += result.stats.requests.failed;
          acc.assertions.total += result.stats.assertions.total;
          acc.assertions.failed += result.stats.assertions.failed;
        }
        return acc;
      },
      {
        requests: { total: 0, failed: 0 },
        assertions: { total: 0, failed: 0 },
      }
    );

    return {
      environment,
      timestamp: new Date().toISOString(),
      summary: {
        totalCollections: results.length,
        successfulCollections: successful.length,
        failedCollections: failed.length,
        overallSuccess: failed.length === 0,
      },
      stats: totalStats,
      results: results.map((r) => ({
        collection: r.collection,
        success: r.success,
        duration: r.duration,
        requests: r.stats ? r.stats.requests : null,
        assertions: r.stats ? r.stats.assertions : null,
        failureCount: r.failures ? r.failures.length : 0,
      })),
      failures: results.flatMap((r) => r.failures || []),
    };
  }

  /**
   * Run data-driven tests with CSV data
   */
  async runDataDrivenTest(collectionName, environmentName, dataFileName, iterations = null) {
    const dataFile = this.config.data[dataFileName];

    if (!dataFile) {
      throw new Error(`Data file '${dataFileName}' not found in config`);
    }

    if (!fs.existsSync(path.resolve(dataFile))) {
      throw new Error(`Data file does not exist: ${dataFile}`);
    }

    // Count rows in CSV to determine iterations if not specified
    if (!iterations) {
      const csvContent = fs.readFileSync(path.resolve(dataFile), 'utf8');
      const lines = csvContent.split('\\n').filter((line) => line.trim());
      iterations = Math.max(1, lines.length - 1); // Subtract header row
    }

    console.log(`📊 Running data-driven test with ${iterations} iterations`);

    return this.runCollection(collectionName, environmentName, {
      dataFile,
      iterationCount: iterations,
      reporters: ['cli', 'htmlextra', 'json'],
    });
  }

  /**
   * Generate test execution report
   */
  generateExecutionReport(results, outputPath = null) {
    const reportPath =
      outputPath || path.join(this.reportsDir, `execution-report-${Date.now()}.html`);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>API Test Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .success { background: #d4edda; }
        .failure { background: #f8d7da; }
        .collection { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .failures { background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>API Test Execution Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric ${results.summary.overallSuccess ? 'success' : 'failure'}">
            <h3>Overall Status</h3>
            <p>${results.summary.overallSuccess ? '✅ PASSED' : '❌ FAILED'}</p>
        </div>
        <div class="metric">
            <h3>Collections</h3>
            <p>${results.summary.successfulCollections}/${results.summary.totalCollections}</p>
        </div>
        <div class="metric">
            <h3>Requests</h3>
            <p>${results.stats.requests.total - results.stats.requests.failed}/${results.stats.requests.total}</p>
        </div>
        <div class="metric">
            <h3>Assertions</h3>
            <p>${results.stats.assertions.total - results.stats.assertions.failed}/${results.stats.assertions.total}</p>
        </div>
    </div>
    
    <h2>Collection Results</h2>
    ${results.results
      .map(
        (result) => `
        <div class="collection">
            <h3>${result.collection} ${result.success ? '✅' : '❌'}</h3>
            <p>Duration: ${result.duration}ms</p>
            <p>Requests: ${result.requests ? `${result.requests.total - result.requests.failed}/${result.requests.total}` : 'N/A'}</p>
            <p>Assertions: ${result.assertions ? `${result.assertions.total - result.assertions.failed}/${result.assertions.total}` : 'N/A'}</p>
            ${result.failureCount > 0 ? `<p class="failures">Failures: ${result.failureCount}</p>` : ''}
        </div>
    `
      )
      .join('')}
    
    ${
      results.failures.length > 0
        ? `
        <h2>Failures</h2>
        ${results.failures
          .map(
            (failure, index) => `
            <div class="failures">
                <strong>${index + 1}. ${failure.name}</strong>
                <p>${failure.message}</p>
                ${failure.source ? `<p><em>Source: ${failure.source.name}</em></p>` : ''}
            </div>
        `
          )
          .join('')}
    `
        : ''
    }
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    console.log(`📄 Execution report generated: ${reportPath}`);

    return reportPath;
  }
}

module.exports = APITestRunner;

// CLI Interface
if (require.main === module) {
  const runner = new APITestRunner();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
API Test Runner

Usage: node scripts/api-tests/api-test-runner.js [command] [options]

Commands:
  single <collection> [environment]     Run a single collection
  multiple <collections> [environment]  Run multiple collections (comma-separated)
  data-driven <collection> <environment> <dataFile> [iterations]  Run data-driven test
  all [environment]                     Run all collections

Examples:
  node scripts/api-tests/api-test-runner.js single user-management development
  node scripts/api-tests/api-test-runner.js multiple user-management,product-catalog staging
  node scripts/api-tests/api-test-runner.js data-driven user-management development users 5
  node scripts/api-tests/api-test-runner.js all production
`);
    process.exit(0);
  }

  const command = args[0];

  (async () => {
    try {
      switch (command) {
        case 'single': {
          const collection = args[1];
          const environment = args[2] || 'development';
          const result = await runner.runCollection(collection, environment);
          process.exit(result.success ? 0 : 1);
          break;
        }

        case 'multiple': {
          const collections = args[1].split(',');
          const env = args[2] || 'development';
          const multiResult = await runner.runMultipleCollections(collections, env);
          process.exit(multiResult.summary.overallSuccess ? 0 : 1);
          break;
        }

        case 'data-driven': {
          const ddCollection = args[1];
          const ddEnvironment = args[2];
          const dataFile = args[3];
          const iterations = args[4] ? parseInt(args[4]) : null;
          const ddResult = await runner.runDataDrivenTest(
            ddCollection,
            ddEnvironment,
            dataFile,
            iterations
          );
          process.exit(ddResult.success ? 0 : 1);
          break;
        }

        case 'all': {
          const allEnv = args[1] || 'development';
          const allCollections = Object.keys(runner.config.collections);
          const allResult = await runner.runMultipleCollections(allCollections, allEnv);
          runner.generateExecutionReport(allResult);
          process.exit(allResult.summary.overallSuccess ? 0 : 1);
          break;
        }

        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
