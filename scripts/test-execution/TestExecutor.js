// @ts-check
/**
 * Test Executor
 * Handles the execution of Playwright tests with configuration management
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} ExecutorConfig
 * @property {number} maxParallelWorkers
 * @property {number} timeout
 * @property {number} retries
 * @property {string[]} environments
 * @property {string[]} browsers
 * @property {string} outputDir
 * @property {string} reportDir
 * @property {boolean} cleanPreviousResults
 */

/**
 * @typedef {Object} SuiteStats
 * @property {number} total
 * @property {number} passed
 * @property {number} failed
 * @property {number} skipped
 */

/**
 * @typedef {Object} ExecutionResults
 * @property {number} total
 * @property {number} passed
 * @property {number} failed
 * @property {number} skipped
 * @property {Record<string, SuiteStats>} environments
 * @property {Record<string, SuiteStats>} browsers
 * @property {number} duration
 */

class TestExecutor {
  /**
   * @param {Partial<ExecutorConfig>=} config
   */
  constructor(config = {}) {
    /** @type {ExecutorConfig} */
    this.config = {
      maxParallelWorkers: 4,
      timeout: 300000,
      retries: 2,
      environments: ['development'],
      browsers: ['chromium'],
      outputDir: './test-results',
      reportDir: './reports',
      cleanPreviousResults: true,
      ...config,
    };
  }

  /**
   * Execute tests with the given configuration
   * @param {{ testPattern?: string }} [options] - Test execution options
   * @returns {Promise<ExecutionResults>} - Test results summary
   */
  async executeTests(options = {}) {
    const { testPattern } = options;

    // Clean previous results if configured
    if (this.config.cleanPreviousResults) {
      await this.cleanPreviousResults();
    }

    // Ensure output directories exist
    await this.ensureDirectories();

    /** @type {ExecutionResults} */
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      environments: {},
      browsers: {},
      duration: 0,
    };

    const startTime = Date.now();

