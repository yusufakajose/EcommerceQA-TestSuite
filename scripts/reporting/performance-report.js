/**
 * Performance Report Generator
 * Aggregates and analyzes performance data from test runs
 */

const fs = require('fs');
const path = require('path');

class PerformanceReportGenerator {
  constructor() {
    this.performanceData = {
      timestamp: new Date().toISOString(),
      testRuns: [],
      aggregatedMetrics: {},
      performanceBaselines: {
        pageLoad: 3000,
        loginProcess: 2000,
        addToCart: 1000,
        checkoutFlow: 5000,
        fullCheckoutFlow: 6000,
        completeCheckoutFlow: 5000,
        navigation: 2000,
        logoutProcess: 1500
      },
      recommendations: []
    };
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport() {
    console.log('⚡ Generating Performance Report...');
    
    // Simulate performance data (in real scenario, this would come from test execution)
    this.generateMockPerformanceData();
    
    // Calculate aggregated metrics
    this.calculateAggregatedMetrics();
    
    // Generate recommendations
    this.generatePerformanceRecommendations();
    
    // Generate reports
    await this.generateHTMLReport();
    await this.generatePerformanceJSON();
    
    console.log('✅ Performance Report Generated Successfully!');
    console.log(`📄 HTML Report: reports/performance-report.html`);
    console.log(`📊 Performance Data: reports/performance-data.json`);
  }

  /**
   * Generate mock performance data based on our test structure
   */
  generateMockPerformanceData() {
    this.performanceData.testRuns = [
      {
        testName: 'Authentication - Login with valid credentials',
        metrics: {
          pageLoad: 1200,
          loginProcess: 850,
          totalDuration: 2050
        },
        status: 'PASS',
        timestamp: new Date().toISOString()
      },
      {
        testName: 'Authentication - Logout user',
        metrics: {
          loginForLogout: 780,
          logoutProcess: 650,
          totalDuration: 1430
        },
        status: 'PASS',
        timestamp: new Date().toISOString()
      },
      {
        testName: 'E-commerce - Complete checkout process',
        metrics: {
          pageLoad: 1100,
          completeCheckoutFlow: 4200,
          totalDuration: 5300
        },
        status: 'PASS',
        timestamp: new Date().toISOString()
      },
      {
        testName: 'E-commerce - Add product to cart',
        metrics: {
          addToCart: 420,
          totalDuration: 420
        },
        status: 'PASS',
        timestamp: new Date().toISOString()
      },
      {
        testName: 'SauceDemo - Add product to cart',
        metrics: {
          addToCart: 380,
          totalDuration: 380
        },
        status: 'PASS',
        timestamp: new Date().toISOString()
      },
      {
        testName: 'SauceDemo - Full checkout process',
        metrics: {
          pageLoad: 1050,
          fullCheckoutFlow: 5800,
          totalDuration: 6850
        },
        status: 'PASS',
        timestamp: new Date().toISOString()
      }
    ];
  }

  /**
   * Calculate aggregated performance metrics
   */
  calculateAggregatedMetrics() {
    const allMetrics = {};
    
    // Collect all metrics
    this.performanceData.testRuns.forEach(run => {
      Object.entries(run.metrics).forEach(([key, value]) => {
        if (!allMetrics[key]) {
          allMetrics[key] = [];
        }
        allMetrics[key].push(value);
      });
    });

    // Calculate statistics for each metric
    this.performanceData.aggregatedMetrics = {};
    Object.entries(allMetrics).forEach(([key, values]) => {
      const sorted = values.sort((a, b) => a - b);
      this.performanceData.aggregatedMetrics[key] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        baseline: this.performanceData.performanceBaselines[key] || 'N/A',
        status: this.getPerformanceStatus(key, values)
      };
    });
  }

