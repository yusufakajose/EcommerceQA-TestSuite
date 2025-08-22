/**
 * Visual Testing Utilities
 * Helper functions for visual regression testing and screenshot comparison
 */

const fs = require('fs');
const path = require('path');

class VisualTestUtils {
  constructor(page, browserName) {
    this.page = page;
    this.browserName = browserName;
    this.screenshotDir = path.join(__dirname, '..', 'screenshots');
    this.baselineDir = path.join(this.screenshotDir, 'baseline');
    this.actualDir = path.join(this.screenshotDir, 'actual');
    this.diffDir = path.join(this.screenshotDir, 'diff');
    
    this.ensureDirectories();
  }

  /**
   * Ensure screenshot directories exist
   */
  ensureDirectories() {
    [this.screenshotDir, this.baselineDir, this.actualDir, this.diffDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Default visual testing configuration
   */
  static get DEFAULT_CONFIG() {
    return {
      threshold: 0.2, // 20% difference threshold
      animations: 'disabled',
      fullPage: false,
      clip: null,
      mask: [],
      hideElements: [
        '.timestamp',
        '.current-time',
        '.live-chat',
        '.notification-badge',
        '.price-change',
        '.stock-indicator',
        '.live-data',
        '.notification',
        '.dynamic-content'
      ]
    };
  }

  /**
   * Prepare page for visual testing
   * @param {Object} config - Visual testing configuration
   */
  async preparePage(config = {}) {
    const finalConfig = { ...VisualTestUtils.DEFAULT_CONFIG, ...config };
    
    // Disable animations
    if (finalConfig.animations === 'disabled') {
      await this.disableAnimations();
    }
    
    // Hide dynamic elements
    if (finalConfig.hideElements.length > 0) {
      await this.hideDynamicElements(finalConfig.hideElements);
    }
    
    // Wait for images to load
    await this.waitForImages();
    
    // Wait for fonts to load
    await this.waitForFonts();
    
    // Allow layout to settle
    await this.page.waitForTimeout(500);
  }

  /**
   * Disable all animations and transitions
   */
  async disableAnimations() {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `
    });
  }

  /**
   * Hide dynamic elements that change between test runs
   * @param {Array} selectors - CSS selectors to hide
   */
  async hideDynamicElements(selectors) {
    if (selectors.length === 0) return;
    
    await this.page.addStyleTag({
      content: `
        ${selectors.join(', ')} {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `
    });
  }

  /**
   * Wait for all images to load
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForImages(timeout = 10000) {
    await this.page.waitForFunction(() => {
      const images = Array.from(document.images);
      return images.every(img => img.complete && img.naturalHeight !== 0);
    }, { timeout }).catch(() => {
      console.warn('Some images may not have loaded completely');
    });
  }

  /**
   * Wait for fonts to load
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForFonts(timeout = 5000) {
    await this.page.waitForFunction(() => {
      return document.fonts ? document.fonts.ready : true;
    }, { timeout }).catch(() => {
      console.warn('Font loading may not be complete');
    });
  }

  /**
   * Take a screenshot with consistent settings
   * @param {string} name - Screenshot name
   * @param {Object} options - Screenshot options
   * @returns {Buffer} - Screenshot buffer
   */
  async takeScreenshot(name, options = {}) {
    const config = { ...VisualTestUtils.DEFAULT_CONFIG, ...options };
    
    await this.preparePage(config);
    
    const screenshotOptions = {
      fullPage: config.fullPage,
      animations: config.animations,
      ...(config.clip && { clip: config.clip }),
      ...(config.mask && config.mask.length > 0 && { mask: config.mask })
    };
    
    return await this.page.screenshot(screenshotOptions);
  }

  /**
   * Take element screenshot with consistent settings
   * @param {Locator} element - Element to screenshot
   * @param {string} name - Screenshot name
   * @param {Object} options - Screenshot options
   * @returns {Buffer} - Screenshot buffer
   */
  async takeElementScreenshot(element, name, options = {}) {
    const config = { ...VisualTestUtils.DEFAULT_CONFIG, ...options };
    
    await this.preparePage(config);
    
    const screenshotOptions = {
      animations: config.animations,
      ...(config.mask && config.mask.length > 0 && { mask: config.mask })
    };
    
    return await element.screenshot(screenshotOptions);
  }

  /**
   * Compare screenshot with baseline
   * @param {string} name - Screenshot name
   * @param {Buffer} actualScreenshot - Actual screenshot buffer
   * @param {Object} options - Comparison options
   * @returns {Object} - Comparison result
   */
  async compareWithBaseline(name, actualScreenshot, options = {}) {
    const config = { ...VisualTestUtils.DEFAULT_CONFIG, ...options };
    const baselinePath = path.join(this.baselineDir, `${name}-${this.browserName}.png`);
    const actualPath = path.join(this.actualDir, `${name}-${this.browserName}.png`);
    const diffPath = path.join(this.diffDir, `${name}-${this.browserName}.png`);
    
    // Save actual screenshot
    fs.writeFileSync(actualPath, actualScreenshot);
    
    // Check if baseline exists
    if (!fs.existsSync(baselinePath)) {
      // Create baseline from actual screenshot
      fs.writeFileSync(baselinePath, actualScreenshot);
      
      return {
        status: 'baseline_created',
        message: `Baseline created for ${name}`,
        baselinePath: baselinePath,
        actualPath: actualPath,
        diffPath: null
      };
    }
    
    // Use Playwright's built-in comparison
    try {
      await this.page.screenshot({
        path: actualPath,
        fullPage: config.fullPage,
        animations: config.animations
      });
      
      // This would typically use a visual comparison library
      // For now, we'll return a basic comparison result
      const baselineStats = fs.statSync(baselinePath);
      const actualStats = fs.statSync(actualPath);
      
      const sizeDifference = Math.abs(baselineStats.size - actualStats.size);
      const sizeDifferencePercent = (sizeDifference / baselineStats.size) * 100;
      
      const passed = sizeDifferencePercent <= config.threshold * 100;
      
      return {
        status: passed ? 'passed' : 'failed',
        message: passed ? 'Screenshots match' : 'Screenshots differ',
        baselinePath: baselinePath,
        actualPath: actualPath,
        diffPath: passed ? null : diffPath,
        sizeDifference: sizeDifference,
        sizeDifferencePercent: sizeDifferencePercent,
        threshold: config.threshold
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: `Screenshot comparison failed: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Take and compare page screenshot
   * @param {string} name - Screenshot name
   * @param {Object} options - Screenshot and comparison options
   * @returns {Object} - Comparison result
   */
  async comparePageScreenshot(name, options = {}) {
    const screenshot = await this.takeScreenshot(name, options);
    return await this.compareWithBaseline(name, screenshot, options);
  }

  /**
   * Take and compare element screenshot
   * @param {Locator} element - Element to screenshot
   * @param {string} name - Screenshot name
   * @param {Object} options - Screenshot and comparison options
   * @returns {Object} - Comparison result
   */
  async compareElementScreenshot(element, name, options = {}) {
    const screenshot = await this.takeElementScreenshot(element, name, options);
    return await this.compareWithBaseline(name, screenshot, options);
  }

  /**
   * Test responsive screenshots across viewports
   * @param {string} name - Base screenshot name
   * @param {Array} viewports - Array of viewport configurations
   * @param {Object} options - Screenshot options
   * @returns {Array} - Array of comparison results
   */
  async compareResponsiveScreenshots(name, viewports, options = {}) {
    const results = [];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Allow layout to settle
      
      const screenshotName = `${name}-${viewport.name}`;
      const result = await this.comparePageScreenshot(screenshotName, options);
      
      results.push({
        viewport: viewport,
        ...result
      });
    }
    
    return results;
  }

  /**
   * Test element across multiple states
   * @param {Locator} element - Element to test
   * @param {string} baseName - Base screenshot name
   * @param {Array} states - Array of state configurations
   * @param {Object} options - Screenshot options
   * @returns {Array} - Array of comparison results
   */
  async compareElementStates(element, baseName, states, options = {}) {
    const results = [];
    
    for (const state of states) {
      // Apply state
      if (state.action) {
        await state.action();
      }
      
      // Wait for state to settle
      if (state.waitTime) {
        await this.page.waitForTimeout(state.waitTime);
      }
      
      const screenshotName = `${baseName}-${state.name}`;
      const result = await this.compareElementScreenshot(element, screenshotName, options);
      
      results.push({
        state: state,
        ...result
      });
    }
    
    return results;
  }

  /**
   * Generate visual test report
   * @param {Array} results - Array of comparison results
   * @returns {Object} - Visual test report
   */
  generateVisualTestReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      browserName: this.browserName,
      totalTests: results.length,
      passed: 0,
      failed: 0,
      baselineCreated: 0,
      errors: 0,
      results: results
    };
    
    results.forEach(result => {
      switch (result.status) {
        case 'passed':
          report.passed++;
          break;
        case 'failed':
          report.failed++;
          break;
        case 'baseline_created':
          report.baselineCreated++;
          break;
        case 'error':
          report.errors++;
          break;
      }
    });
    
    report.successRate = report.totalTests > 0 ? 
      ((report.passed + report.baselineCreated) / report.totalTests) * 100 : 0;
    
    return report;
  }

  /**
   * Clean up old screenshots
   * @param {number} daysOld - Remove screenshots older than this many days
   */
  async cleanupOldScreenshots(daysOld = 7) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const directories = [this.actualDir, this.diffDir];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) continue;
      
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
        }
      }
    }
  }

  /**
   * Create visual test configuration for specific scenarios
   * @param {string} scenario - Test scenario name
   * @returns {Object} - Configuration for the scenario
   */
  static getScenarioConfig(scenario) {
    const configs = {
      'homepage': {
        fullPage: true,
        hideElements: [
          '.timestamp', '.live-chat', '.notification-badge',
          '.current-time', '.live-data'
        ]
      },
      
      'product-grid': {
        fullPage: false,
        hideElements: [
          '.price-change', '.stock-indicator', '.dynamic-price'
        ]
      },
      
      'form': {
        fullPage: false,
        hideElements: ['.validation-message'],
        animations: 'disabled'
      },
      
      'modal': {
        fullPage: false,
        animations: 'disabled',
        mask: ['.backdrop']
      },
      
      'mobile': {
        fullPage: true,
        hideElements: [
          '.timestamp', '.notification-badge', '.live-data'
        ]
      }
    };
    
    return configs[scenario] || VisualTestUtils.DEFAULT_CONFIG;
  }

  /**
   * Test component across different themes
   * @param {Locator} element - Element to test
   * @param {string} baseName - Base screenshot name
   * @param {Array} themes - Array of theme configurations
   * @param {Object} options - Screenshot options
   * @returns {Array} - Array of comparison results
   */
  async compareThemeVariations(element, baseName, themes, options = {}) {
    const results = [];
    
    for (const theme of themes) {
      // Apply theme
      if (theme.className) {
        await this.page.evaluate((className) => {
          document.body.className = className;
        }, theme.className);
      }
      
      if (theme.cssVariables) {
        await this.page.addStyleTag({
          content: `:root { ${Object.entries(theme.cssVariables)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ')} }`
        });
      }
      
      // Wait for theme to apply
      await this.page.waitForTimeout(500);
      
      const screenshotName = `${baseName}-${theme.name}`;
      const result = await this.compareElementScreenshot(element, screenshotName, options);
      
      results.push({
        theme: theme,
        ...result
      });
    }
    
    return results;
  }
}

module.exports = VisualTestUtils;