    try {
      // Run tests for each environment and browser combination
      for (const environment of this.config.environments) {
        for (const browser of this.config.browsers) {
          console.log(`\n🧪 Running tests: ${environment} / ${browser}`);

          const envResults = await this.runTestsForEnvironment(environment, browser, testPattern);

          // Aggregate results
          results.total += envResults.total;
          results.passed += envResults.passed;
          results.failed += envResults.failed;
          results.skipped += envResults.skipped;

          // Track per-environment stats
          if (!results.environments[environment]) {
            results.environments[environment] = { total: 0, passed: 0, failed: 0, skipped: 0 };
          }
          results.environments[environment].total += envResults.total;
          results.environments[environment].passed += envResults.passed;
          results.environments[environment].failed += envResults.failed;
          results.environments[environment].skipped += envResults.skipped;

          // Track per-browser stats
          if (!results.browsers[browser]) {
            results.browsers[browser] = { total: 0, passed: 0, failed: 0, skipped: 0 };
          }
          results.browsers[browser].total += envResults.total;
          results.browsers[browser].passed += envResults.passed;
          results.browsers[browser].failed += envResults.failed;
          results.browsers[browser].skipped += envResults.skipped;
        }
      }

      results.duration = Date.now() - startTime;

      // Save results summary
      await this.saveResultsSummary(results);

      return results;
    } catch (error) {
      console.error('Test execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Run tests for a specific environment and browser
   * @param {string} environment - Environment name
   * @param {string} browser - Browser name
   * @param {string=} testPattern - Test pattern to run
   * @returns {Promise<SuiteStats>} - Test results for this combination
   */
  async runTestsForEnvironment(environment, browser, testPattern) {
    return new Promise((resolve, reject) => {
      const args = [
        'test',
        '--config=config/playwright.config.js',
        '--project',
        browser,
        '--workers',
        this.config.maxParallelWorkers.toString(),
        '--timeout',
        this.config.timeout.toString(),
        '--retries',
        this.config.retries.toString(),
        '--reporter=json',
      ];

      // Add test pattern if specified
      if (testPattern) {
        args.push(testPattern);
      }

      // Set environment variable
      const env = {
        ...process.env,
        TEST_ENV: environment,
      };

      const playwrightProcess = spawn('npx', ['playwright', ...args], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      playwrightProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      playwrightProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // Also log to console for real-time feedback
        process.stderr.write(data);
      });

      playwrightProcess.on('close', (code) => {
        try {
          // Parse Playwright JSON output
          const results = this.parsePlaywrightResults(stdout, stderr);

          console.log(`   ✅ ${environment}/${browser}: ${results.passed}/${results.total} passed`);

          resolve(results);
        } catch (error) {
          console.error(
            `   ❌ Failed to parse results for ${environment}/${browser}:`,
            error.message
          );
          resolve({ total: 0, passed: 0, failed: 0, skipped: 0 });
        }
      });

      playwrightProcess.on('error', (error) => {
        console.error(
          `   ❌ Failed to start Playwright for ${environment}/${browser}:`,
          error.message
        );
        reject(error);
      });
    });
  }

  /**
   * Parse Playwright JSON results
   * @param {string} stdout - Standard output from Playwright
   * @param {string} stderr - Standard error from Playwright
   * @returns {SuiteStats} - Parsed results
   */
  parsePlaywrightResults(stdout, stderr) {
    try {
      // Try to find JSON output in stdout
      const lines = stdout.split('\n');
      let jsonResult = null;

      for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('"stats"')) {
          jsonResult = JSON.parse(line.trim());
          break;
        }
      }

      if (jsonResult && jsonResult.stats) {
        return {
          total: jsonResult.stats.total || 0,
          passed: jsonResult.stats.passed || 0,
          failed: jsonResult.stats.failed || 0,
          skipped: jsonResult.stats.skipped || 0,
        };
      }

      // Fallback: parse from text output
      return this.parseTextResults(stdout + stderr);
    } catch (error) {
      console.warn('Failed to parse JSON results, falling back to text parsing:', error.message);
      return this.parseTextResults(stdout + stderr);
    }
  }

  /**
   * Parse results from text output
   * @param {string} output - Combined stdout and stderr
   * @returns {SuiteStats} - Parsed results
   */
  parseTextResults(output) {
    /** @type {SuiteStats} */
    const results = { total: 0, passed: 0, failed: 0, skipped: 0 };

    // Look for summary patterns
    const patterns = [/(\d+) passed/i, /(\d+) failed/i, /(\d+) skipped/i, /(\d+) total/i];

    patterns.forEach((pattern, index) => {
      const match = output.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        switch (index) {
          case 0:
            results.passed = count;
            break;
          case 1:
            results.failed = count;
            break;
          case 2:
            results.skipped = count;
            break;
          case 3:
            results.total = count;
            break;
        }
      }
    });

    // If total wasn't found, calculate it
    if (results.total === 0) {
      results.total = results.passed + results.failed + results.skipped;
    }

    return results;
  }

  /**
   * Clean previous test results
   */
  async cleanPreviousResults() {
    const dirsToClean = [this.config.outputDir, this.config.reportDir];

    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        try {
          // rmdir recursive is deprecated; use rm with { recursive, force }
          await fs.promises.rm(dir, { recursive: true, force: true });
          console.log(`   🧹 Cleaned ${dir}`);
        } catch (error) {
          console.warn(`   ⚠️  Failed to clean ${dir}:`, error.message);
        }
      }
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [this.config.outputDir, this.config.reportDir];

    for (const dir of dirs) {
      try {
        await fs.promises.mkdir(dir, { recursive: true });
      } catch (error) {
        console.warn(`Failed to create directory ${dir}:`, error.message);
      }
    }
  }

  /**
   * Save results summary to file
   * @param {ExecutionResults} results - Test results summary
   */
  async saveResultsSummary(results) {
    const summaryPath = path.join(this.config.reportDir, 'execution-summary.json');

    try {
      const summary = {
        ...results,
        timestamp: new Date().toISOString(),
        config: this.config,
      };

      await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      console.log(`   📄 Results summary saved to ${summaryPath}`);
    } catch (error) {
      console.warn('Failed to save results summary:', error.message);
    }
  }
}

module.exports = TestExecutor;
