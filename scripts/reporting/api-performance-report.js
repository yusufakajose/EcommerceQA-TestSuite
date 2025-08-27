/**
 * API Performance Report Generator
 * Generates comprehensive reports for API performance and backend monitoring
 */

const fs = require('fs');
const path = require('path');

class ApiPerformanceReportGenerator {
  constructor() {
    this.reportData = {
      timestamp: new Date().toISOString(),
      apiTests: [],
      backendMetrics: {},
      performanceBaselines: {
        singleResource: 300,
        multipleResources: 500,
        createOperation: 600,
        updateOperation: 600,
        deleteOperation: 400,
        largeDataset: 1000,
        concurrentLoad: 1000,
        errorHandling: 300,
      },
      recommendations: [],
    };
  }

  /**
   * Generate comprehensive API performance report
   */
  async generateReport() {
    console.log('🚀 Generating API Performance Report...');

    // Generate mock API performance data
    this.generateMockApiData();

    // Calculate backend metrics
    this.calculateBackendMetrics();

    // Generate recommendations
    this.generateApiRecommendations();

    // Generate reports
    await this.generateHTMLReport();
    await this.generateApiJSON();

    console.log('✅ API Performance Report Generated Successfully!');
    console.log(`📄 HTML Report: reports/api-performance-report.html`);
    console.log(`📊 API Data: reports/api-performance-data.json`);
  }

  /**
   * Generate mock API performance data
   */
  generateMockApiData() {
    this.reportData.apiTests = [
      {
        testSuite: 'API Performance Tests',
        tests: [
          {
            name: 'GET /posts',
            duration: 245,
            status: 200,
            responseSize: 15420,
            threshold: 500,
            passed: true,
            category: 'READ_MULTIPLE',
          },
          {
            name: 'GET /users',
            duration: 189,
            status: 200,
            responseSize: 5240,
            threshold: 500,
            passed: true,
            category: 'READ_MULTIPLE',
          },
          {
            name: 'POST /posts',
            duration: 456,
            status: 201,
            responseSize: 156,
            threshold: 600,
            passed: true,
            category: 'CREATE',
          },
          {
            name: 'PUT /posts/1',
            duration: 423,
            status: 200,
            responseSize: 142,
            threshold: 600,
            passed: true,
            category: 'UPDATE',
          },
          {
            name: 'DELETE /posts/1',
            duration: 234,
            status: 200,
            responseSize: 0,
            threshold: 400,
            passed: true,
            category: 'DELETE',
          },
        ],
      },
      {
        testSuite: 'Backend Monitoring Tests',
        tests: [
          {
            name: 'Health Check - Single Resource',
            duration: 167,
            status: 200,
            responseSize: 292,
            threshold: 300,
            passed: true,
            category: 'HEALTH_CHECK',
          },
          {
            name: 'Load Test - 10 Concurrent Users',
            duration: 892,
            status: 200,
            responseSize: 45600,
            threshold: 1000,
            passed: true,
            category: 'LOAD_TEST',
          },
          {
            name: 'Error Handling - 404',
            duration: 123,
            status: 404,
            responseSize: 0,
            threshold: 300,
            passed: true,
            category: 'ERROR_HANDLING',
          },
          {
            name: 'Large Dataset - Comments',
            duration: 756,
            status: 200,
            responseSize: 125000,
            threshold: 1000,
            passed: true,
            category: 'LARGE_DATASET',
          },
        ],
      },
    ];
  }

  /**
   * Calculate backend performance metrics
   */
  calculateBackendMetrics() {
    const allTests = this.reportData.apiTests.flatMap((suite) => suite.tests);

    // Group by category
    const categories = {};
    allTests.forEach((test) => {
      if (!categories[test.category]) {
        categories[test.category] = [];
      }
      categories[test.category].push(test);
    });

    // Calculate metrics for each category
    this.reportData.backendMetrics = {
      overall: this.calculateMetricsForTests(allTests),
      byCategory: {},
    };

    Object.entries(categories).forEach(([category, tests]) => {
      this.reportData.backendMetrics.byCategory[category] = this.calculateMetricsForTests(tests);
    });

    // Calculate additional backend-specific metrics
    this.reportData.backendMetrics.throughput = this.calculateThroughput(allTests);
    this.reportData.backendMetrics.reliability = this.calculateReliability(allTests);
    this.reportData.backendMetrics.efficiency = this.calculateEfficiency(allTests);
  }