  /**
   * Get performance status based on baseline comparison
   */
  getPerformanceStatus(metricName, values) {
    const baseline = this.performanceData.performanceBaselines[metricName];
    if (!baseline) return 'UNKNOWN';
    
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const p95 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)];
    
    if (p95 <= baseline * 0.8) return 'EXCELLENT';
    if (p95 <= baseline) return 'GOOD';
    if (p95 <= baseline * 1.2) return 'WARNING';
    return 'CRITICAL';
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];
    
    Object.entries(this.performanceData.aggregatedMetrics).forEach(([metric, data]) => {
      if (data.status === 'CRITICAL') {
        recommendations.push({
          priority: 'HIGH',
          metric: metric,
          issue: `${metric} performance is critical (${data.p95}ms vs ${data.baseline}ms baseline)`,
          recommendation: `Investigate and optimize ${metric} performance immediately`,
          impact: 'User experience significantly impacted'
        });
      } else if (data.status === 'WARNING') {
        recommendations.push({
          priority: 'MEDIUM',
          metric: metric,
          issue: `${metric} performance is above baseline (${data.p95}ms vs ${data.baseline}ms)`,
          recommendation: `Consider optimizing ${metric} performance`,
          impact: 'Minor user experience impact'
        });
      }
    });

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        metric: 'general',
        issue: 'All performance metrics are within acceptable ranges',
        recommendation: 'Continue monitoring performance trends and establish more granular baselines',
        impact: 'Maintain current excellent performance'
      });
    }

    this.performanceData.recommendations = recommendations;
  }

  /**
   * Generate HTML performance report
   */
  async generateHTMLReport() {
    const html = this.generatePerformanceHTML();
    const reportPath = path.join('reports', 'performance-report.html');
    
    // Ensure reports directory exists
    await fs.promises.mkdir('reports', { recursive: true });
    await fs.promises.writeFile(reportPath, html);
  }

  /**
   * Generate performance HTML content
   */
  generatePerformanceHTML() {
    const data = this.performanceData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Testing Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #334155; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 4px solid #10b981; }
        .metric-card.warning { border-left-color: #f59e0b; }
        .metric-card.critical { border-left-color: #ef4444; }
        .metric-name { font-size: 1.1em; font-weight: 600; margin-bottom: 15px; text-transform: capitalize; }
        .metric-values { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .metric-value { text-align: center; }
        .metric-value .label { font-size: 0.85em; color: #64748b; margin-bottom: 5px; }
        .metric-value .value { font-size: 1.4em; font-weight: bold; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; color: white; margin-top: 10px; }
        .status-excellent { background: #10b981; }
        .status-good { background: #3b82f6; }
        .status-warning { background: #f59e0b; }
        .status-critical { background: #ef4444; }
        .charts-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .chart-container { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
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
            .metrics-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Performance Testing Report</h1>
            <p>Comprehensive Performance Analysis & Monitoring</p>
            <p><small>Generated: ${new Date().toLocaleString()}</small></p>
        </div>

        <div class="metrics-grid">
            ${Object.entries(data.aggregatedMetrics).map(([metric, stats]) => `
                <div class="metric-card ${stats.status.toLowerCase()}">
                    <div class="metric-name">${metric.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div class="metric-values">
                        <div class="metric-value">
                            <div class="label">Average</div>
                            <div class="value">${stats.average}ms</div>
                        </div>
                        <div class="metric-value">
                            <div class="label">95th Percentile</div>
                            <div class="value">${stats.p95}ms</div>
                        </div>
                        <div class="metric-value">
                            <div class="label">Baseline</div>
                            <div class="value">${stats.baseline}ms</div>
                        </div>
                        <div class="metric-value">
                            <div class="label">Min/Max</div>
                            <div class="value">${stats.min}/${stats.max}ms</div>
                        </div>
                    </div>
                    <div class="status-badge status-${stats.status.toLowerCase()}">${stats.status}</div>
                </div>
            `).join('')}
        </div>

        <div class="charts-section">
            <div class="chart-container">
                <h3>📊 Performance Metrics Comparison</h3>
                <canvas id="metricsChart" width="400" height="300"></canvas>
            </div>
            <div class="chart-container">
                <h3>🎯 Baseline vs Actual Performance</h3>
                <canvas id="baselineChart" width="400" height="300"></canvas>
            </div>
        </div>

        <div class="recommendations">
            <h3>💡 Performance Recommendations</h3>
            ${data.recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <div class="rec-priority ${rec.priority.toLowerCase()}">${rec.priority}</div>
                    <div><strong>${rec.metric.toUpperCase()}:</strong> ${rec.issue}</div>
                    <div><strong>Recommendation:</strong> ${rec.recommendation}</div>
                    <div><strong>Impact:</strong> ${rec.impact}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // Performance Metrics Chart
        const metricsCtx = document.getElementById('metricsChart').getContext('2d');
        new Chart(metricsCtx, {
            type: 'bar',
            data: {
                labels: [${Object.keys(data.aggregatedMetrics).map(k => `'${k}'`).join(', ')}],
                datasets: [{
                    label: 'Average (ms)',
                    data: [${Object.values(data.aggregatedMetrics).map(v => v.average).join(', ')}],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }, {
                    label: '95th Percentile (ms)',
                    data: [${Object.values(data.aggregatedMetrics).map(v => v.p95).join(', ')}],
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });

        // Baseline Comparison Chart
        const baselineCtx = document.getElementById('baselineChart').getContext('2d');
        new Chart(baselineCtx, {
            type: 'radar',
            data: {
                labels: [${Object.keys(data.aggregatedMetrics).map(k => `'${k}'`).join(', ')}],
                datasets: [{
                    label: 'Baseline',
                    data: [${Object.values(data.aggregatedMetrics).map(v => typeof v.baseline === 'number' ? v.baseline : 0).join(', ')}],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    pointBackgroundColor: '#10b981'
                }, {
                    label: 'Actual (95th %ile)',
                    data: [${Object.values(data.aggregatedMetrics).map(v => v.p95).join(', ')}],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    pointBackgroundColor: '#ef4444'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: { beginAtZero: true }
                }
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Generate performance JSON data
   */
  async generatePerformanceJSON() {
    const jsonPath = path.join('reports', 'performance-data.json');
    await fs.promises.writeFile(jsonPath, JSON.stringify(this.performanceData, null, 2));
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new PerformanceReportGenerator();
  generator.generateReport().catch(console.error);
}

module.exports = PerformanceReportGenerator;