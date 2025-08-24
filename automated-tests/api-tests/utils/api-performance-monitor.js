/**
 * API Performance Monitor
 * Comprehensive performance monitoring for API calls
 */

class ApiPerformanceMonitor {
  constructor() {
    this.measurements = [];
    this.thresholds = {
      fast: 200,      // < 200ms is fast
      acceptable: 500, // < 500ms is acceptable
      slow: 1000,     // < 1000ms is slow
      critical: 2000  // > 2000ms is critical
    };
    this.startTime = Date.now();
  }

  /**
   * Measure API call performance
   */
  async measureApiCall(apiCallFunction, operationName, threshold = 1000) {
    const startTime = Date.now();
    const startHrTime = process.hrtime.bigint();
    
    try {
      const response = await apiCallFunction();
      const endTime = Date.now();
      const endHrTime = process.hrtime.bigint();
      
      const duration = endTime - startTime;
      const precisionDuration = Number(endHrTime - startHrTime) / 1000000; // Convert to milliseconds
      
      const measurement = {
        operationName,
        duration,
        precisionDuration,
        threshold,
        status: response.status ? response.status() : 'unknown',
        timestamp: new Date().toISOString(),
        passed: duration <= threshold,
        performanceCategory: this.categorizePerformance(duration)
      };

      this.measurements.push(measurement);
      
      // Log performance warning if threshold exceeded
      if (duration > threshold) {
        console.warn(`⚠️ Performance Warning: ${operationName} took ${duration}ms (threshold: ${threshold}ms)`);
      }

      return measurement;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const measurement = {
        operationName,
        duration,
        threshold,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        passed: false,
        performanceCategory: 'error'
      };

      this.measurements.push(measurement);
      throw error;
    }
  }

  /**
   * Measure API call with response size analysis
   */
  async measureApiCallWithSize(apiCallFunction, operationName, threshold = 1000) {
    const startTime = Date.now();
    
    try {
      const response = await apiCallFunction();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Get response size
      const responseText = await response.text();
      const responseSize = new Blob([responseText]).size;
      
      const measurement = {
        operationName,
        duration,
        threshold,
        status: response.status(),
        responseSize,
        timestamp: new Date().toISOString(),
        passed: duration <= threshold,
        performanceCategory: this.categorizePerformance(duration),
        bytesPerMs: responseSize / duration
      };

      this.measurements.push(measurement);
      return measurement;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const measurement = {
        operationName,
        duration,
        threshold,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        passed: false,
        performanceCategory: 'error'
      };

      this.measurements.push(measurement);
      throw error;
    }
  }

  /**
   * Categorize performance based on duration
   */
  categorizePerformance(duration) {
    if (duration <= this.thresholds.fast) return 'EXCELLENT';
    if (duration <= this.thresholds.acceptable) return 'GOOD';
    if (duration <= this.thresholds.slow) return 'ACCEPTABLE';
    if (duration <= this.thresholds.critical) return 'SLOW';
    return 'CRITICAL';
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    if (this.measurements.length === 0) {
      return { message: 'No measurements recorded' };
    }

    const durations = this.measurements.map(m => m.duration);
    const passedTests = this.measurements.filter(m => m.passed).length;
    
    return {
      totalMeasurements: this.measurements.length,
      passedThresholds: passedTests,
      failedThresholds: this.measurements.length - passedTests,
      averageDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      medianDuration: this.calculateMedian(durations),
      p95Duration: this.calculatePercentile(durations, 95),
      performanceDistribution: this.getPerformanceDistribution()
    };
  }

  /**
   * Generate detailed performance report
   */
  generateDetailedReport() {
    const summary = this.generateSummary();
    
    return {
      summary,
      measurements: this.measurements,
      recommendations: this.generateRecommendations(),
      performanceAnalysis: this.analyzePerformanceTrends()
    };
  }

  /**
   * Analyze size/performance correlation
   */
  analyzeSizePerformanceCorrelation() {
    const measurementsWithSize = this.measurements.filter(m => m.responseSize);
    
    if (measurementsWithSize.length === 0) {
      return { message: 'No size measurements available' };
    }

    const avgBytesPerMs = measurementsWithSize.reduce((sum, m) => sum + m.bytesPerMs, 0) / measurementsWithSize.length;
    const totalBytes = measurementsWithSize.reduce((sum, m) => sum + m.responseSize, 0);
    const totalDuration = measurementsWithSize.reduce((sum, m) => sum + m.duration, 0);

    return {
      averageBytesPerMs: Math.round(avgBytesPerMs),
      totalBytesTransferred: totalBytes,
      totalDuration,
      throughput: Math.round(totalBytes / totalDuration * 1000), // bytes per second
      measurements: measurementsWithSize.map(m => ({
        operation: m.operationName,
        size: m.responseSize,
        duration: m.duration,
        bytesPerMs: Math.round(m.bytesPerMs)
      }))
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateSummary();
    
    if (summary.failedThresholds > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: `${summary.failedThresholds} API calls exceeded performance thresholds`,
        recommendation: 'Investigate slow API endpoints and optimize backend performance',
        impact: 'User experience degradation'
      });
    }

    if (summary.p95Duration > 1000) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `95th percentile response time is ${summary.p95Duration}ms`,
        recommendation: 'Consider implementing caching or optimizing database queries',
        impact: 'Potential user experience issues for some requests'
      });
    }

    if (summary.maxDuration > 2000) {
      recommendations.push({
        priority: 'HIGH',
        issue: `Maximum response time is ${summary.maxDuration}ms`,
        recommendation: 'Identify and optimize the slowest API endpoint immediately',
        impact: 'Severe user experience impact'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        issue: 'All API performance metrics are within acceptable ranges',
        recommendation: 'Continue monitoring and maintain current performance levels',
        impact: 'Excellent user experience'
      });
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends() {
    if (this.measurements.length < 3) {
      return { message: 'Insufficient data for trend analysis' };
    }

    const recentMeasurements = this.measurements.slice(-5); // Last 5 measurements
    const earlierMeasurements = this.measurements.slice(0, 5); // First 5 measurements

    const recentAvg = recentMeasurements.reduce((sum, m) => sum + m.duration, 0) / recentMeasurements.length;
    const earlierAvg = earlierMeasurements.reduce((sum, m) => sum + m.duration, 0) / earlierMeasurements.length;

    const trend = recentAvg > earlierAvg ? 'DEGRADING' : 'IMPROVING';
    const changePercent = Math.abs((recentAvg - earlierAvg) / earlierAvg * 100);

    return {
      trend,
      changePercent: Math.round(changePercent),
      recentAverage: Math.round(recentAvg),
      earlierAverage: Math.round(earlierAvg),
      analysis: trend === 'DEGRADING' ? 
        'Performance is degrading over time - investigate potential issues' :
        'Performance is stable or improving'
    };
  }

  /**
   * Get performance distribution
   */
  getPerformanceDistribution() {
    const distribution = {
      EXCELLENT: 0,
      GOOD: 0,
      ACCEPTABLE: 0,
      SLOW: 0,
      CRITICAL: 0,
      ERROR: 0
    };

    this.measurements.forEach(m => {
      distribution[m.performanceCategory]++;
    });

    return distribution;
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Reset measurements
   */
  reset() {
    this.measurements = [];
    this.startTime = Date.now();
  }

  /**
   * Export measurements for external analysis
   */
  exportMeasurements() {
    return {
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - this.startTime,
      measurements: this.measurements,
      summary: this.generateSummary()
    };
  }
}

module.exports = ApiPerformanceMonitor;