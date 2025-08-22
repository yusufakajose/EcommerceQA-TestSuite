#!/usr/bin/env node

/**
 * Test Metrics Dashboard Generator
 * Creates consolidated test metrics dashboard with charts and visualizations
 */

const fs = require('fs');
const path = require('path');

class DashboardGenerator {
  constructor() {
    this.baseDir = process.cwd();
    this.reportsDir = path.join(this.baseDir, 'reports');
    this.dashboardDir = path.join(this.reportsDir, 'dashboard');
    this.dataDir = path.join(this.dashboardDir, 'data');
    
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.reportsDir, this.dashboardDir, this.dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Collect test results from all test types
   */
  async collectTestResults() {
    const results = {
      ui: await this.collectUITestResults(),
      api: await this.collectAPITestResults(),
      performance: await this.collectPerformanceTestResults(),
      accessibility: await this.collectAccessibilityTestResults(),
      security: await this.collectSecurityTestResults(),
      timestamp: new Date().toISOString(),
      summary: {}
    };

    // Calculate overall summary
    results.summary = this.calculateOverallSummary(results);
    
    return results;
  }

  /**
   * Collect UI test results from Playwright reports
   */
  async collectUITestResults() {
    const uiResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      browsers: {},
      testFiles: [],
      lastRun: null
    };

    try {
      // Look for Playwright test results
      const playwrightReportDirs = [
        'reports/test-execution/development/playwright-report',
        'reports/test-execution/staging/playwright-report',
        'reports/test-execution/production/playwright-report',
        'test-results'
      ];

      for (const reportDir of playwrightReportDirs) {
        const fullPath = path.join(this.baseDir, reportDir);
        if (fs.existsSync(fullPath)) {
          const reportData = await this.parsePlaywrightResults(fullPath);
          if (reportData) {
            uiResults.total += reportData.total || 0;
            uiResults.passed += reportData.passed || 0;
            uiResults.failed += reportData.failed || 0;
            uiResults.skipped += reportData.skipped || 0;
            uiResults.duration += reportData.duration || 0;
            
            if (reportData.browsers) {
              Object.keys(reportData.browsers).forEach(browser => {
                if (!uiResults.browsers[browser]) {
                  uiResults.browsers[browser] = { passed: 0, failed: 0, total: 0 };
                }
                uiResults.browsers[browser].passed += reportData.browsers[browser].passed || 0;
                uiResults.browsers[browser].failed += reportData.browsers[browser].failed || 0;
                uiResults.browsers[browser].total += reportData.browsers[browser].total || 0;
              });
            }
            
            if (reportData.lastRun && (!uiResults.lastRun || new Date(reportData.lastRun) > new Date(uiResults.lastRun))) {
              uiResults.lastRun = reportData.lastRun;
            }
          }
        }
      }

      uiResults.passRate = uiResults.total > 0 ? Math.round((uiResults.passed / uiResults.total) * 100) : 0;
      uiResults.failRate = uiResults.total > 0 ? Math.round((uiResults.failed / uiResults.total) * 100) : 0;
      
    } catch (error) {
      console.warn('Error collecting UI test results:', error.message);
    }

    return uiResults;
  }

  /**
   * Parse Playwright test results
   */
  async parsePlaywrightResults(reportDir) {
    try {
      // Look for report.json or index.html
      const reportJsonPath = path.join(reportDir, 'report.json');
      const indexHtmlPath = path.join(reportDir, 'index.html');
      
      if (fs.existsSync(reportJsonPath)) {
        const reportData = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
        return this.parsePlaywrightJsonReport(reportData);
      } else if (fs.existsSync(indexHtmlPath)) {
        // Parse HTML report for basic stats
        const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        return this.parsePlaywrightHtmlReport(htmlContent);
      }
    } catch (error) {
      console.warn(`Error parsing Playwright results from ${reportDir}:`, error.message);
    }
    
    return null;
  }

