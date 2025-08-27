#!/usr/bin/env node

/**
 * JMeter Performance Test Runner
 * Node.js wrapper for executing JMeter performance tests
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class JMeterRunner {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'automated-tests/performance-tests');
    this.testPlansDir = path.join(this.baseDir, 'jmeter/test-plans');
    this.resultsDir = path.join(this.baseDir, 'jmeter/results');
    this.reportsDir = path.join(process.cwd(), 'reports/performance-tests');
    this.summariesDir = path.join(process.cwd(), 'reports/performance-tests/summaries');

    this.testPlans = {
      'user-auth': 'user-authentication-load-test.jmx',
      'product-catalog': 'product-catalog-load-test.jmx',
      'shopping-cart': 'shopping-cart-checkout-load-test.jmx',
    };

    this.defaultConfig = {
      baseUrl: 'http://localhost:3000',
      users: 50,
      rampUp: 60,
      loops: 5,
    };
  }

  /**
   * Check if JMeter is installed and accessible
   */
  async checkJMeter() {
    return new Promise((resolve, reject) => {
      exec('jmeter --version', (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              'JMeter is not installed or not in PATH. Please install JMeter and ensure it is accessible.'
            )
          );
          return;
        }

        const version = stdout.split('\n')[0];
        console.log(`JMeter found: ${version}`);
        resolve(version);
      });
    });
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [this.resultsDir, this.reportsDir, this.summariesDir];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  /**
   * Clean previous test results
   */
  cleanResults() {
    console.log('Cleaning previous test results...');

    // Clean results directory
    if (fs.existsSync(this.resultsDir)) {
      const files = fs.readdirSync(this.resultsDir);
      files.forEach((file) => {
        if (file.endsWith('.jtl') || file.endsWith('.log')) {
          fs.unlinkSync(path.join(this.resultsDir, file));
        }
      });
    }

    // Clean reports directory
    if (fs.existsSync(this.reportsDir)) {
      const dirs = fs.readdirSync(this.reportsDir);
      dirs.forEach((dir) => {
        const dirPath = path.join(this.reportsDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      });
    }
  }

  /**
   * Run a single JMeter test plan
   */
  async runTestPlan(testName, config = {}) {
    const testConfig = { ...this.defaultConfig, ...config };
    const testPlan = this.testPlans[testName];

    if (!testPlan) {
      throw new Error(
        `Test plan '${testName}' not found. Available: ${Object.keys(this.testPlans).join(', ')}`
      );
    }

    const testPlanPath = path.join(this.testPlansDir, testPlan);
    if (!fs.existsSync(testPlanPath)) {
      throw new Error(`Test plan file not found: ${testPlanPath}`);
    }

    const resultFile = path.join(this.resultsDir, `${testName}-results.jtl`);
    const logFile = path.join(this.resultsDir, `${testName}.log`);
    const reportDir = path.join(this.reportsDir, `${testName}-report`);
    const summaryOut = path.join(this.summariesDir, `${testName}-summary.json`);

    console.log(`Running ${testName} performance test...`);
    console.log(
      `Parameters: Users=${testConfig.users}, Ramp-up=${testConfig.rampUp}s, Loops=${testConfig.loops}`
    );
    console.log(`Base URL: ${testConfig.baseUrl}`);

    const jmeterArgs = [
      '-n',
      '-t',
      testPlanPath,
      '-l',
      resultFile,
      '-j',
      logFile,
      '-Jbase_url=' + testConfig.baseUrl,
      '-Jusers=' + testConfig.users,
      '-Jramp_up=' + testConfig.rampUp,
      '-Jloops=' + testConfig.loops,
      '-e',
      '-o',
      reportDir,
    ];

    return new Promise((resolve, reject) => {
      const jmeter = spawn('jmeter', jmeterArgs);

      let output = '';
      let errorOutput = '';

      jmeter.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      jmeter.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      jmeter.on('close', (code) => {
        if (code === 0) {
          console.log(`${testName} test completed successfully`);
          console.log(`Results: ${resultFile}`);
          console.log(`Report: ${reportDir}/index.html`);

          try {
            const summary = this.parseAndSummarizeJTL(resultFile);
            fs.writeFileSync(summaryOut, JSON.stringify(summary, null, 2));
            const ok = summary.status === 'PASS';
            resolve({
              testName,
              success: ok,
              resultFile,
              reportDir,
              logFile,
              summary,
              output,
            });
          } catch (e) {
            console.warn(`Failed to parse JTL for ${testName}: ${e.message}`);
            resolve({
              testName,
              success: true,
              resultFile,
              reportDir,
              logFile,
              output,
            });
          }
        } else {
          console.error(`${testName} test failed with exit code ${code}`);
          reject(new Error(`JMeter test failed with exit code ${code}: ${errorOutput}`));
        }
      });

      jmeter.on('error', (error) => {
        reject(new Error(`Failed to start JMeter: ${error.message}`));
      });
    });
  }

  /**
   * Run multiple test plans
   */
  async runMultipleTests(testNames, config = {}) {
    const results = [];

    for (const testName of testNames) {
      try {
        const result = await this.runTestPlan(testName, config);
        results.push(result);

        // Add delay between tests
        if (testNames.indexOf(testName) < testNames.length - 1) {
          console.log('Waiting 10 seconds before next test...');
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      } catch (error) {
        console.error(`Failed to run ${testName}:`, error.message);
        results.push({
          testName,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Parse JTL CSV and compute summary with SLO evaluation
   */
  parseAndSummarizeJTL(jtlPath) {
    if (!fs.existsSync(jtlPath)) throw new Error(`JTL not found: ${jtlPath}`);

    const text = fs.readFileSync(jtlPath, 'utf8');
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) throw new Error('Empty JTL file');

    // Parse header if present; support quoted CSVs
    const splitCSV = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          // handle double quotes inside quotes
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result;
    };

    const headerLike = /timeStamp|elapsed|success|label|responseCode/;
    let headers = [];
    let startIdx = 0;
    if (headerLike.test(lines[0])) {
      headers = splitCSV(lines[0]).map((h) => h.trim());
      startIdx = 1;
    } else {
      // fallback header positions based on common JTL
      headers = [
        'timeStamp',
        'elapsed',
        'label',
        'responseCode',
        'responseMessage',
        'threadName',
        'dataType',
        'success',
      ];
    }

    const idx = (name, fallback) => {
      const i = headers.indexOf(name);
      return i >= 0 ? i : fallback;
    };
    const ELAPSED = idx('elapsed', 1);
    const LABEL = idx('label', 2);
    const SUCCESS = idx('success', 8);

    let samples = 0;
    let errors = 0;
    let durations = [];
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    const perLabel = {};

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const cols = splitCSV(line);
      const elapsed = parseFloat(cols[ELAPSED]);
      const label = cols[LABEL] || 'UNLABELED';
      const successStr = (cols[SUCCESS] || '').toLowerCase();
      const success = successStr === 'true' || successStr === '1';
      if (!isNaN(elapsed)) {
        samples += 1;
        durations.push(elapsed);
        min = Math.min(min, elapsed);
        max = Math.max(max, elapsed);
        if (!success) errors += 1;

        // per label accumulation
        if (!perLabel[label]) {
          perLabel[label] = { samples: 0, errors: 0, durations: [] };
        }
        perLabel[label].samples += 1;
        perLabel[label].durations.push(elapsed);
        if (!success) perLabel[label].errors += 1;
      }
    }

    durations.sort((a, b) => a - b);
    const pct = (p) => {
      if (durations.length === 0) return 0;
      const idx = Math.ceil((p / 100) * durations.length) - 1;
      return durations[Math.max(0, Math.min(idx, durations.length - 1))];
    };
    const avg = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const p95 = Math.round(pct(95));
    const p99 = Math.round(pct(99));
    const errorPct = samples ? (errors / samples) * 100 : 0;

    // SLOs (aligned with k6 defaults above)
    const slo = {
      p95_lt_ms: 800,
      p99_lt_ms: 1500,
      error_rate_lt_percent: 1,
    };

    const status =
      p95 < slo.p95_lt_ms && p99 < slo.p99_lt_ms && errorPct < slo.error_rate_lt_percent
        ? 'PASS'
        : 'FAIL';

    // Build per-label stats
    const perLabelStats = Object.entries(perLabel).map(([label, stat]) => {
      const arr = stat.durations.sort((a, b) => a - b);
      const avgL = arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      const p95L = Math.round(arr.length ? arr[Math.ceil(0.95 * arr.length) - 1] : 0);
      const p99L = Math.round(arr.length ? arr[Math.ceil(0.99 * arr.length) - 1] : 0);
      const errPctL = stat.samples ? +((stat.errors / stat.samples) * 100).toFixed(2) : 0;
      return {
        label,
        samples: stat.samples,
        errors: stat.errors,
        error_percentage: errPctL,
        latency_ms: {
          avg: avgL,
          min: arr[0] || 0,
          max: arr[arr.length - 1] || 0,
          p95: p95L,
          p99: p99L,
        },
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        samples,
        errors,
        error_percentage: +errorPct.toFixed(2),
      },
      latency_ms: { avg, min, max, p95, p99 },
      slo,
      per_label: perLabelStats,
      status,
    };
  }

  /**
   * Generate consolidated performance report
   */
  generateConsolidatedReport(results, config) {
    const reportPath = path.join(this.reportsDir, 'consolidated-performance-report.html');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>E-commerce Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metrics { display: flex; gap: 20px; margin: 15px 0; flex-wrap: wrap; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; min-width: 200px; }
        .success { background: #d4edda; }
        .error { background: #f8d7da; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 3px; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E-commerce Performance Test Report</h1>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Base URL:</strong> ${config.baseUrl}</p>
        <p><strong>Test Configuration:</strong> ${config.users} users, ${config.rampUp}s ramp-up, ${config.loops} loops</p>
    </div>
    
    <div class="test-section">
        <h2>Test Summary</h2>
        <div class="metrics">
            <div class="metric">
                <h3>Total Tests</h3>
                <p>${results.length}</p>
            </div>
            <div class="metric success">
                <h3>Successful</h3>
                <p>${results.filter((r) => r.success).length}</p>
            </div>
            <div class="metric error">
                <h3>Failed</h3>
                <p>${results.filter((r) => !r.success).length}</p>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <p>${Math.round((results.filter((r) => r.success).length / results.length) * 100)}%</p>
            </div>
        </div>
    </div>
    
    <div class="test-section">
        <h2>Test Results</h2>
        ${results
          .map(
            (result) => `
            <div class="test-result ${result.success ? 'success' : 'error'}">
                <h3>${result.testName} ${result.success ? '✅' : '❌'}</h3>
                ${
                  result.success
                    ? `<p><a href="${path.basename(result.reportDir)}/index.html" target="_blank">View Detailed Report</a></p>`
                    : `<p><strong>Error:</strong> ${result.error}</p>`
                }
            </div>
        `
          )
          .join('')}
    </div>
    
    <div class="test-section">
        <h2>Performance Test Plans</h2>
        <ul>
            <li><strong>User Authentication:</strong> Tests user registration and login performance under load</li>
            <li><strong>Product Catalog:</strong> Validates product browsing, search, and filtering performance</li>
            <li><strong>Shopping Cart:</strong> Measures cart operations and checkout process performance</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>Key Performance Indicators</h2>
        <p>Review the detailed reports for specific metrics including:</p>
        <ul>
            <li>Response times (average, median, 90th percentile)</li>
            <li>Throughput (requests per second)</li>
            <li>Error rates and failure analysis</li>
            <li>Resource utilization patterns</li>
        </ul>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    console.log(`Consolidated report generated: ${reportPath}`);

    return reportPath;
  }

  /**
   * Run performance tests based on command line arguments
   */
  async run(args) {
    try {
      await this.checkJMeter();
      this.ensureDirectories();
      this.cleanResults();

      const config = { ...this.defaultConfig };
      let testNames = ['user-auth', 'product-catalog', 'shopping-cart'];

      // Parse arguments
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
          case '--base-url':
            if (nextArg) {
              config.baseUrl = nextArg;
              i++;
            }
            break;
          case '--users':
            if (nextArg) {
              config.users = parseInt(nextArg);
              i++;
            }
            break;
          case '--ramp-up':
            if (nextArg) {
              config.rampUp = parseInt(nextArg);
              i++;
            }
            break;
          case '--loops':
            if (nextArg) {
              config.loops = parseInt(nextArg);
              i++;
            }
            break;
          case '--test':
            if (nextArg) {
              testNames = nextArg.split(',');
              i++;
            }
            break;
        }
      }

      console.log('Starting JMeter Performance Tests');
      console.log(`Target URL: ${config.baseUrl}`);
      console.log(
        `Test Configuration: Users=${config.users}, Ramp-up=${config.rampUp}s, Loops=${config.loops}`
      );
      console.log(`Tests to run: ${testNames.join(', ')}`);

      const results = await this.runMultipleTests(testNames, config);
      const reportPath = this.generateConsolidatedReport(results, config);

      console.log('\nPerformance testing completed!');
      console.log(`Results available in: ${this.resultsDir}`);
      console.log(`Reports available in: ${this.reportsDir}`);
      console.log(`Consolidated report: ${reportPath}`);

      const successCount = results.filter((r) => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        console.log('All performance tests passed successfully!');
        process.exit(0);
      } else {
        console.log(`${totalCount - successCount} out of ${totalCount} tests failed`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Performance testing failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
JMeter Performance Test Runner

Usage: node scripts/jmeter-runner.js [OPTIONS]

Options:
  --base-url URL        Base URL for testing (default: http://localhost:3000)
  --users NUMBER        Number of concurrent users (default: 50)
  --ramp-up SECONDS     Ramp-up period in seconds (default: 60)
  --loops NUMBER        Number of loops per user (default: 5)
  --test NAMES          Comma-separated test names (default: all)
  --help, -h            Show this help message

Available Tests:
  user-auth             User authentication performance test
  product-catalog       Product catalog performance test
  shopping-cart         Shopping cart and checkout performance test

Examples:
  node scripts/jmeter-runner.js
  node scripts/jmeter-runner.js --users 100 --ramp-up 120
  node scripts/jmeter-runner.js --test user-auth,product-catalog
  node scripts/jmeter-runner.js --base-url http://staging.example.com
`);
    process.exit(0);
  }

  const runner = new JMeterRunner();
  runner.run(args);
}

module.exports = JMeterRunner;
