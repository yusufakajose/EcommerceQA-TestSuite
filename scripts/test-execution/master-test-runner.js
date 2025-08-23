#!/usr/bin/env node

/**
 * Master Test Execution Runner
 * Orchestrates execution of all test suites with comprehensive reporting
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

class MasterTestRunner {
  constructor() {
    this.baseDir = process.cwd();
    this.resultsDir = path.join(this.baseDir, 'reports', 'test-execution');
    this.logsDir = path.join(this.baseDir, 'logs');
    
    this.testSuites = {
      ui: {
        name: 'UI Tests',
        command: 'npm',
        args: ['run', 'test:ui'],
        timeout: 600000, // 10 minutes
        retries: 2,
        parallel: true,
        environments: ['development', 'staging', 'production'],
        browsers: ['chromium', 'firefox', 'webkit']
      },
      api: {
        name: 'API Tests',
        command: 'npm',
        args: ['run', 'test:api:comprehensive'],
        timeout: 300000, // 5 minutes
        retries: 3,
        parallel: true,
        environments: ['development', 'staging', 'production']
      },
      performance: {
        name: 'Performance Tests',
        command: 'npm',
        args: ['run', 'test:performance:advanced'],
        timeout: 1800000, // 30 minutes
        retries: 1,
        parallel: false,
        environments: ['staging', 'production']
      },
      accessibility: {
        name: 'Accessibility Tests',
        command: 'npm',
        args: ['run', 'test:accessibility'],
        timeout: 300000, // 5 minutes
        retries: 2,
        parallel: true,
        environments: ['development', 'staging']
      },
      security: {
        name: 'Security Tests',
        command: 'npm',
        args: ['run', 'test:security'],
        timeout: 600000, // 10 minutes
        retries: 1,
        parallel: false,
        environments: ['development', 'staging']
      }
    };
    
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.resultsDir, this.logsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Execute all test suites
   */
  async executeAllTests(options = {}) {
    const startTime = Date.now();
    const executionId = `execution-${Date.now()}`;
    
    console.log('🚀 Starting Master Test Execution');
    console.log(`Execution ID: ${executionId}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    const config = {
      executionId,
      startTime: new Date().toISOString(),
      environment: options.environment || 'development',
      browsers: options.browsers || ['chromium'],
      parallel: options.parallel !== false,
      suites: options.suites || Object.keys(this.testSuites),
      retryFailures: options.retryFailures !== false,
      generateReports: options.generateReports !== false,
      ...options
    };

    const results = {
      executionId,
      config,
      startTime: config.startTime,
      endTime: null,
      duration: 0,
      suites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        passRate: 0
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: process.env.CI === 'true'
      }
    };

    try {
      // Execute test suites
      for (const suiteId of config.suites) {
        if (!this.testSuites[suiteId]) {
          console.warn(`⚠️  Unknown test suite: ${suiteId}`);
          continue;
        }

        console.log(`\n📋 Executing ${this.testSuites[suiteId].name}...`);
        
        const suiteResult = await this.executeSuite(suiteId, config);
        results.suites[suiteId] = suiteResult;
        
        // Update summary
        results.summary.total += suiteResult.tests?.total || 0;
        results.summary.passed += suiteResult.tests?.passed || 0;
        results.summary.failed += suiteResult.tests?.failed || 0;
        results.summary.skipped += suiteResult.tests?.skipped || 0;
      }

      // Calculate final metrics
      results.endTime = new Date().toISOString();
      results.duration = Date.now() - startTime;
      results.summary.passRate = results.summary.total > 0 ? 
        Math.round((results.summary.passed / results.summary.total) * 100) : 0;

      // Save execution results
      await this.saveExecutionResults(results);

      // Generate reports if requested
      if (config.generateReports) {
        await this.generateReports(results);
      }

      // Print summary
      this.printExecutionSummary(results);

      return results;

    } catch (error) {
      console.error('❌ Master test execution failed:', error);
      results.endTime = new Date().toISOString();
      results.duration = Date.now() - startTime;
      results.error = error.message;
      
      await this.saveExecutionResults(results);
      throw error;
    }
  }

  /**
   * Execute individual test suite
   */
  async executeSuite(suiteId, config) {
    const suite = this.testSuites[suiteId];
    const startTime = Date.now();
    
    const result = {
      suiteId,
      name: suite.name,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      status: 'running',
      attempts: 0,
      maxAttempts: suite.retries + 1,
      tests: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      environments: {},
      browsers: {},
      logs: [],
      error: null
    };

    try {
      // Execute for each environment if specified
      const environments = config.environment === 'all' ? 
        (suite.environments || ['development']) : [config.environment];

      for (const env of environments) {
        if (suite.environments && !suite.environments.includes(env)) {
          console.log(`⏭️  Skipping ${suite.name} for ${env} (not configured)`);
          continue;
        }

        console.log(`  🌍 Environment: ${env}`);
        
        const envResult = await this.executeSuiteForEnvironment(
          suiteId, env, config.browsers, config
        );
        
        result.environments[env] = envResult;
        
        // Aggregate results
        result.tests.total += envResult.tests?.total || 0;
        result.tests.passed += envResult.tests?.passed || 0;
        result.tests.failed += envResult.tests?.failed || 0;
        result.tests.skipped += envResult.tests?.skipped || 0;
      }

      result.status = result.tests.failed > 0 ? 'failed' : 'passed';
      
    } catch (error) {
      console.error(`❌ Suite ${suite.name} failed:`, error.message);
      result.status = 'error';
      result.error = error.message;
      
      // Retry if configured
      if (result.attempts < result.maxAttempts - 1 && config.retryFailures) {
        result.attempts++;
        console.log(`🔄 Retrying ${suite.name} (attempt ${result.attempts + 1}/${result.maxAttempts})`);
        return await this.executeSuite(suiteId, config);
      }
    } finally {
      result.endTime = new Date().toISOString();
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Execute suite for specific environment
   */
  async executeSuiteForEnvironment(suiteId, environment, browsers, config) {
    const suite = this.testSuites[suiteId];
    
    const envResult = {
      environment,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      status: 'running',
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
      browsers: {},
      command: null,
      exitCode: null,
      logs: []
    };

    const startTime = Date.now();

    try {
      // Set environment variables
      const env = {
        ...process.env,
        TEST_ENV: environment,
        NODE_ENV: environment
      };

      // Build command arguments
      let args = [...suite.args];
      
      // Add environment-specific arguments
      if (suiteId === 'ui') {
        if (environment !== 'development') {
          args = args.concat([`--project=${environment}`]);
        }
        if (browsers && browsers.length > 0) {
          // Add browser-specific configuration if needed
        }
      } else if (suiteId === 'api') {
        args = args.concat([environment]);
      }

      envResult.command = `${suite.command} ${args.join(' ')}`;
      
      console.log(`    🔧 Command: ${envResult.command}`);

      // Execute command
      const execution = await this.executeCommand(
        suite.command, 
        args, 
        { 
          env, 
          timeout: suite.timeout,
          cwd: this.baseDir
        }
      );

      envResult.exitCode = execution.exitCode;
      envResult.logs = execution.logs;
      envResult.status = execution.exitCode === 0 ? 'passed' : 'failed';

      // Parse test results if available
      const testResults = await this.parseTestResults(suiteId, environment);
      if (testResults) {
        envResult.tests = testResults;
      }

    } catch (error) {
      console.error(`    ❌ Environment ${environment} failed:`, error.message);
      envResult.status = 'error';
      envResult.error = error.message;
    } finally {
      envResult.endTime = new Date().toISOString();
      envResult.duration = Date.now() - startTime;
    }

    return envResult;
  }

  /**
   * Execute command with timeout and logging
   */
  async executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const logs = [];
      
      console.log(`    ⏳ Starting: ${command} ${args.join(' ')}`);
      
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: options.env || process.env,
        cwd: options.cwd || process.cwd()
      });

      let timeoutId;
      if (options.timeout) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Command timed out after ${options.timeout}ms`));
        }, options.timeout);
      }

      child.stdout.on('data', (data) => {
        const text = data.toString();
        logs.push({ type: 'stdout', text, timestamp: new Date().toISOString() });
        process.stdout.write(`    📝 ${text}`);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        logs.push({ type: 'stderr', text, timestamp: new Date().toISOString() });
        process.stderr.write(`    ⚠️  ${text}`);
      });

      child.on('close', (code) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        const duration = Date.now() - startTime;
        console.log(`    ✅ Completed in ${Math.round(duration / 1000)}s with exit code ${code}`);
        
        resolve({
          exitCode: code,
          duration,
          logs
        });
      });

      child.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(error);
      });
    });
  }

  /**
   * Parse test results from output files
   */
  async parseTestResults(suiteId, environment) {
    try {
      // Look for test result files based on suite type
      const resultPaths = this.getResultPaths(suiteId, environment);
      
      for (const resultPath of resultPaths) {
        if (fs.existsSync(resultPath)) {
          const results = await this.parseResultFile(resultPath, suiteId);
          if (results) {
            return results;
          }
        }
      }
    } catch (error) {
      console.warn(`    ⚠️  Could not parse test results: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Get potential result file paths
   */
  getResultPaths(suiteId, environment) {
    const paths = [];
    
    switch (suiteId) {
      case 'ui':
        paths.push(
          path.join(this.baseDir, 'test-results', 'results.json'),
          path.join(this.baseDir, 'playwright-report', 'results.json'),
          path.join(this.baseDir, `reports/test-execution/${environment}/results.json`)
        );
        break;
      case 'api':
        paths.push(
          path.join(this.baseDir, 'reports/api-tests', 'summary.json'),
          path.join(this.baseDir, 'reports/newman', 'summary.json')
        );
        break;
      case 'performance':
        paths.push(
          path.join(this.baseDir, 'reports/performance-tests', 'summary.json')
        );
        break;
      case 'accessibility':
        paths.push(
          path.join(this.baseDir, 'reports/accessibility-tests', 'summary.json')
        );
        break;
      case 'security':
        paths.push(
          path.join(this.baseDir, 'reports/security-tests', 'summary.json')
        );
        break;
    }
    
    return paths;
  }

  /**
   * Parse result file based on format
   */
  async parseResultFile(filePath, suiteId) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Parse based on suite type and file format
      switch (suiteId) {
        case 'ui':
          return this.parsePlaywrightResults(data);
        case 'api':
          return this.parseNewmanResults(data);
        default:
          return this.parseGenericResults(data);
      }
    } catch (error) {
      console.warn(`Could not parse ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Parse Playwright test results
   */
  parsePlaywrightResults(data) {
    // Implementation would parse Playwright-specific format
    return {
      total: data.stats?.total || 0,
      passed: data.stats?.passed || 0,
      failed: data.stats?.failed || 0,
      skipped: data.stats?.skipped || 0
    };
  }

  /**
   * Parse Newman test results
   */
  parseNewmanResults(data) {
    if (data.run && data.run.stats) {
      const stats = data.run.stats;
      return {
        total: stats.tests?.total || 0,
        passed: (stats.tests?.total || 0) - (stats.tests?.failed || 0),
        failed: stats.tests?.failed || 0,
        skipped: 0
      };
    }
    return null;
  }

  /**
   * Parse generic test results
   */
  parseGenericResults(data) {
    return {
      total: data.total || 0,
      passed: data.passed || 0,
      failed: data.failed || 0,
      skipped: data.skipped || 0
    };
  }

  /**
   * Save execution results
   */
  async saveExecutionResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `execution-${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
      
      // Also save as latest
      const latestPath = path.join(this.resultsDir, 'latest-execution.json');
      fs.writeFileSync(latestPath, JSON.stringify(results, null, 2));
      
      console.log(`\n💾 Execution results saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to save execution results:', error);
    }
  }

  /**
   * Generate reports
   */
  async generateReports(results) {
    console.log('\n📊 Generating comprehensive reports...');
    
    try {
      // Generate consolidated report
      const { spawn } = require('child_process');
      
      const reportProcess = spawn('npm', ['run', 'report:consolidated'], {
        stdio: 'inherit',
        cwd: this.baseDir
      });
      
      await new Promise((resolve, reject) => {
        reportProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Reports generated successfully');
            resolve();
          } else {
            console.error('❌ Report generation failed');
            reject(new Error(`Report generation failed with code ${code}`));
          }
        });
        
        reportProcess.on('error', reject);
      });
      
    } catch (error) {
      console.error('Failed to generate reports:', error.message);
    }
  }

  /**
   * Print execution summary
   */
  printExecutionSummary(results) {
    const duration = Math.round(results.duration / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 MASTER TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Execution ID: ${results.executionId}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Environment: ${results.config.environment}`);
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed} ✅`);
    console.log(`Failed: ${results.summary.failed} ❌`);
    console.log(`Skipped: ${results.summary.skipped} ⏭️`);
    console.log(`Pass Rate: ${results.summary.passRate}%`);
    
    console.log('\nSuite Results:');
    Object.entries(results.suites).forEach(([suiteId, suite]) => {
      const status = suite.status === 'passed' ? '✅' : 
                    suite.status === 'failed' ? '❌' : '⚠️';
      console.log(`  ${status} ${suite.name}: ${suite.tests.passed}/${suite.tests.total} passed`);
    });
    
    if (results.summary.failed > 0) {
      console.log('\n⚠️  Some tests failed. Check detailed logs for more information.');
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Run master test execution
   */
  async run(options = {}) {
    try {
      const results = await this.executeAllTests(options);
      
      // Exit with appropriate code
      const exitCode = results.summary.failed > 0 ? 1 : 0;
      
      if (exitCode === 0) {
        console.log('\n🎉 All tests completed successfully!');
      } else {
        console.log('\n💥 Some tests failed. Check the results for details.');
      }
      
      return { results, exitCode };
      
    } catch (error) {
      console.error('\n💥 Master test execution failed:', error.message);
      return { error, exitCode: 1 };
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Master Test Execution Runner

Usage: node scripts/test-execution/master-test-runner.js [OPTIONS]

Options:
  --environment ENV     Test environment (development|staging|production|all)
  --suites SUITES       Comma-separated list of test suites (ui,api,performance,accessibility,security)
  --browsers BROWSERS   Comma-separated list of browsers (chromium,firefox,webkit)
  --no-parallel         Disable parallel execution
  --no-retry            Disable retry on failure
  --no-reports          Skip report generation
  --help, -h            Show this help message

Examples:
  node scripts/test-execution/master-test-runner.js
  node scripts/test-execution/master-test-runner.js --environment staging
  node scripts/test-execution/master-test-runner.js --suites ui,api --browsers chromium,firefox
  node scripts/test-execution/master-test-runner.js --environment all --no-parallel
`);
    process.exit(0);
  }
  
  // Parse command line arguments
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--environment':
        if (nextArg) {
          options.environment = nextArg;
          i++;
        }
        break;
      case '--suites':
        if (nextArg) {
          options.suites = nextArg.split(',').map(s => s.trim());
          i++;
        }
        break;
      case '--browsers':
        if (nextArg) {
          options.browsers = nextArg.split(',').map(b => b.trim());
          i++;
        }
        break;
      case '--no-parallel':
        options.parallel = false;
        break;
      case '--no-retry':
        options.retryFailures = false;
        break;
      case '--no-reports':
        options.generateReports = false;
        break;
    }
  }
  
  const runner = new MasterTestRunner();
  
  runner.run(options)
    .then(({ results, exitCode }) => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Master test runner failed:', error);
      process.exit(1);
    });
}

module.exports = MasterTestRunner;