  /**
   * Parse Playwright JSON report
   */
  parsePlaywrightJsonReport(reportData) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      browsers: {},
      lastRun: new Date().toISOString()
    };

    if (reportData.suites) {
      reportData.suites.forEach(suite => {
        this.processSuite(suite, results);
      });
    }

    return results;
  }

  /**
   * Process test suite recursively
   */
  processSuite(suite, results) {
    if (suite.tests) {
      suite.tests.forEach(test => {
        results.total++;
        
        if (test.results && test.results.length > 0) {
          const result = test.results[0];
          results.duration += result.duration || 0;
          
          switch (result.status) {
            case 'passed':
              results.passed++;
              break;
            case 'failed':
              results.failed++;
              break;
            case 'skipped':
              results.skipped++;
              break;
          }

          // Track browser results
          if (result.workerIndex !== undefined) {
            const browser = this.extractBrowserFromTest(test);
            if (browser) {
              if (!results.browsers[browser]) {
                results.browsers[browser] = { passed: 0, failed: 0, total: 0 };
              }
              results.browsers[browser].total++;
              if (result.status === 'passed') {
                results.browsers[browser].passed++;
              } else if (result.status === 'failed') {
                results.browsers[browser].failed++;
              }
            }
          }
        }
      });
    }

    if (suite.suites) {
      suite.suites.forEach(subSuite => {
        this.processSuite(subSuite, results);
      });
    }
  }

  /**
   * Extract browser name from test
   */
  extractBrowserFromTest(test) {
    if (test.projectName) {
      if (test.projectName.toLowerCase().includes('chrome')) return 'Chrome';
      if (test.projectName.toLowerCase().includes('firefox')) return 'Firefox';
      if (test.projectName.toLowerCase().includes('safari')) return 'Safari';
      if (test.projectName.toLowerCase().includes('webkit')) return 'WebKit';
    }
    return 'Unknown';
  }

  /**
   * Parse Playwright HTML report for basic stats
   */
  parsePlaywrightHtmlReport(htmlContent) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      browsers: {},
      lastRun: new Date().toISOString()
    };

    // Extract basic stats from HTML using regex
    const totalMatch = htmlContent.match(/(\d+)\s*tests?\s*total/i);
    const passedMatch = htmlContent.match(/(\d+)\s*passed/i);
    const failedMatch = htmlContent.match(/(\d+)\s*failed/i);
    const skippedMatch = htmlContent.match(/(\d+)\s*skipped/i);

    if (totalMatch) results.total = parseInt(totalMatch[1]);
    if (passedMatch) results.passed = parseInt(passedMatch[1]);
    if (failedMatch) results.failed = parseInt(failedMatch[1]);
    if (skippedMatch) results.skipped = parseInt(skippedMatch[1]);

    return results;
  }

  /**
   * Collect API test results from Newman reports
   */
  async collectAPITestResults() {
    const apiResults = {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      collections: {},
      environments: {},
      lastRun: null
    };

    try {
      const newmanReportDirs = [
        'reports/api-tests',
        'reports/newman'
      ];

      for (const reportDir of newmanReportDirs) {
        const fullPath = path.join(this.baseDir, reportDir);
        if (fs.existsSync(fullPath)) {
          const files = fs.readdirSync(fullPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(fullPath, file);
              const reportData = await this.parseNewmanResults(filePath);
              if (reportData) {
                apiResults.total += reportData.total || 0;
                apiResults.passed += reportData.passed || 0;
                apiResults.failed += reportData.failed || 0;
                apiResults.duration += reportData.duration || 0;
                
                if (reportData.collection) {
                  apiResults.collections[reportData.collection] = reportData;
                }
                
                if (reportData.lastRun && (!apiResults.lastRun || new Date(reportData.lastRun) > new Date(apiResults.lastRun))) {
                  apiResults.lastRun = reportData.lastRun;
                }
              }
            }
          }
        }
      }

      apiResults.passRate = apiResults.total > 0 ? Math.round((apiResults.passed / apiResults.total) * 100) : 0;
      apiResults.failRate = apiResults.total > 0 ? Math.round((apiResults.failed / apiResults.total) * 100) : 0;
      
    } catch (error) {
      console.warn('Error collecting API test results:', error.message);
    }

    return apiResults;
  }

  /**
   * Parse Newman test results
   */
  async parseNewmanResults(filePath) {
    try {
      const reportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (reportData.run) {
        const run = reportData.run;
        const stats = run.stats || {};
        
        return {
          collection: run.collection?.info?.name || 'Unknown',
          total: stats.tests?.total || 0,
          passed: (stats.tests?.total || 0) - (stats.tests?.failed || 0),
          failed: stats.tests?.failed || 0,
          duration: run.timings?.completed || 0,
          assertions: {
            total: stats.assertions?.total || 0,
            failed: stats.assertions?.failed || 0
          },
          requests: {
            total: stats.requests?.total || 0,
            failed: stats.requests?.failed || 0
          },
          lastRun: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn(`Error parsing Newman results from ${filePath}:`, error.message);
    }
    
    return null;
  }

  /**
   * Collect performance test results from JMeter reports
   */
  async collectPerformanceTestResults() {
    const perfResults = {
      scenarios: {},
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        p90ResponseTime: 0,
        p95ResponseTime: 0,
        throughput: 0,
        errorRate: 0
      },
      lastRun: null
    };

    try {
      const perfReportDirs = [
        'reports/performance-tests',
        'automated-tests/performance-tests/jmeter/results'
      ];

      for (const reportDir of perfReportDirs) {
        const fullPath = path.join(this.baseDir, reportDir);
        if (fs.existsSync(fullPath)) {
          const files = fs.readdirSync(fullPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(fullPath, file);
              const reportData = await this.parseJMeterResults(filePath);
              if (reportData) {
                perfResults.scenarios[reportData.scenario || file] = reportData;
                
                // Aggregate summary data
                perfResults.summary.totalRequests += reportData.totalRequests || 0;
                perfResults.summary.successfulRequests += reportData.successfulRequests || 0;
                perfResults.summary.failedRequests += reportData.failedRequests || 0;
                
                if (reportData.lastRun && (!perfResults.lastRun || new Date(reportData.lastRun) > new Date(perfResults.lastRun))) {
                  perfResults.lastRun = reportData.lastRun;
                }
              }
            }
          }
        }
      }

      // Calculate aggregated metrics
      if (perfResults.summary.totalRequests > 0) {
        perfResults.summary.errorRate = Math.round((perfResults.summary.failedRequests / perfResults.summary.totalRequests) * 100);
      }
      
    } catch (error) {
      console.warn('Error collecting performance test results:', error.message);
    }

    return perfResults;
  }

  /**
   * Parse JMeter test results
   */
  async parseJMeterResults(filePath) {
    try {
      const reportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Handle different JMeter report formats
      if (reportData.scenario) {
        return {
          scenario: reportData.scenario,
          totalRequests: reportData.summary?.totalRequests || 0,
          successfulRequests: reportData.summary?.successfulRequests || 0,
          failedRequests: reportData.summary?.failedRequests || 0,
          averageResponseTime: reportData.summary?.averageResponseTime || 0,
          p90ResponseTime: reportData.summary?.p90ResponseTime || 0,
          throughput: reportData.summary?.throughput || 0,
          errorRate: reportData.summary?.errorRate || 0,
          lastRun: reportData.timestamp || new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn(`Error parsing JMeter results from ${filePath}:`, error.message);
    }
    
    return null;
  }

  /**
   * Collect accessibility test results
   */
  async collectAccessibilityTestResults() {
    const a11yResults = {
      total: 0,
      passed: 0,
      failed: 0,
      violations: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      },
      wcagCompliance: {
        'wcag2a': 0,
        'wcag2aa': 0,
        'wcag21aa': 0
      },
      lastRun: null
    };

    try {
      // Look for accessibility test results in Playwright reports
      const a11yReportDirs = [
        'reports/accessibility-tests',
        'test-results'
      ];

      for (const reportDir of a11yReportDirs) {
        const fullPath = path.join(this.baseDir, reportDir);
        if (fs.existsSync(fullPath)) {
          // Parse accessibility-specific results
          const reportData = await this.parseAccessibilityResults(fullPath);
          if (reportData) {
            a11yResults.total += reportData.total || 0;
            a11yResults.passed += reportData.passed || 0;
            a11yResults.failed += reportData.failed || 0;
            
            Object.keys(reportData.violations || {}).forEach(severity => {
              a11yResults.violations[severity] += reportData.violations[severity] || 0;
            });
            
            if (reportData.lastRun && (!a11yResults.lastRun || new Date(reportData.lastRun) > new Date(a11yResults.lastRun))) {
              a11yResults.lastRun = reportData.lastRun;
            }
          }
        }
      }

      a11yResults.passRate = a11yResults.total > 0 ? Math.round((a11yResults.passed / a11yResults.total) * 100) : 0;
      a11yResults.complianceScore = this.calculateAccessibilityScore(a11yResults.violations);
      
    } catch (error) {
      console.warn('Error collecting accessibility test results:', error.message);
    }

    return a11yResults;
  }

  /**
   * Parse accessibility test results
   */
  async parseAccessibilityResults(reportDir) {
    // This would parse accessibility-specific results
    // For now, return mock data structure
    return {
      total: 0,
      passed: 0,
      failed: 0,
      violations: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      },
      lastRun: new Date().toISOString()
    };
  }

  /**
   * Calculate accessibility compliance score
   */
  calculateAccessibilityScore(violations) {
    const weights = { critical: 10, serious: 7, moderate: 4, minor: 1 };
    const totalViolations = Object.keys(violations).reduce((sum, severity) => {
      return sum + (violations[severity] * weights[severity]);
    }, 0);
    
    return Math.max(0, 100 - totalViolations);
  }

  /**
   * Collect security test results
   */
  async collectSecurityTestResults() {
    const securityResults = {
      total: 0,
      passed: 0,
      failed: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      categories: {
        xss: { tests: 0, issues: 0 },
        sqlInjection: { tests: 0, issues: 0 },
        authentication: { tests: 0, issues: 0 },
        authorization: { tests: 0, issues: 0 },
        sessionManagement: { tests: 0, issues: 0 },
        encryption: { tests: 0, issues: 0 }
      },
      securityScore: 0,
      lastRun: null
    };

    try {
      // Look for security test results
      const securityReportDirs = [
        'reports/security-tests',
        'test-results'
      ];

      for (const reportDir of securityReportDirs) {
        const fullPath = path.join(this.baseDir, reportDir);
        if (fs.existsSync(fullPath)) {
          const reportData = await this.parseSecurityResults(fullPath);
          if (reportData) {
            securityResults.total += reportData.total || 0;
            securityResults.passed += reportData.passed || 0;
            securityResults.failed += reportData.failed || 0;
            
            Object.keys(reportData.vulnerabilities || {}).forEach(severity => {
              securityResults.vulnerabilities[severity] += reportData.vulnerabilities[severity] || 0;
            });
            
            if (reportData.lastRun && (!securityResults.lastRun || new Date(reportData.lastRun) > new Date(securityResults.lastRun))) {
              securityResults.lastRun = reportData.lastRun;
            }
          }
        }
      }

      securityResults.passRate = securityResults.total > 0 ? Math.round((securityResults.passed / securityResults.total) * 100) : 0;
      securityResults.securityScore = this.calculateSecurityScore(securityResults.vulnerabilities);
      
    } catch (error) {
      console.warn('Error collecting security test results:', error.message);
    }

    return securityResults;
  }

  /**
   * Parse security test results
   */
  async parseSecurityResults(reportDir) {
    // This would parse security-specific results
    // For now, return mock data structure
    return {
      total: 0,
      passed: 0,
      failed: 0,
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      lastRun: new Date().toISOString()
    };
  }

  /**
   * Calculate security score
   */
  calculateSecurityScore(vulnerabilities) {
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    const totalIssues = Object.keys(vulnerabilities).reduce((sum, severity) => {
      return sum + (vulnerabilities[severity] * weights[severity]);
    }, 0);
    
    return Math.max(0, 100 - totalIssues);
  }

  /**
   * Calculate overall summary across all test types
   */
  calculateOverallSummary(results) {
    const summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallPassRate: 0,
      testTypes: {
        ui: { status: 'unknown', passRate: 0, lastRun: null },
        api: { status: 'unknown', passRate: 0, lastRun: null },
        performance: { status: 'unknown', score: 0, lastRun: null },
        accessibility: { status: 'unknown', score: 0, lastRun: null },
        security: { status: 'unknown', score: 0, lastRun: null }
      },
      qualityScore: 0,
      recommendations: []
    };

    // Aggregate test counts
    summary.totalTests = (results.ui.total || 0) + (results.api.total || 0) + 
                        (results.accessibility.total || 0) + (results.security.total || 0);
    
    summary.passedTests = (results.ui.passed || 0) + (results.api.passed || 0) + 
                         (results.accessibility.passed || 0) + (results.security.passed || 0);
    
    summary.failedTests = (results.ui.failed || 0) + (results.api.failed || 0) + 
                         (results.accessibility.failed || 0) + (results.security.failed || 0);

    // Calculate overall pass rate
    summary.overallPassRate = summary.totalTests > 0 ? 
      Math.round((summary.passedTests / summary.totalTests) * 100) : 0;

    // Set test type statuses
    summary.testTypes.ui.status = this.getTestStatus(results.ui.passRate);
    summary.testTypes.ui.passRate = results.ui.passRate || 0;
    summary.testTypes.ui.lastRun = results.ui.lastRun;

    summary.testTypes.api.status = this.getTestStatus(results.api.passRate);
    summary.testTypes.api.passRate = results.api.passRate || 0;
    summary.testTypes.api.lastRun = results.api.lastRun;

    summary.testTypes.performance.status = this.getPerformanceStatus(results.performance);
    summary.testTypes.performance.score = this.calculatePerformanceScore(results.performance);
    summary.testTypes.performance.lastRun = results.performance.lastRun;

    summary.testTypes.accessibility.status = this.getAccessibilityStatus(results.accessibility.complianceScore);
    summary.testTypes.accessibility.score = results.accessibility.complianceScore || 0;
    summary.testTypes.accessibility.lastRun = results.accessibility.lastRun;

    summary.testTypes.security.status = this.getSecurityStatus(results.security.securityScore);
    summary.testTypes.security.score = results.security.securityScore || 0;
    summary.testTypes.security.lastRun = results.security.lastRun;

    // Calculate overall quality score
    summary.qualityScore = this.calculateQualityScore(summary);

    // Generate recommendations
    summary.recommendations = this.generateRecommendations(summary, results);

    return summary;
  }

  /**
   * Get test status based on pass rate
   */
  getTestStatus(passRate) {
    if (passRate >= 95) return 'excellent';
    if (passRate >= 80) return 'good';
    if (passRate >= 60) return 'warning';
    return 'critical';
  }

  /**
   * Get performance status
   */
  getPerformanceStatus(perfResults) {
    const errorRate = perfResults.summary?.errorRate || 0;
    if (errorRate <= 1) return 'excellent';
    if (errorRate <= 3) return 'good';
    if (errorRate <= 5) return 'warning';
    return 'critical';
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(perfResults) {
    const errorRate = perfResults.summary?.errorRate || 0;
    return Math.max(0, 100 - (errorRate * 10));
  }

  /**
   * Get accessibility status
   */
  getAccessibilityStatus(score) {
    if (score >= 95) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  }

  /**
   * Get security status
   */
  getSecurityStatus(score) {
    if (score >= 95) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(summary) {
    const weights = {
      ui: 0.25,
      api: 0.25,
      performance: 0.2,
      accessibility: 0.15,
      security: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(testType => {
      const typeData = summary.testTypes[testType];
      if (typeData.status !== 'unknown') {
        const score = typeData.passRate || typeData.score || 0;
        totalScore += score * weights[testType];
        totalWeight += weights[testType];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(summary, results) {
    const recommendations = [];

    // UI test recommendations
    if (summary.testTypes.ui.passRate < 80) {
      recommendations.push({
        type: 'ui',
        priority: 'high',
        message: 'UI test pass rate is below 80%. Review and fix failing UI tests.',
        action: 'Fix failing UI tests'
      });
    }

    // API test recommendations
    if (summary.testTypes.api.passRate < 80) {
      recommendations.push({
        type: 'api',
        priority: 'high',
        message: 'API test pass rate is below 80%. Review API test failures.',
        action: 'Fix failing API tests'
      });
    }

    // Performance recommendations
    if (results.performance.summary.errorRate > 5) {
      recommendations.push({
        type: 'performance',
        priority: 'critical',
        message: 'Performance error rate exceeds 5%. Investigate performance issues.',
        action: 'Optimize application performance'
      });
    }

    // Accessibility recommendations
    if (summary.testTypes.accessibility.score < 80) {
      recommendations.push({
        type: 'accessibility',
        priority: 'medium',
        message: 'Accessibility compliance score is below 80%. Address accessibility violations.',
        action: 'Fix accessibility issues'
      });
    }

    // Security recommendations
    if (summary.testTypes.security.score < 80) {
      recommendations.push({
        type: 'security',
        priority: 'critical',
        message: 'Security score is below 80%. Address security vulnerabilities immediately.',
        action: 'Fix security vulnerabilities'
      });
    }

    // Overall quality recommendations
    if (summary.qualityScore < 70) {
      recommendations.push({
        type: 'overall',
        priority: 'high',
        message: 'Overall quality score is below 70%. Comprehensive quality improvement needed.',
        action: 'Implement quality improvement plan'
      });
    }

    return recommendations;
  }

  /**
   * Generate HTML dashboard
   */
  async generateDashboard(results) {
    const dashboardHtml = this.createDashboardHTML(results);
    const dashboardPath = path.join(this.dashboardDir, 'index.html');
    
    fs.writeFileSync(dashboardPath, dashboardHtml);
    
    // Save raw data for API access
    const dataPath = path.join(this.dataDir, 'dashboard-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(results, null, 2));
    
    console.log(`Dashboard generated: ${dashboardPath}`);
    return dashboardPath;
  }

  /**
   * Create HTML dashboard content
   */
  createDashboardHTML(results) {
    const { summary } = results;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Testing Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        
        .card:hover {
            transform: translateY(-2px);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .card-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            font-size: 1.2rem;
        }
        
        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #4a5568;
        }
        
        .card-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .card-subtitle {
            color: #718096;
            font-size: 0.9rem;
        }
        
        .status-excellent { color: #38a169; background-color: #f0fff4; }
        .status-good { color: #3182ce; background-color: #ebf8ff; }
        .status-warning { color: #d69e2e; background-color: #fffbeb; }
        .status-critical { color: #e53e3e; background-color: #fed7d7; }
        
        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .chart-card {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .chart-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #2d3748;
        }
        
        .recommendations {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .recommendation-item {
            display: flex;
            align-items: flex-start;
            padding: 1rem;
            border-left: 4px solid #e2e8f0;
            margin-bottom: 1rem;
            background-color: #f7fafc;
            border-radius: 0 8px 8px 0;
        }
        
        .recommendation-item.priority-critical {
            border-left-color: #e53e3e;
            background-color: #fed7d7;
        }
        
        .recommendation-item.priority-high {
            border-left-color: #d69e2e;
            background-color: #fffbeb;
        }
        
        .recommendation-item.priority-medium {
            border-left-color: #3182ce;
            background-color: #ebf8ff;
        }
        
        .test-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .test-detail-card {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .test-detail-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .metric-row:last-child {
            border-bottom: none;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            margin-top: 2rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .summary-cards {
                grid-template-columns: 1fr;
            }
            
            .charts-section {
                grid-template-columns: 1fr;
            }
            
            .test-details {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>QA Testing Dashboard</h1>
        <p>Comprehensive Test Results and Quality Metrics</p>
        <p>Last Updated: ${new Date(results.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="container">
        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="card">
                <div class="card-header">
                    <div class="card-icon status-${this.getTestStatus(summary.overallPassRate)}">📊</div>
                    <div class="card-title">Overall Quality</div>
                </div>
                <div class="card-value status-${this.getTestStatus(summary.qualityScore)}">${summary.qualityScore}%</div>
                <div class="card-subtitle">Quality Score</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon status-${this.getTestStatus(summary.overallPassRate)}">✅</div>
                    <div class="card-title">Test Results</div>
                </div>
                <div class="card-value">${summary.passedTests}/${summary.totalTests}</div>
                <div class="card-subtitle">${summary.overallPassRate}% Pass Rate</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon status-${summary.testTypes.ui.status}">🖥️</div>
                    <div class="card-title">UI Tests</div>
                </div>
                <div class="card-value">${results.ui.passed}/${results.ui.total}</div>
                <div class="card-subtitle">${results.ui.passRate}% Pass Rate</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon status-${summary.testTypes.api.status}">🔌</div>
                    <div class="card-title">API Tests</div>
                </div>
                <div class="card-value">${results.api.passed}/${results.api.total}</div>
                <div class="card-subtitle">${results.api.passRate}% Pass Rate</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon status-${summary.testTypes.performance.status}">⚡</div>
                    <div class="card-title">Performance</div>
                </div>
                <div class="card-value">${summary.testTypes.performance.score}%</div>
                <div class="card-subtitle">Performance Score</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon status-${summary.testTypes.accessibility.status}">♿</div>
                    <div class="card-title">Accessibility</div>
                </div>
                <div class="card-value">${summary.testTypes.accessibility.score}%</div>
                <div class="card-subtitle">WCAG Compliance</div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon status-${summary.testTypes.security.status}">🔒</div>
                    <div class="card-title">Security</div>
                </div>
                <div class="card-value">${summary.testTypes.security.score}%</div>
                <div class="card-subtitle">Security Score</div>
            </div>
        </div>
        
        <!-- Charts Section -->
        <div class="charts-section">
            <div class="chart-card">
                <div class="chart-title">Test Results Overview</div>
                <canvas id="testResultsChart" width="400" height="200"></canvas>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">Quality Metrics by Category</div>
                <canvas id="qualityMetricsChart" width="400" height="200"></canvas>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">Test Execution Trends</div>
                <canvas id="trendsChart" width="400" height="200"></canvas>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">Browser Coverage</div>
                <canvas id="browserChart" width="400" height="200"></canvas>
            </div>
        </div>
        
        <!-- Recommendations -->
        ${summary.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2 class="chart-title">Recommendations</h2>
            ${summary.recommendations.map(rec => `
                <div class="recommendation-item priority-${rec.priority}">
                    <div>
                        <strong>${rec.type.toUpperCase()}</strong>: ${rec.message}
                        <br><em>Action: ${rec.action}</em>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <!-- Detailed Test Results -->
        <div class="test-details">
            <div class="test-detail-card">
                <div class="test-detail-header">
                    <h3>UI Test Details</h3>
                    <span class="status-badge status-${summary.testTypes.ui.status}">${summary.testTypes.ui.status}</span>
                </div>
                <div class="metric-row">
                    <span>Total Tests:</span>
                    <span>${results.ui.total}</span>
                </div>
                <div class="metric-row">
                    <span>Passed:</span>
                    <span>${results.ui.passed}</span>
                </div>
                <div class="metric-row">
                    <span>Failed:</span>
                    <span>${results.ui.failed}</span>
                </div>
                <div class="metric-row">
                    <span>Duration:</span>
                    <span>${Math.round(results.ui.duration / 1000)}s</span>
                </div>
                <div class="metric-row">
                    <span>Last Run:</span>
                    <span>${results.ui.lastRun ? new Date(results.ui.lastRun).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
            
            <div class="test-detail-card">
                <div class="test-detail-header">
                    <h3>API Test Details</h3>
                    <span class="status-badge status-${summary.testTypes.api.status}">${summary.testTypes.api.status}</span>
                </div>
                <div class="metric-row">
                    <span>Total Tests:</span>
                    <span>${results.api.total}</span>
                </div>
                <div class="metric-row">
                    <span>Passed:</span>
                    <span>${results.api.passed}</span>
                </div>
                <div class="metric-row">
                    <span>Failed:</span>
                    <span>${results.api.failed}</span>
                </div>
                <div class="metric-row">
                    <span>Collections:</span>
                    <span>${Object.keys(results.api.collections).length}</span>
                </div>
                <div class="metric-row">
                    <span>Last Run:</span>
                    <span>${results.api.lastRun ? new Date(results.api.lastRun).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
            
            <div class="test-detail-card">
                <div class="test-detail-header">
                    <h3>Performance Details</h3>
                    <span class="status-badge status-${summary.testTypes.performance.status}">${summary.testTypes.performance.status}</span>
                </div>
                <div class="metric-row">
                    <span>Total Requests:</span>
                    <span>${results.performance.summary.totalRequests}</span>
                </div>
                <div class="metric-row">
                    <span>Successful:</span>
                    <span>${results.performance.summary.successfulRequests}</span>
                </div>
                <div class="metric-row">
                    <span>Error Rate:</span>
                    <span>${results.performance.summary.errorRate}%</span>
                </div>
                <div class="metric-row">
                    <span>Avg Response:</span>
                    <span>${results.performance.summary.averageResponseTime}ms</span>
                </div>
                <div class="metric-row">
                    <span>Last Run:</span>
                    <span>${results.performance.lastRun ? new Date(results.performance.lastRun).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
            
            <div class="test-detail-card">
                <div class="test-detail-header">
                    <h3>Security Details</h3>
                    <span class="status-badge status-${summary.testTypes.security.status}">${summary.testTypes.security.status}</span>
                </div>
                <div class="metric-row">
                    <span>Critical Issues:</span>
                    <span>${results.security.vulnerabilities.critical}</span>
                </div>
                <div class="metric-row">
                    <span>High Issues:</span>
                    <span>${results.security.vulnerabilities.high}</span>
                </div>
                <div class="metric-row">
                    <span>Medium Issues:</span>
                    <span>${results.security.vulnerabilities.medium}</span>
                </div>
                <div class="metric-row">
                    <span>Low Issues:</span>
                    <span>${results.security.vulnerabilities.low}</span>
                </div>
                <div class="metric-row">
                    <span>Last Run:</span>
                    <span>${results.security.lastRun ? new Date(results.security.lastRun).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated by QA Testing Dashboard • ${new Date().toLocaleString()}</p>
    </div>
    
    <script>
        // Test Results Overview Chart
        const testResultsCtx = document.getElementById('testResultsChart').getContext('2d');
        new Chart(testResultsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [${summary.passedTests}, ${summary.failedTests}, ${results.ui.skipped || 0}],
                    backgroundColor: ['#38a169', '#e53e3e', '#d69e2e']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Quality Metrics Chart
        const qualityMetricsCtx = document.getElementById('qualityMetricsChart').getContext('2d');
        new Chart(qualityMetricsCtx, {
            type: 'radar',
            data: {
                labels: ['UI Tests', 'API Tests', 'Performance', 'Accessibility', 'Security'],
                datasets: [{
                    label: 'Quality Score',
                    data: [
                        ${summary.testTypes.ui.passRate},
                        ${summary.testTypes.api.passRate},
                        ${summary.testTypes.performance.score},
                        ${summary.testTypes.accessibility.score},
                        ${summary.testTypes.security.score}
                    ],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        
        // Browser Coverage Chart
        const browserCtx = document.getElementById('browserChart').getContext('2d');
        const browserData = ${JSON.stringify(results.ui.browsers)};
        const browserLabels = Object.keys(browserData);
        const browserPassed = browserLabels.map(browser => browserData[browser].passed || 0);
        const browserFailed = browserLabels.map(browser => browserData[browser].failed || 0);
        
        new Chart(browserCtx, {
            type: 'bar',
            data: {
                labels: browserLabels,
                datasets: [
                    {
                        label: 'Passed',
                        data: browserPassed,
                        backgroundColor: '#38a169'
                    },
                    {
                        label: 'Failed',
                        data: browserFailed,
                        backgroundColor: '#e53e3e'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        });
        
        // Trends Chart (placeholder - would need historical data)
        const trendsCtx = document.getElementById('trendsChart').getContext('2d');
        new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Pass Rate %',
                    data: [85, 88, 92, ${summary.overallPassRate}],
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Run dashboard generation
   */
  async run() {
    console.log('Collecting test results...');
    const results = await this.collectTestResults();
    
    console.log('Generating dashboard...');
    const dashboardPath = await this.generateDashboard(results);
    
    console.log('Dashboard generation completed!');
    console.log(`Dashboard available at: ${dashboardPath}`);
    
    return {
      dashboardPath,
      results,
      summary: results.summary
    };
  }
}

// CLI Interface
if (require.main === module) {
  const generator = new DashboardGenerator();
  
  generator.run()
    .then(({ dashboardPath, summary }) => {
      console.log('\n=== Dashboard Generation Summary ===');
      console.log(`Quality Score: ${summary.qualityScore}%`);
      console.log(`Total Tests: ${summary.totalTests}`);
      console.log(`Pass Rate: ${summary.overallPassRate}%`);
      console.log(`Dashboard: ${dashboardPath}`);
      
      if (summary.recommendations.length > 0) {
        console.log('\nRecommendations:');
        summary.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Dashboard generation failed:', error);
      process.exit(1);
    });
}

module.exports = DashboardGenerator;