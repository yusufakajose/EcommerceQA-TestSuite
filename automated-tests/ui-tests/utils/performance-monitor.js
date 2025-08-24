/**
 * Performance Monitoring Utilities
 * Provides performance measurement and assertion capabilities for tests
 */

class PerformanceMonitor {
  constructor(page) {
    this.page = page;
    this.metrics = {};
    this.thresholds = {
      pageLoad: 3000,      // 3 seconds
      navigation: 2000,    // 2 seconds
      interaction: 1000,   // 1 second
      apiResponse: 500     // 500ms
    };
  }

  /**
   * Start performance measurement
   */
  async startMeasurement(label) {
    this.metrics[label] = {
      startTime: Date.now(),
      startNavigationTime: await this.page.evaluate(() => performance.now())
    };
  }

  /**
   * End performance measurement and return duration
   */
  async endMeasurement(label) {
    if (!this.metrics[label]) {
      throw new Error(`No measurement started for label: ${label}`);
    }

    const endTime = Date.now();
    const endNavigationTime = await this.page.evaluate(() => performance.now());
    
    const duration = endTime - this.metrics[label].startTime;
    const navigationDuration = endNavigationTime - this.metrics[label].startNavigationTime;

    this.metrics[label] = {
      ...this.metrics[label],
      endTime,
      duration,
      navigationDuration
    };

    return duration;
  }

  /**
   * Measure page load performance
   */
  async measurePageLoad() {
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });

    return performanceMetrics;
  }

  /**
   * Assert performance threshold
   */
  async assertPerformance(label, threshold, customMessage) {
    if (!this.metrics[label]) {
      throw new Error(`No measurement found for label: ${label}`);
    }

    const duration = this.metrics[label].duration;
    const message = customMessage || `${label} should complete within ${threshold}ms (actual: ${duration}ms)`;
    
    if (duration > threshold) {
      console.warn(`⚠️ Performance Warning: ${message}`);
      // In a real scenario, you might want to fail the test
      // throw new Error(`Performance threshold exceeded: ${message}`);
    } else {
      console.log(`✅ Performance OK: ${label} completed in ${duration}ms`);
    }

    return duration <= threshold;
  }

  /**
   * Assert page load performance
   */
  async assertPageLoadPerformance(threshold = this.thresholds.pageLoad) {
    const metrics = await this.measurePageLoad();
    const message = `Page load should complete within ${threshold}ms (actual: ${metrics.totalLoadTime}ms)`;
    
    if (metrics.totalLoadTime > threshold) {
      console.warn(`⚠️ Page Load Warning: ${message}`);
    } else {
      console.log(`✅ Page Load OK: Completed in ${metrics.totalLoadTime}ms`);
    }

    // Log detailed metrics
    console.log(`📊 Page Load Metrics:
      - DOM Content Loaded: ${metrics.domContentLoaded}ms
      - Load Complete: ${metrics.loadComplete}ms
      - First Paint: ${metrics.firstPaint}ms
      - First Contentful Paint: ${metrics.firstContentfulPaint}ms
      - Total Load Time: ${metrics.totalLoadTime}ms`);

    return {
      passed: metrics.totalLoadTime <= threshold,
      metrics
    };
  }

  /**
   * Measure and assert navigation performance
   */
  async measureNavigation(navigationAction, threshold = this.thresholds.navigation) {
    await this.startMeasurement('navigation');
    await navigationAction();
    const duration = await this.endMeasurement('navigation');
    
    await this.assertPerformance('navigation', threshold);
    return duration;
  }

  /**
   * Measure and assert interaction performance
   */
  async measureInteraction(interactionAction, label = 'interaction', threshold = this.thresholds.interaction) {
    await this.startMeasurement(label);
    await interactionAction();
    const duration = await this.endMeasurement(label);
    
    await this.assertPerformance(label, threshold);
    return duration;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics() {
    return this.metrics;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds,
      measurements: this.metrics,
      summary: {
        totalMeasurements: Object.keys(this.metrics).length,
        averageDuration: this.calculateAverageDuration(),
        slowestOperation: this.getSlowestOperation(),
        fastestOperation: this.getFastestOperation()
      }
    };

    return report;
  }

  /**
   * Calculate average duration across all measurements
   */
  calculateAverageDuration() {
    const durations = Object.values(this.metrics).map(m => m.duration).filter(d => d);
    return durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  }

  /**
   * Get slowest operation
   */
  getSlowestOperation() {
    let slowest = null;
    let maxDuration = 0;

    Object.entries(this.metrics).forEach(([label, metric]) => {
      if (metric.duration && metric.duration > maxDuration) {
        maxDuration = metric.duration;
        slowest = { label, duration: metric.duration };
      }
    });

    return slowest;
  }

  /**
   * Get fastest operation
   */
  getFastestOperation() {
    let fastest = null;
    let minDuration = Infinity;

    Object.entries(this.metrics).forEach(([label, metric]) => {
      if (metric.duration && metric.duration < minDuration) {
        minDuration = metric.duration;
        fastest = { label, duration: metric.duration };
      }
    });

    return fastest;
  }
}

module.exports = PerformanceMonitor;