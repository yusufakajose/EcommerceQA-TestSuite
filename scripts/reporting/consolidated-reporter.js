#!/usr/bin/env node

/**
 * Consolidated Test Reporter
 * Generates comprehensive test metrics dashboard and reports
 */

const fs = require('fs');
const path = require('path');
const DashboardGenerator = require('./dashboard-generator');
const MetricsCollector = require('./metrics-collector');
const ReportGenerator = require('./generate-report');

class ConsolidatedReporter {
  constructor() {
    this.baseDir = process.cwd();
    this.reportsDir = path.join(this.baseDir, 'reports');
    this.consolidatedDir = path.join(this.reportsDir, 'consolidated');
    
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    [this.reportsDir, this.consolidatedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate all reports and dashboard
   */
  async generateAllReports() {
    console.log('Starting consolidated report generation...');
    
    const startTime = Date.now();
    const results = {
      dashboard: null,
      metrics: null,
      detailedReport: null,
      executiveSummary: null,
      trends: null
    };

    try {
      // Step 1: Collect comprehensive metrics
      console.log('\n1. Collecting comprehensive test metrics...');
      const metricsCollector = new MetricsCollector();
      const { metrics, summary } = await metricsCollector.run();
      results.metrics = { metrics, summary };

      // Step 2: Generate interactive dashboard
      console.log('\n2. Generating interactive dashboard...');
      const dashboardGenerator = new DashboardGenerator();
      const dashboardResult = await dashboardGenerator.run();
      results.dashboard = dashboardResult;

      // Step 3: Generate detailed reports
      console.log('\n3. Generating detailed test reports...');
      const reportGenerator = new ReportGenerator();
      await reportGenerator.generateReport();
      results.detailedReport = 'Generated';

      // Step 4: Generate executive summary
      console.log('\n4. Generating executive summary...');
      const executiveSummary = await this.generateExecutiveSummary(metrics, summary);
      results.executiveSummary = executiveSummary;

      // Step 5: Generate trend analysis
      console.log('\n5. Generating trend analysis...');
      const trendAnalysis = await this.generateTrendAnalysis(metrics);
      results.trends = trendAnalysis;

      // Step 6: Create consolidated index
      console.log('\n6. Creating consolidated report index...');
      await this.generateConsolidatedIndex(results);

      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      console.log('\n=== Consolidated Report Generation Complete ===');
      console.log(`Duration: ${duration}s`);
      console.log(`Quality Score: ${summary.qualityScore || 0}%`);
      console.log(`Total Tests: ${summary.totalTests || 0}`);
      console.log(`Pass Rate: ${summary.overallPassRate || 0}%`);
      console.log(`Dashboard: ${results.dashboard.dashboardPath}`);
      console.log(`Reports Directory: ${this.consolidatedDir}`);

      return results;

    } catch (error) {
      console.error('Error generating consolidated reports:', error);
      throw error;
    }
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(metrics, summary) {
    const executiveSummary = {
      timestamp: new Date().toISOString(),
      period: this.getReportingPeriod(),
      overview: {
        qualityScore: summary.qualityScore || 0,
        totalTests: summary.totalTests || 0,
        passRate: summary.overallPassRate || 0,
        testTypes: Object.keys(summary.testTypes || {}).length,
        environments: this.getEnvironmentCount(metrics),
        browsers: this.getBrowserCount(metrics)
      },
      keyFindings: this.generateKeyFindings(summary),
      riskAssessment: this.generateRiskAssessment(summary),
      recommendations: summary.recommendations || [],
      nextSteps: this.generateNextSteps(summary),
      appendices: {
        detailedMetrics: 'Available in dashboard',
        testResults: 'Available in detailed reports',
        trendAnalysis: 'Available in trend reports'
      }
    };

    // Save executive summary
    const summaryPath = path.join(this.consolidatedDir, 'executive-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(executiveSummary, null, 2));

    // Generate executive summary HTML
    await this.generateExecutiveSummaryHTML(executiveSummary);

    return executiveSummary;
  }

  /**
   * Generate executive summary HTML report
   */
  async generateExecutiveSummaryHTML(summary) {
    const htmlPath = path.join(this.consolidatedDir, 'executive-summary.html');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Summary - QA Testing Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .section { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section h2 { color: #495057; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 3px solid #007bff; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .metric-card { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2.5rem; font-weight: bold; color: #007bff; margin-bottom: 0.5rem; }
        .metric-label { color: #6c757d; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .status-excellent { color: #28a745; border-left-color: #28a745; }
        .status-good { color: #17a2b8; border-left-color: #17a2b8; }
        .status-warning { color: #ffc107; border-left-color: #ffc107; }
        .status-critical { color: #dc3545; border-left-color: #dc3545; }
        .findings-list { list-style: none; }
        .findings-list li { padding: 1rem; margin-bottom: 1rem; border-left: 4px solid #e9ecef; background: #f8f9fa; border-radius: 0 8px 8px 0; }
        .findings-list li.positive { border-left-color: #28a745; background: #d4edda; }
        .findings-list li.negative { border-left-color: #dc3545; background: #f8d7da; }
        .findings-list li.neutral { border-left-color: #17a2b8; background: #d1ecf1; }
        .risk-matrix { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .risk-item { padding: 1rem; border-radius: 8px; border-left: 4px solid #6c757d; }
        .risk-high { border-left-color: #dc3545; background: #f8d7da; }
        .risk-medium { border-left-color: #ffc107; background: #fff3cd; }
        .risk-low { border-left-color: #28a745; background: #d4edda; }
        .recommendations { list-style: none; }
        .recommendations li { padding: 1rem; margin-bottom: 1rem; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3; }
        .priority-critical { border-left-color: #f44336; background: #ffebee; }
        .priority-high { border-left-color: #ff9800; background: #fff3e0; }
        .priority-medium { border-left-color: #2196f3; background: #e3f2fd; }
        .footer { text-align: center; padding: 2rem; color: #6c757d; border-top: 1px solid #dee2e6; margin-top: 2rem; }
        .chart-placeholder { height: 200px; background: #f8f9fa; border: 2px dashed #dee2e6; display: flex; align-items: center; justify-content: center; color: #6c757d; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Executive Summary</h1>
            <p>QA Testing Report • ${new Date(summary.timestamp).toLocaleDateString()}</p>
            <p>Reporting Period: ${summary.period}</p>
        </div>

        <div class="section">
            <h2>Quality Overview</h2>
            <div class="metrics-grid">
                <div class="metric-card ${this.getStatusClass(summary.overview.qualityScore)}">
                    <div class="metric-value">${summary.overview.qualityScore}%</div>
                    <div class="metric-label">Overall Quality Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.overview.totalTests}</div>
                    <div class="metric-label">Total Tests Executed</div>
                </div>
                <div class="metric-card ${this.getStatusClass(summary.overview.passRate)}">
                    <div class="metric-value">${summary.overview.passRate}%</div>
                    <div class="metric-label">Overall Pass Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.overview.testTypes}</div>
                    <div class="metric-label">Test Categories</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.overview.environments}</div>
                    <div class="metric-label">Environments Tested</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${summary.overview.browsers}</div>
                    <div class="metric-label">Browsers Covered</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Key Findings</h2>
            <ul class="findings-list">
                ${summary.keyFindings.map(finding => `
                    <li class="${finding.type}">
                        <strong>${finding.title}</strong><br>
                        ${finding.description}
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Risk Assessment</h2>
            <div class="risk-matrix">
                ${summary.riskAssessment.map(risk => `
                    <div class="risk-item risk-${risk.level}">
                        <h4>${risk.category}</h4>
                        <p><strong>Risk Level:</strong> ${risk.level.toUpperCase()}</p>
                        <p>${risk.description}</p>
                        <p><strong>Impact:</strong> ${risk.impact}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Recommendations</h2>
            <ul class="recommendations">
                ${summary.recommendations.map(rec => `
                    <li class="priority-${rec.priority || 'medium'}">
                        <strong>${rec.type ? rec.type.toUpperCase() : 'GENERAL'}</strong>: ${rec.message || rec}
                        ${rec.action ? `<br><em>Action: ${rec.action}</em>` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Next Steps</h2>
            <ul class="recommendations">
                ${summary.nextSteps.map(step => `
                    <li class="priority-${step.priority}">
                        <strong>${step.timeframe}</strong>: ${step.action}
                        ${step.owner ? `<br><em>Owner: ${step.owner}</em>` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Quality Trend</h2>
            <div class="chart-placeholder">
                Quality trend chart would be displayed here with historical data
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Generated by QA Testing Framework • ${new Date().toISOString()}</p>
        <p>For detailed metrics and analysis, see the <a href="../dashboard/index.html">Interactive Dashboard</a></p>
    </div>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);
    console.log(`Executive summary saved: ${htmlPath}`);
  }

  /**
   * Get status CSS class based on score
   */
  getStatusClass(score) {
    if (score >= 95) return 'status-excellent';
    if (score >= 80) return 'status-good';
    if (score >= 60) return 'status-warning';
    return 'status-critical';
  }

  /**
   * Generate key findings from summary
   */
  generateKeyFindings(summary) {
    const findings = [];

    // Quality score finding
    if (summary.qualityScore >= 90) {
      findings.push({
        type: 'positive',
        title: 'Excellent Quality Score',
        description: `Overall quality score of ${summary.qualityScore}% indicates high-quality software with minimal issues.`
      });
    } else if (summary.qualityScore < 70) {
      findings.push({
        type: 'negative',
        title: 'Quality Score Below Target',
        description: `Quality score of ${summary.qualityScore}% is below the target of 70%. Immediate attention required.`
      });
    }

    // Test coverage finding
    if (summary.totalTests > 100) {
      findings.push({
        type: 'positive',
        title: 'Comprehensive Test Coverage',
        description: `${summary.totalTests} tests executed across multiple categories ensuring thorough validation.`
      });
    }

    // Pass rate finding
    if (summary.overallPassRate >= 95) {
      findings.push({
        type: 'positive',
        title: 'High Test Pass Rate',
        description: `${summary.overallPassRate}% pass rate demonstrates stable and reliable functionality.`
      });
    } else if (summary.overallPassRate < 80) {
      findings.push({
        type: 'negative',
        title: 'Low Test Pass Rate',
        description: `${summary.overallPassRate}% pass rate indicates potential stability issues requiring investigation.`
      });
    }

    // Test type findings
    Object.entries(summary.testTypes || {}).forEach(([type, data]) => {
      if (data.status === 'critical') {
        findings.push({
          type: 'negative',
          title: `Critical Issues in ${type.toUpperCase()} Tests`,
          description: `${type} testing shows critical issues that need immediate attention.`
        });
      } else if (data.status === 'excellent') {
        findings.push({
          type: 'positive',
          title: `Excellent ${type.toUpperCase()} Test Results`,
          description: `${type} testing shows excellent results with high quality standards met.`
        });
      }
    });

    return findings;
  }

  /**
   * Generate risk assessment
   */
  generateRiskAssessment(summary) {
    const risks = [];

    // Quality risk
    if (summary.qualityScore < 70) {
      risks.push({
        category: 'Quality Risk',
        level: 'high',
        description: 'Low quality score indicates high risk of production issues',
        impact: 'Potential customer impact and reputation damage'
      });
    } else if (summary.qualityScore < 85) {
      risks.push({
        category: 'Quality Risk',
        level: 'medium',
        description: 'Moderate quality score suggests room for improvement',
        impact: 'Minor issues may surface in production'
      });
    } else {
      risks.push({
        category: 'Quality Risk',
        level: 'low',
        description: 'High quality score indicates low risk of issues',
        impact: 'Minimal risk of production problems'
      });
    }

    // Test coverage risk
    if (summary.totalTests < 50) {
      risks.push({
        category: 'Coverage Risk',
        level: 'high',
        description: 'Limited test coverage may miss critical issues',
        impact: 'Undetected bugs may reach production'
      });
    }

    // Security risk
    const securityScore = summary.testTypes?.security?.score || 0;
    if (securityScore < 80) {
      risks.push({
        category: 'Security Risk',
        level: 'high',
        description: 'Security vulnerabilities detected in testing',
        impact: 'Potential security breaches and data exposure'
      });
    }

    // Performance risk
    const performanceScore = summary.testTypes?.performance?.score || 0;
    if (performanceScore < 70) {
      risks.push({
        category: 'Performance Risk',
        level: 'medium',
        description: 'Performance issues may affect user experience',
        impact: 'Slow response times and poor user satisfaction'
      });
    }

    return risks;
  }

  /**
   * Generate next steps
   */
  generateNextSteps(summary) {
    const steps = [];

    // Immediate actions (1-3 days)
    if (summary.qualityScore < 70) {
      steps.push({
        timeframe: 'Immediate (1-3 days)',
        priority: 'critical',
        action: 'Address critical quality issues and failing tests',
        owner: 'Development Team'
      });
    }

    // Short term actions (1-2 weeks)
    if (summary.recommendations.length > 0) {
      steps.push({
        timeframe: 'Short Term (1-2 weeks)',
        priority: 'high',
        action: 'Implement high-priority recommendations from test analysis',
        owner: 'QA Team'
      });
    }

    // Medium term actions (1 month)
    steps.push({
      timeframe: 'Medium Term (1 month)',
      priority: 'medium',
      action: 'Enhance test coverage and automation framework',
      owner: 'QA Team'
    });

    // Long term actions (3 months)
    steps.push({
      timeframe: 'Long Term (3 months)',
      priority: 'low',
      action: 'Implement continuous quality monitoring and reporting',
      owner: 'DevOps Team'
    });

    return steps;
  }

  /**
   * Generate trend analysis
   */
  async generateTrendAnalysis(metrics) {
    const trendAnalysis = {
      timestamp: new Date().toISOString(),
      period: '30 days',
      trends: {
        quality: { direction: 'stable', change: 0 },
        passRate: { direction: 'stable', change: 0 },
        coverage: { direction: 'stable', change: 0 },
        performance: { direction: 'stable', change: 0 }
      },
      insights: [],
      predictions: []
    };

    // This would analyze historical data to generate trends
    // For now, return basic structure

    const trendPath = path.join(this.consolidatedDir, 'trend-analysis.json');
    fs.writeFileSync(trendPath, JSON.stringify(trendAnalysis, null, 2));

    return trendAnalysis;
  }

  /**
   * Generate consolidated index page
   */
  async generateConsolidatedIndex(results) {
    const indexPath = path.join(this.consolidatedDir, 'index.html');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Testing Reports - Consolidated View</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem 0; text-align: center; }
        .header h1 { font-size: 3rem; margin-bottom: 1rem; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .report-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .report-card:hover { transform: translateY(-4px); }
        .report-icon { font-size: 3rem; margin-bottom: 1rem; }
        .report-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: #495057; }
        .report-description { color: #6c757d; margin-bottom: 1.5rem; line-height: 1.6; }
        .report-link { display: inline-block; background: #007bff; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background 0.3s; }
        .report-link:hover { background: #0056b3; }
        .stats { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .stat-item { text-align: center; }
        .stat-value { font-size: 2.5rem; font-weight: bold; color: #007bff; margin-bottom: 0.5rem; }
        .stat-label { color: #6c757d; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .footer { text-align: center; padding: 2rem; color: #6c757d; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>QA Testing Reports</h1>
        <p>Comprehensive Quality Assurance Dashboard and Reports</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="container">
        <div class="stats">
            <h2 style="text-align: center; margin-bottom: 2rem; color: #495057;">Quality Overview</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${results.metrics?.summary?.qualityScore || 0}%</div>
                    <div class="stat-label">Quality Score</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${results.metrics?.summary?.totalTests || 0}</div>
                    <div class="stat-label">Total Tests</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${results.metrics?.summary?.overallPassRate || 0}%</div>
                    <div class="stat-label">Pass Rate</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${results.metrics?.summary?.recommendations?.length || 0}</div>
                    <div class="stat-label">Recommendations</div>
                </div>
            </div>
        </div>

        <div class="reports-grid">
            <div class="report-card">
                <div class="report-icon">📊</div>
                <div class="report-title">Interactive Dashboard</div>
                <div class="report-description">
                    Real-time quality metrics with interactive charts and visualizations. 
                    Monitor test results, performance metrics, and quality trends.
                </div>
                <a href="../dashboard/index.html" class="report-link">View Dashboard</a>
            </div>

            <div class="report-card">
                <div class="report-icon">📋</div>
                <div class="report-title">Executive Summary</div>
                <div class="report-description">
                    High-level overview of quality metrics, key findings, risk assessment, 
                    and strategic recommendations for stakeholders.
                </div>
                <a href="executive-summary.html" class="report-link">View Summary</a>
            </div>

            <div class="report-card">
                <div class="report-icon">📈</div>
                <div class="report-title">Detailed Test Reports</div>
                <div class="report-description">
                    Comprehensive test execution reports with screenshots, videos, 
                    and detailed analysis of test results across environments.
                </div>
                <a href="../comprehensive/index.html" class="report-link">View Reports</a>
            </div>

            <div class="report-card">
                <div class="report-icon">📊</div>
                <div class="report-title">Metrics & Analytics</div>
                <div class="report-description">
                    Deep dive into test metrics, code quality analysis, coverage reports, 
                    and performance analytics with historical trends.
                </div>
                <a href="../metrics/latest-metrics.json" class="report-link">View Metrics</a>
            </div>

            <div class="report-card">
                <div class="report-icon">🔍</div>
                <div class="report-title">Trend Analysis</div>
                <div class="report-description">
                    Historical analysis of quality trends, performance patterns, 
                    and predictive insights for continuous improvement.
                </div>
                <a href="trend-analysis.json" class="report-link">View Trends</a>
            </div>

            <div class="report-card">
                <div class="report-icon">⚡</div>
                <div class="report-title">Performance Reports</div>
                <div class="report-description">
                    Load testing results, performance benchmarks, and system 
                    performance analysis across different scenarios.
                </div>
                <a href="../performance-tests/index.html" class="report-link">View Performance</a>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Generated by QA Testing Framework • ${new Date().toISOString()}</p>
        <p>For questions or support, contact the QA Team</p>
    </div>
</body>
</html>`;

    fs.writeFileSync(indexPath, html);
    console.log(`Consolidated index saved: ${indexPath}`);
  }

  /**
   * Get reporting period
   */
  getReportingPeriod() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    return `${thirtyDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
  }

  /**
   * Get environment count from metrics
   */
  getEnvironmentCount(metrics) {
    const environments = new Set();
    
    // Extract environments from different test types
    if (metrics.testExecution?.ui?.environments) {
      Object.keys(metrics.testExecution.ui.environments).forEach(env => environments.add(env));
    }
    
    if (metrics.testExecution?.api?.environments) {
      Object.keys(metrics.testExecution.api.environments).forEach(env => environments.add(env));
    }
    
    return environments.size || 1;
  }

  /**
   * Get browser count from metrics
   */
  getBrowserCount(metrics) {
    const browsers = new Set();
    
    if (metrics.testExecution?.ui?.browsers) {
      Object.keys(metrics.testExecution.ui.browsers).forEach(browser => browsers.add(browser));
    }
    
    return browsers.size || 1;
  }

  /**
   * Run consolidated reporting
   */
  async run() {
    try {
      const results = await this.generateAllReports();
      
      console.log('\n🎉 Consolidated reporting completed successfully!');
      console.log('\nGenerated Reports:');
      console.log(`📊 Interactive Dashboard: ${results.dashboard.dashboardPath}`);
      console.log(`📋 Executive Summary: ${path.join(this.consolidatedDir, 'executive-summary.html')}`);
      console.log(`📈 Consolidated Index: ${path.join(this.consolidatedDir, 'index.html')}`);
      console.log(`📊 Metrics Data: ${path.join(this.baseDir, 'reports/metrics/latest-metrics.json')}`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Consolidated reporting failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Consolidated Test Reporter

Usage: node scripts/reporting/consolidated-reporter.js [OPTIONS]

Options:
  --help, -h            Show this help message

This tool generates:
  • Interactive quality dashboard
  • Executive summary report
  • Comprehensive test metrics
  • Trend analysis
  • Consolidated report index

Examples:
  node scripts/reporting/consolidated-reporter.js
`);
    process.exit(0);
  }
  
  const reporter = new ConsolidatedReporter();
  
  reporter.run()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Consolidated reporting failed:', error);
      process.exit(1);
    });
}

module.exports = ConsolidatedReporter;