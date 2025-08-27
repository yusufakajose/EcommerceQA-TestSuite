#!/usr/bin/env node

/**
 * Test Metrics Collector
 * Collects and aggregates test metrics from various sources
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MetricsCollector {
  constructor() {
    this.baseDir = process.cwd();
    this.metricsDir = path.join(this.baseDir, 'reports', 'metrics');
    this.historicalDataFile = path.join(this.metricsDir, 'historical-data.json');

    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  /**
   * Collect comprehensive test metrics
   */
  async collectMetrics() {
    const timestamp = new Date().toISOString();

    const metrics = {
      timestamp,
      testExecution: await this.collectTestExecutionMetrics(),
      codeQuality: await this.collectCodeQualityMetrics(),
      coverage: await this.collectCoverageMetrics(),
      performance: await this.collectPerformanceMetrics(),
      defects: await this.collectDefectMetrics(),
      trends: await this.calculateTrends(),
      environment: this.collectEnvironmentInfo(),
    };

    // Save current metrics
    await this.saveMetrics(metrics);

    // Update historical data
    await this.updateHistoricalData(metrics);

    return metrics;
  }

  /**
   * Collect test execution metrics
   */
  async collectTestExecutionMetrics() {
    const metrics = {
      ui: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        passRate: 0,
        avgDuration: 0,
        browsers: {},
        environments: {},
      },
      api: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        passRate: 0,
        collections: {},
        environments: {},
      },
      performance: {
        scenarios: 0,
        totalRequests: 0,
        successfulRequests: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
      },
      accessibility: {
        total: 0,
        passed: 0,
        violations: {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0,
        },
        wcagCompliance: 0,
      },
      security: {
        total: 0,
        passed: 0,
        vulnerabilities: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        securityScore: 0,
      },
    };

    // Collect UI test metrics
    try {
      const uiMetrics = await this.parseUITestResults();
      Object.assign(metrics.ui, uiMetrics);
    } catch (error) {
      console.warn('Error collecting UI test metrics:', error.message);
    }

    // Collect API test metrics
    try {
      const apiMetrics = await this.parseAPITestResults();
      Object.assign(metrics.api, apiMetrics);
    } catch (error) {
      console.warn('Error collecting API test metrics:', error.message);
    }

    // Collect performance metrics
    try {
      const perfMetrics = await this.parsePerformanceResults();
      Object.assign(metrics.performance, perfMetrics);
    } catch (error) {
      console.warn('Error collecting performance metrics:', error.message);
    }

    // Collect accessibility metrics
    try {
      const a11yMetrics = await this.parseAccessibilityResults();
      Object.assign(metrics.accessibility, a11yMetrics);
    } catch (error) {
      console.warn('Error collecting accessibility metrics:', error.message);
    }

    // Collect security metrics
    try {
      const securityMetrics = await this.parseSecurityResults();
      Object.assign(metrics.security, securityMetrics);
    } catch (error) {
      console.warn('Error collecting security metrics:', error.message);
    }

    return metrics;
  }

  /**
   * Parse UI test results from various sources
   */
  async parseUITestResults() {
    const metrics = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      browsers: {},
      environments: {},
    };

    // Look for Playwright results
    const playwrightDirs = [
      'test-results',
      'reports/test-execution/development/playwright-report',
      'reports/test-execution/staging/playwright-report',
      'reports/test-execution/production/playwright-report',
    ];

    for (const dir of playwrightDirs) {
      const fullPath = path.join(this.baseDir, dir);
      if (fs.existsSync(fullPath)) {
        try {
          const results = await this.parsePlaywrightResults(fullPath);
          if (results) {
            metrics.total += results.total || 0;
            metrics.passed += results.passed || 0;
            metrics.failed += results.failed || 0;
            metrics.skipped += results.skipped || 0;
            metrics.duration += results.duration || 0;

            // Merge browser results
            Object.keys(results.browsers || {}).forEach((browser) => {
              if (!metrics.browsers[browser]) {
                metrics.browsers[browser] = { total: 0, passed: 0, failed: 0 };
              }
              metrics.browsers[browser].total += results.browsers[browser].total || 0;
              metrics.browsers[browser].passed += results.browsers[browser].passed || 0;
              metrics.browsers[browser].failed += results.browsers[browser].failed || 0;
            });
          }
        } catch (error) {
          console.warn(`Error parsing Playwright results from ${dir}:`, error.message);
        }
      }
    }

    metrics.passRate = metrics.total > 0 ? Math.round((metrics.passed / metrics.total) * 100) : 0;
    metrics.avgDuration = metrics.total > 0 ? Math.round(metrics.duration / metrics.total) : 0;

    return metrics;
  }

  /**
   * Parse Playwright results from directory
   */
  async parsePlaywrightResults(dir) {
    // Implementation would parse actual Playwright results
    // For now, return sample structure
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      browsers: {},
    };
  }

  /**
   * Parse API test results from Newman reports
   */
  async parseAPITestResults() {
    const metrics = {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      collections: {},
      environments: {},
    };

    const newmanDirs = ['reports/api-tests', 'reports/newman'];

    for (const dir of newmanDirs) {
      const fullPath = path.join(this.baseDir, dir);
      if (fs.existsSync(fullPath)) {
        try {
          const files = fs.readdirSync(fullPath);

          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(fullPath, file);
              const results = await this.parseNewmanResults(filePath);
              if (results) {
                metrics.total += results.total || 0;
                metrics.passed += results.passed || 0;
                metrics.failed += results.failed || 0;
                metrics.duration += results.duration || 0;

                if (results.collection) {
                  metrics.collections[results.collection] = results;
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Error parsing Newman results from ${dir}:`, error.message);
        }
      }
    }

    metrics.passRate = metrics.total > 0 ? Math.round((metrics.passed / metrics.total) * 100) : 0;

    return metrics;
  }

  /**
   * Parse Newman results from file
   */
  async parseNewmanResults(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      if (data.run && data.run.stats) {
        const stats = data.run.stats;
        return {
          collection: data.run.collection?.info?.name || 'Unknown',
          total: stats.tests?.total || 0,
          passed: (stats.tests?.total || 0) - (stats.tests?.failed || 0),
          failed: stats.tests?.failed || 0,
          duration: data.run.timings?.completed || 0,
        };
      }
    } catch (error) {
      console.warn(`Error parsing Newman file ${filePath}:`, error.message);
    }

    return null;
  }

  /**
   * Parse performance test results
   */
  async parsePerformanceResults() {
    const metrics = {
      scenarios: 0,
      totalRequests: 0,
      successfulRequests: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      throughput: 0,
      errorRate: 0,
    };

    const perfDirs = [
      'reports/performance-tests',
      'automated-tests/performance-tests/jmeter/results',
    ];

    for (const dir of perfDirs) {
      const fullPath = path.join(this.baseDir, dir);
      if (fs.existsSync(fullPath)) {
        try {
          const files = fs.readdirSync(fullPath);

          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(fullPath, file);
              const results = await this.parseJMeterResults(filePath);
              if (results) {
                metrics.scenarios++;
                metrics.totalRequests += results.totalRequests || 0;
                metrics.successfulRequests += results.successfulRequests || 0;

                // Calculate weighted averages
                if (results.avgResponseTime) {
                  metrics.avgResponseTime = (metrics.avgResponseTime + results.avgResponseTime) / 2;
                }
                if (results.p95ResponseTime) {
                  metrics.p95ResponseTime = Math.max(
                    metrics.p95ResponseTime,
                    results.p95ResponseTime
                  );
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Error parsing performance results from ${dir}:`, error.message);
        }
      }
    }

    if (metrics.totalRequests > 0) {
      metrics.errorRate = Math.round(
        ((metrics.totalRequests - metrics.successfulRequests) / metrics.totalRequests) * 100
      );
    }

    return metrics;
  }

  /**
   * Parse JMeter results from file
   */
  async parseJMeterResults(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      if (data.summary) {
        return {
          totalRequests: data.summary.totalRequests || 0,
          successfulRequests: data.summary.successfulRequests || 0,
          avgResponseTime: data.summary.averageResponseTime || 0,
          p95ResponseTime: data.summary.p95ResponseTime || 0,
          throughput: data.summary.throughput || 0,
        };
      }
    } catch (error) {
      console.warn(`Error parsing JMeter file ${filePath}:`, error.message);
    }

    return null;
  }

  /**
   * Parse accessibility test results
   */
  async parseAccessibilityResults() {
    return {
      total: 0,
      passed: 0,
      violations: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      },
      wcagCompliance: 0,
    };
  }

  /**
   * Parse security test results
   */
  async parseSecurityResults() {
    return {
      total: 0,
      passed: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      securityScore: 0,
    };
  }

  /**
   * Collect code quality metrics
   */
  async collectCodeQualityMetrics() {
    const metrics = {
      linting: {
        errors: 0,
        warnings: 0,
        files: 0,
      },
      complexity: {
        average: 0,
        max: 0,
        files: 0,
      },
      duplication: {
        percentage: 0,
        lines: 0,
      },
      maintainability: {
        score: 0,
        grade: 'A',
      },
    };

    try {
      // Run ESLint to get linting metrics
      const eslintResult = execSync('npx eslint . --format json', {
        encoding: 'utf8',
        cwd: this.baseDir,
      });

      const eslintData = JSON.parse(eslintResult);
      metrics.linting.files = eslintData.length;

      eslintData.forEach((file) => {
        metrics.linting.errors += file.errorCount || 0;
        metrics.linting.warnings += file.warningCount || 0;
      });
    } catch (error) {
      console.warn('Error collecting ESLint metrics:', error.message);
    }

    return metrics;
  }

  /**
   * Collect test coverage metrics
   */
  async collectCoverageMetrics() {
    const metrics = {
      statements: {
        total: 0,
        covered: 0,
        percentage: 0,
      },
      branches: {
        total: 0,
        covered: 0,
        percentage: 0,
      },
      functions: {
        total: 0,
        covered: 0,
        percentage: 0,
      },
      lines: {
        total: 0,
        covered: 0,
        percentage: 0,
      },
      files: {
        total: 0,
        covered: 0,
        percentage: 0,
      },
    };

    try {
      // Look for coverage reports
      const coverageFiles = [
        'coverage/coverage-summary.json',
        'reports/coverage/coverage-summary.json',
      ];

      for (const file of coverageFiles) {
        const filePath = path.join(this.baseDir, file);
        if (fs.existsSync(filePath)) {
          const coverageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          if (coverageData.total) {
            const total = coverageData.total;
            metrics.statements.percentage = total.statements?.pct || 0;
            metrics.branches.percentage = total.branches?.pct || 0;
            metrics.functions.percentage = total.functions?.pct || 0;
            metrics.lines.percentage = total.lines?.pct || 0;

            metrics.statements.total = total.statements?.total || 0;
            metrics.statements.covered = total.statements?.covered || 0;
            metrics.branches.total = total.branches?.total || 0;
            metrics.branches.covered = total.branches?.covered || 0;
            metrics.functions.total = total.functions?.total || 0;
            metrics.functions.covered = total.functions?.covered || 0;
            metrics.lines.total = total.lines?.total || 0;
            metrics.lines.covered = total.lines?.covered || 0;
          }
          break;
        }
      }
    } catch (error) {
      console.warn('Error collecting coverage metrics:', error.message);
    }

    return metrics;
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    const metrics = {
      loadTesting: {
        scenarios: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        errorRate: 0,
        throughput: 0,
      },
      monitoring: {
        uptime: 100,
        availability: 100,
        meanTimeToRecover: 0,
      },
      resources: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
      },
    };

    // This would integrate with actual performance monitoring tools
    // For now, return basic structure

    return metrics;
  }

  /**
   * Collect defect metrics
   */
  async collectDefectMetrics() {
    const metrics = {
      total: 0,
      open: 0,
      closed: 0,
      severity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      type: {
        functional: 0,
        ui: 0,
        performance: 0,
        security: 0,
        accessibility: 0,
      },
      resolution: {
        fixed: 0,
        wontFix: 0,
        duplicate: 0,
        invalid: 0,
      },
      averageResolutionTime: 0,
      defectDensity: 0,
      escapeRate: 0,
    };

    // This would integrate with issue tracking systems
    // For now, return basic structure

    return metrics;
  }

  /**
   * Calculate trends from historical data
   */
  async calculateTrends() {
    const trends = {
      testExecution: {
        passRateTrend: 'stable',
        passRateChange: 0,
        executionTimeTrend: 'stable',
        executionTimeChange: 0,
      },
      quality: {
        qualityScoreTrend: 'stable',
        qualityScoreChange: 0,
        defectTrend: 'stable',
        defectChange: 0,
      },
      coverage: {
        coverageTrend: 'stable',
        coverageChange: 0,
      },
      performance: {
        responseTimeTrend: 'stable',
        responseTimeChange: 0,
        throughputTrend: 'stable',
        throughputChange: 0,
      },
    };

    try {
      if (fs.existsSync(this.historicalDataFile)) {
        const historicalData = JSON.parse(fs.readFileSync(this.historicalDataFile, 'utf8'));

        if (historicalData.length >= 2) {
          const current = historicalData[historicalData.length - 1];
          const previous = historicalData[historicalData.length - 2];

          // Calculate trends
          trends.testExecution.passRateChange = this.calculateChange(
            current.testExecution?.ui?.passRate || 0,
            previous.testExecution?.ui?.passRate || 0
          );

          trends.testExecution.passRateTrend = this.getTrend(trends.testExecution.passRateChange);

          // Add more trend calculations as needed
        }
      }
    } catch (error) {
      console.warn('Error calculating trends:', error.message);
    }

    return trends;
  }

  /**
   * Calculate percentage change
   */
  calculateChange(current, previous) {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Get trend direction
   */
  getTrend(change) {
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Collect environment information
   */
  collectEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
      ci: process.env.CI === 'true',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Save current metrics
   */
  async saveMetrics(metrics) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `metrics-${timestamp}.json`;
    const filepath = path.join(this.metricsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));

    // Also save as latest
    const latestPath = path.join(this.metricsDir, 'latest-metrics.json');
    fs.writeFileSync(latestPath, JSON.stringify(metrics, null, 2));

    console.log(`Metrics saved: ${filepath}`);
  }

  /**
   * Update historical data
   */
  async updateHistoricalData(metrics) {
    let historicalData = [];

    if (fs.existsSync(this.historicalDataFile)) {
      try {
        historicalData = JSON.parse(fs.readFileSync(this.historicalDataFile, 'utf8'));
      } catch (error) {
        console.warn('Error reading historical data:', error.message);
      }
    }

    // Add current metrics
    historicalData.push(metrics);

    // Keep only last 30 entries
    if (historicalData.length > 30) {
      historicalData = historicalData.slice(-30);
    }

    fs.writeFileSync(this.historicalDataFile, JSON.stringify(historicalData, null, 2));
  }

  /**
   * Generate metrics summary
   */
  generateSummary(metrics) {
    const summary = {
      timestamp: metrics.timestamp,
      overallHealth: 'good',
      keyMetrics: {
        testPassRate: 0,
        codeQuality: 'A',
        coverage: 0,
        performance: 'good',
        security: 'good',
      },
      alerts: [],
      recommendations: [],
    };

    // Calculate overall test pass rate
    const totalTests =
      (metrics.testExecution.ui.total || 0) +
      (metrics.testExecution.api.total || 0) +
      (metrics.testExecution.accessibility.total || 0) +
      (metrics.testExecution.security.total || 0);

    const totalPassed =
      (metrics.testExecution.ui.passed || 0) +
      (metrics.testExecution.api.passed || 0) +
      (metrics.testExecution.accessibility.passed || 0) +
      (metrics.testExecution.security.passed || 0);

    summary.keyMetrics.testPassRate =
      totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

    // Set coverage
    summary.keyMetrics.coverage = metrics.coverage.statements.percentage || 0;

    // Generate alerts
    if (summary.keyMetrics.testPassRate < 80) {
      summary.alerts.push({
        type: 'warning',
        message: 'Test pass rate is below 80%',
        value: summary.keyMetrics.testPassRate,
      });
    }

    if (summary.keyMetrics.coverage < 70) {
      summary.alerts.push({
        type: 'warning',
        message: 'Code coverage is below 70%',
        value: summary.keyMetrics.coverage,
      });
    }

    // Generate recommendations
    if (metrics.codeQuality.linting.errors > 0) {
      summary.recommendations.push('Fix ESLint errors to improve code quality');
    }

    if (summary.keyMetrics.coverage < 80) {
      summary.recommendations.push('Increase test coverage to at least 80%');
    }

    // Determine overall health
    if (summary.alerts.some((alert) => alert.type === 'critical')) {
      summary.overallHealth = 'critical';
    } else if (summary.alerts.some((alert) => alert.type === 'warning')) {
      summary.overallHealth = 'warning';
    } else {
      summary.overallHealth = 'good';
    }

    return summary;
  }

  /**
   * Run metrics collection
   */
  async run() {
    console.log('Collecting comprehensive test metrics...');

    const metrics = await this.collectMetrics();
    const summary = this.generateSummary(metrics);

    console.log('\n=== Metrics Collection Summary ===');
    console.log(`Overall Health: ${summary.overallHealth}`);
    console.log(`Test Pass Rate: ${summary.keyMetrics.testPassRate}%`);
    console.log(`Code Coverage: ${summary.keyMetrics.coverage}%`);

    if (summary.alerts.length > 0) {
      console.log('\nAlerts:');
      summary.alerts.forEach((alert) => {
        console.log(`- ${alert.type.toUpperCase()}: ${alert.message}`);
      });
    }

    if (summary.recommendations.length > 0) {
      console.log('\nRecommendations:');
      summary.recommendations.forEach((rec) => {
        console.log(`- ${rec}`);
      });
    }

    return { metrics, summary };
  }
}

// CLI Interface
if (require.main === module) {
  const collector = new MetricsCollector();

  collector
    .run()
    .then(({ metrics, summary }) => {
      console.log('\nMetrics collection completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Metrics collection failed:', error);
      process.exit(1);
    });
}

module.exports = MetricsCollector;