  /**
   * Calculate metrics for a set of tests
   */
  calculateMetricsForTests(tests) {
    const durations = tests.map((t) => t.duration);
    const responseSizes = tests.map((t) => t.responseSize);

    return {
      count: tests.length,
      averageDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      successRate: ((tests.filter((t) => t.passed).length / tests.length) * 100).toFixed(1),
      averageResponseSize: Math.round(
        responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length
      ),
      totalDataTransferred: responseSizes.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Calculate throughput metrics
   */
  calculateThroughput(tests) {
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);
    const totalRequests = tests.length;
    const totalDataTransferred = tests.reduce((sum, test) => sum + test.responseSize, 0);

    return {
      requestsPerSecond: Math.round((totalRequests / totalDuration) * 1000),
      bytesPerSecond: Math.round((totalDataTransferred / totalDuration) * 1000),
      averageRequestsPerSecond: Math.round(totalRequests / (totalDuration / 1000)),
    };
  }

  /**
   * Calculate reliability metrics
   */
  calculateReliability(tests) {
    const successfulTests = tests.filter((t) => t.passed);
    const errorTests = tests.filter((t) => t.status >= 400 && t.status < 500);
    const serverErrorTests = tests.filter((t) => t.status >= 500);

    return {
      successRate: ((successfulTests.length / tests.length) * 100).toFixed(2),
      errorRate: ((errorTests.length / tests.length) * 100).toFixed(2),
      serverErrorRate: ((serverErrorTests.length / tests.length) * 100).toFixed(2),
      availability: (((tests.length - serverErrorTests.length) / tests.length) * 100).toFixed(2),
    };
  }

  /**
   * Calculate efficiency metrics
   */
  calculateEfficiency(tests) {
    const validTests = tests.filter((t) => t.responseSize > 0);
    const efficiencyScores = validTests.map((t) => t.responseSize / t.duration);

    return {
      averageBytesPerMs: Math.round(
        efficiencyScores.reduce((a, b) => a + b, 0) / efficiencyScores.length
      ),
      bestEfficiency: Math.round(Math.max(...efficiencyScores)),
      worstEfficiency: Math.round(Math.min(...efficiencyScores)),
      efficiencyVariance: this.calculateVariance(efficiencyScores),
    };
  }

  /**
   * Generate API performance recommendations
   */
  generateApiRecommendations() {
    const recommendations = [];
    const metrics = this.reportData.backendMetrics.overall;

    if (parseFloat(metrics.successRate) < 95) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Reliability',
        issue: `API success rate is ${metrics.successRate}% (below 95% threshold)`,
        recommendation: 'Investigate failing API endpoints and implement proper error handling',
        impact: 'Critical impact on user experience and system reliability',
      });
    }

    if (metrics.p95Duration > 1000) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: `95th percentile response time is ${metrics.p95Duration}ms`,
        recommendation:
          'Optimize slow API endpoints, consider caching, and review database queries',
        impact: 'Performance degradation affecting user experience',
      });
    }

    if (this.reportData.backendMetrics.throughput.requestsPerSecond < 10) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Scalability',
        issue: `Low throughput: ${this.reportData.backendMetrics.throughput.requestsPerSecond} requests/second`,
        recommendation:
          'Consider implementing connection pooling, load balancing, or horizontal scaling',
        impact: 'Limited system capacity under load',
      });
    }

    // Category-specific recommendations
    Object.entries(this.reportData.backendMetrics.byCategory).forEach(
      ([category, categoryMetrics]) => {
        const baseline = this.getCategoryBaseline(category);
        if (baseline && categoryMetrics.averageDuration > baseline) {
          recommendations.push({
            priority: 'LOW',
            category: 'Category Performance',
            issue: `${category} operations averaging ${categoryMetrics.averageDuration}ms (baseline: ${baseline}ms)`,
            recommendation: `Optimize ${category.toLowerCase()} operations specifically`,
            impact: 'Category-specific performance improvement opportunity',
          });
        }
      }
    );

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'General',
        issue: 'All API performance metrics are within acceptable ranges',
        recommendation: 'Continue monitoring and maintain current performance levels',
        impact: 'Excellent API performance maintained',
      });
    }

    this.reportData.recommendations = recommendations;
  }

  /**
   * Get baseline for category
   */
  getCategoryBaseline(category) {
    const baselines = {
      READ_MULTIPLE: 500,
      CREATE: 600,
      UPDATE: 600,
      DELETE: 400,
      HEALTH_CHECK: 300,
      LOAD_TEST: 1000,
      ERROR_HANDLING: 300,
      LARGE_DATASET: 1000,
    };
    return baselines[category];
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport() {
    const html = this.generateApiHTML();
    const reportPath = path.join('reports', 'api-performance-report.html');

    await fs.promises.mkdir('reports', { recursive: true });
    await fs.promises.writeFile(reportPath, html);
  }

  /**
   * Generate API performance HTML
   */
  generateApiHTML() {
    const data = this.reportData;
    const metrics = data.backendMetrics.overall;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Performance & Backend Monitoring Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f1f5f9; color: #334155; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .metrics-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .metric-card h3 { color: #7c3aed; margin-bottom: 15px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1e293b; }
        .metric-label { font-size: 0.9em; color: #64748b; margin-top: 5px; }
        .charts-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .chart-container { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .test-results { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .test-suite { margin-bottom: 25px; }
        .test-suite h3 { color: #7c3aed; margin-bottom: 15px; }
        .test-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-left: 4px solid #10b981; background: #f8fafc; margin-bottom: 8px; border-radius: 6px; }
        .test-item.failed { border-left-color: #ef4444; background: #fef2f2; }
        .test-name { font-weight: 500; }
        .test-metrics { display: flex; gap: 15px; font-size: 0.9em; color: #64748b; }
        .recommendations { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .recommendation { padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 15px; background: #f8fafc; border-radius: 8px; }
        .recommendation.high { border-left-color: #ef4444; background: #fef2f2; }
        .recommendation.medium { border-left-color: #f59e0b; background: #fffbeb; }
        .rec-priority { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; color: white; margin-bottom: 8px; }
        .rec-priority.high { background: #ef4444; }
        .rec-priority.medium { background: #f59e0b; }
        .rec-priority.low { background: #10b981; }
        @media (max-width: 768px) {
            .charts-section { grid-template-columns: 1fr; }
            .metrics-overview { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 API Performance & Backend Monitoring</h1>
            <p>Comprehensive Backend Performance Analysis</p>
            <p><small>Generated: ${new Date().toLocaleString()}</small></p>
        </div>

        <div class="metrics-overview">
            <div class="metric-card">
                <h3>Average Response Time</h3>
                <div class="metric-value">${metrics.averageDuration}ms</div>
                <div class="metric-label">Across all API calls</div>
            </div>
            <div class="metric-card">
                <h3>Success Rate</h3>
                <div class="metric-value">${metrics.successRate}%</div>
                <div class="metric-label">API reliability</div>
            </div>
            <div class="metric-card">
                <h3>Throughput</h3>
                <div class="metric-value">${data.backendMetrics.throughput.requestsPerSecond}</div>
                <div class="metric-label">Requests per second</div>
            </div>
            <div class="metric-card">
                <h3>95th Percentile</h3>
                <div class="metric-value">${metrics.p95Duration}ms</div>
                <div class="metric-label">Response time</div>
            </div>
            <div class="metric-card">
                <h3>Data Transfer</h3>
                <div class="metric-value">${Math.round(metrics.totalDataTransferred / 1024)}KB</div>
                <div class="metric-label">Total transferred</div>
            </div>
            <div class="metric-card">
                <h3>Availability</h3>
                <div class="metric-value">${data.backendMetrics.reliability.availability}%</div>
                <div class="metric-label">System uptime</div>
            </div>
        </div>

        <div class="charts-section">
            <div class="chart-container">
                <h3>📊 Response Time Distribution</h3>
                <canvas id="responseTimeChart" width="400" height="300"></canvas>
            </div>
            <div class="chart-container">
                <h3>🎯 Performance by Category</h3>
                <canvas id="categoryChart" width="400" height="300"></canvas>
            </div>
        </div>

        <div class="test-results">
            <h2>🧪 Test Results</h2>
            ${data.apiTests
              .map(
                (suite) => `
                <div class="test-suite">
                    <h3>${suite.testSuite}</h3>
                    ${suite.tests
                      .map(
                        (test) => `
                        <div class="test-item ${test.passed ? '' : 'failed'}">
                            <div class="test-name">${test.name}</div>
                            <div class="test-metrics">
                                <span>${test.duration}ms</span>
                                <span>${test.status}</span>
                                <span>${Math.round(test.responseSize / 1024)}KB</span>
                                <span>${test.passed ? '✅' : '❌'}</span>
                            </div>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            `
              )
              .join('')}
        </div>

        <div class="recommendations">
            <h2>💡 Performance Recommendations</h2>
            ${data.recommendations
              .map(
                (rec) => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <div class="rec-priority ${rec.priority.toLowerCase()}">${rec.priority}</div>
                    <div><strong>${rec.category}:</strong> ${rec.issue}</div>
                    <div><strong>Recommendation:</strong> ${rec.recommendation}</div>
                    <div><strong>Impact:</strong> ${rec.impact}</div>
                </div>
            `
              )
              .join('')}
        </div>
    </div>

    <script>
        // Response Time Distribution Chart
        const responseCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseCtx, {
            type: 'bar',
            data: {
                labels: ['Min', 'Average', '95th %ile', '99th %ile', 'Max'],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [${metrics.minDuration}, ${metrics.averageDuration}, ${metrics.p95Duration}, ${metrics.p99Duration}, ${metrics.maxDuration}],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#7c3aed'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });

        // Category Performance Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [${Object.keys(data.backendMetrics.byCategory)
                  .map((k) => `'${k}'`)
                  .join(', ')}],
                datasets: [{
                    data: [${Object.values(data.backendMetrics.byCategory)
                      .map((v) => v.averageDuration)
                      .join(', ')}],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4', '#84cc16']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Generate API performance JSON
   */
  async generateApiJSON() {
    const jsonPath = path.join('reports', 'api-performance-data.json');
    await fs.promises.writeFile(jsonPath, JSON.stringify(this.reportData, null, 2));
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Calculate variance
   */
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.round(variance);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ApiPerformanceReportGenerator();
  generator.generateReport().catch(console.error);
}

module.exports = ApiPerformanceReportGenerator;
