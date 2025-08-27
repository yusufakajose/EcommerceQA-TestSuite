#!/usr/bin/env node

/**
 * Main Test Execution Script
 * Orchestrates the complete test execution and reporting pipeline
 */

const TestExecutor = require('./test-execution/TestExecutor');
const NotificationManager = require('./notifications/NotificationManager');
const ReportGenerator = require('./reporting/generate-report');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.config = this.loadConfiguration();
    this.testExecutor = new TestExecutor(this.config.execution);
    this.notificationManager = new NotificationManager(this.config.notifications);
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Load configuration from various sources
   * @returns {Object} - Configuration object
   */
  loadConfiguration() {
    const defaultConfig = {
      execution: {
        maxParallelWorkers: 4,
        timeout: 300000,
        retries: 2,
        environments: ['development'],
        browsers: ['chromium'],
        outputDir: './test-results',
        reportDir: './reports',
        cleanPreviousResults: true,
      },
      notifications: {
        enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        from: process.env.NOTIFICATION_FROM || 'noreply@example.com',
        recipients: {
          summary: process.env.SUMMARY_RECIPIENTS?.split(',') || [],
          failures: process.env.FAILURE_RECIPIENTS?.split(',') || [],
          critical: process.env.CRITICAL_RECIPIENTS?.split(',') || [],
        },
      },
    };

    // Load from config file if exists
    const configPath = './config/test-execution.json';
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return this.mergeConfig(defaultConfig, fileConfig);
      } catch (error) {
        console.warn('Failed to load config file, using defaults:', error.message);
      }
    }

    // Override with command line arguments
    return this.applyCommandLineArgs(defaultConfig);
  }

  /**
   * Merge configuration objects
   * @param {Object} defaultConfig - Default configuration
   * @param {Object} fileConfig - File configuration
   * @returns {Object} - Merged configuration
   */
  mergeConfig(defaultConfig, fileConfig) {
    const merged = { ...defaultConfig };

    Object.keys(fileConfig).forEach((key) => {
      if (typeof fileConfig[key] === 'object' && !Array.isArray(fileConfig[key])) {
        merged[key] = { ...merged[key], ...fileConfig[key] };
      } else {
        merged[key] = fileConfig[key];
      }
    });

    return merged;
  }

  /**
   * Apply command line arguments to configuration
   * @param {Object} config - Base configuration
   * @returns {Object} - Updated configuration
   */
  applyCommandLineArgs(config) {
    const args = process.argv.slice(2);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--environments':
        case '-e':
          if (nextArg) {
            config.execution.environments = nextArg.split(',');
            i++;
          }
          break;
        case '--browsers':
        case '-b':
          if (nextArg) {
            config.execution.browsers = nextArg.split(',');
            i++;
          }
          break;
        case '--workers':
        case '-w':
          if (nextArg) {
            config.execution.maxParallelWorkers = parseInt(nextArg);
            i++;
          }
          break;
        case '--timeout':
        case '-t':
          if (nextArg) {
            config.execution.timeout = parseInt(nextArg) * 1000; // Convert to ms
            i++;
          }
          break;
        case '--retries':
        case '-r':
          if (nextArg) {
            config.execution.retries = parseInt(nextArg);
            i++;
          }
          break;
        case '--pattern':
        case '-p':
          if (nextArg) {
            config.execution.testPattern = nextArg;
            i++;
          }
          break;
        case '--no-notifications':
          config.notifications.enabled = false;
          break;
        case '--clean':
          config.execution.cleanPreviousResults = true;
          break;
        case '--no-clean':
          config.execution.cleanPreviousResults = false;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return config;
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
Test Execution Framework

Usage: node scripts/run-tests.js [options]

Options:
  -e, --environments <envs>    Comma-separated list of environments (default: development)
  -b, --browsers <browsers>    Comma-separated list of browsers (default: chromium)
  -w, --workers <number>       Number of parallel workers (default: 4)
  -t, --timeout <seconds>      Test timeout in seconds (default: 300)
  -r, --retries <number>       Number of retries for failed tests (default: 2)
  -p, --pattern <pattern>      Test file pattern to run
  --no-notifications           Disable email notifications
  --clean                      Clean previous results before running (default)
  --no-clean                   Don't clean previous results
  -h, --help                   Show this help message

Examples:
  node scripts/run-tests.js
  node scripts/run-tests.js -e staging,production -b chromium,firefox
  node scripts/run-tests.js -w 8 -t 600 --pattern "**/*smoke*"
  node scripts/run-tests.js --no-notifications --no-clean

Environment Variables:
  SMTP_HOST                    SMTP server hostname
  SMTP_PORT                    SMTP server port
  SMTP_USER                    SMTP username
  SMTP_PASS                    SMTP password
  NOTIFICATION_FROM            From email address
  SUMMARY_RECIPIENTS           Comma-separated summary email recipients
  FAILURE_RECIPIENTS           Comma-separated failure email recipients
  CRITICAL_RECIPIENTS          Comma-separated critical email recipients
  NOTIFICATIONS_ENABLED        Enable/disable notifications (true/false)
`);
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 Starting Test Execution Framework');
    console.log('=====================================');

    const startTime = Date.now();
    let results = null;
    let trendAnalysis = null;

    try {
      // Display configuration
      this.displayConfiguration();

      // Execute tests
      console.log('\n📋 Executing tests...');
      results = await this.testExecutor.executeTests({
        testPattern: this.config.execution.testPattern,
      });

      // Generate reports
      console.log('\n📊 Generating reports...');
      await this.reportGenerator.generateReport();

      // Load trend analysis
      trendAnalysis = await this.loadTrendAnalysis();

      // Send notifications
      if (this.config.notifications.enabled) {
        console.log('\n📧 Sending notifications...');
        await this.sendNotifications(results, trendAnalysis);
      }

      // Display summary
      this.displaySummary(results, Date.now() - startTime);

      // Exit with appropriate code
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    } catch (error) {
      console.error('\n❌ Test execution failed:', error.message);

      // Send failure notification
      if (this.config.notifications.enabled && results) {
        try {
          await this.notificationManager.sendFailureNotification(results, []);
        } catch (notificationError) {
          console.error('Failed to send failure notification:', notificationError.message);
        }
      }

      process.exit(1);
    }
  }

  /**
   * Display current configuration
   */
  displayConfiguration() {
    console.log('\n⚙️  Configuration:');
    console.log(`   Environments: ${this.config.execution.environments.join(', ')}`);
    console.log(`   Browsers: ${this.config.execution.browsers.join(', ')}`);
    console.log(`   Workers: ${this.config.execution.maxParallelWorkers}`);
    console.log(`   Timeout: ${this.config.execution.timeout / 1000}s`);
    console.log(`   Retries: ${this.config.execution.retries}`);
    console.log(`   Notifications: ${this.config.notifications.enabled ? 'Enabled' : 'Disabled'}`);

    if (this.config.execution.testPattern) {
      console.log(`   Test Pattern: ${this.config.execution.testPattern}`);
    }
  }

  /**
   * Load trend analysis data
   * @returns {Object|null} - Trend analysis data
   */
  async loadTrendAnalysis() {
    const trendPath = path.join(this.config.execution.reportDir, 'trend-analysis.json');

    if (fs.existsSync(trendPath)) {
      try {
        return JSON.parse(fs.readFileSync(trendPath, 'utf8'));
      } catch (error) {
        console.warn('Failed to load trend analysis:', error.message);
      }
    }

    return null;
  }

  /**
   * Send notifications
   * @param {Object} results - Test results
   * @param {Object} trendAnalysis - Trend analysis data
   */
  async sendNotifications(results, trendAnalysis) {
    try {
      // Send summary notification
      await this.notificationManager.sendSummaryNotification(results, trendAnalysis);

      // Send failure notification if there are failures
      if (results.failed > 0) {
        await this.notificationManager.sendFailureNotification(results, []);
      }

      // Send trend notification if significant trends detected
      if (trendAnalysis && this.notificationManager.hasSignificantTrends(trendAnalysis)) {
        await this.notificationManager.sendTrendNotification(trendAnalysis);
      }

      console.log('   ✅ Notifications sent successfully');
    } catch (error) {
      console.error('   ❌ Failed to send notifications:', error.message);
    }
  }

  /**
   * Display execution summary
   * @param {Object} results - Test results
   * @param {number} totalDuration - Total execution duration
   */
  displaySummary(results, totalDuration) {
    const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;

    console.log('\n📈 Execution Summary');
    console.log('===================');
    console.log(`   Total Tests: ${results.total}`);
    console.log(`   Passed: ${results.passed} ✅`);
    console.log(`   Failed: ${results.failed} ${results.failed > 0 ? '❌' : '✅'}`);
    console.log(`   Skipped: ${results.skipped} ⏭️`);
    console.log(`   Pass Rate: ${passRate}%`);
    console.log(`   Duration: ${this.formatDuration(totalDuration)}`);

    if (Object.keys(results.environments).length > 1) {
      console.log('\n   Environment Results:');
      Object.entries(results.environments).forEach(([env, stats]) => {
        const envPassRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
        console.log(`     ${env}: ${stats.passed}/${stats.total} (${envPassRate}%)`);
      });
    }

    if (Object.keys(results.browsers).length > 1) {
      console.log('\n   Browser Results:');
      Object.entries(results.browsers).forEach(([browser, stats]) => {
        const browserPassRate =
          stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
        console.log(`     ${browser}: ${stats.passed}/${stats.total} (${browserPassRate}%)`);
      });
    }

    console.log('\n📁 Reports Generated:');
    console.log(
      `   HTML Report: ${path.join(this.config.execution.reportDir, 'test-report.html')}`
    );
    console.log(
      `   JSON Report: ${path.join(this.config.execution.reportDir, 'test-results.json')}`
    );
    console.log(
      `   Comprehensive Report: ${path.join(this.config.execution.reportDir, 'comprehensive/index.html')}`
    );

    if (results.failed > 0) {
      console.log(
        '\n⚠️  Some tests failed. Please review the detailed reports for more information.'
      );
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  }

  /**
   * Format duration in human readable format
   * @param {number} ms - Duration in milliseconds
   * @returns {string} - Formatted duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
