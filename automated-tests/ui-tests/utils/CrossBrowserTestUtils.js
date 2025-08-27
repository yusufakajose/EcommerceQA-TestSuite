/**
 * Cross-Browser Testing Utilities
 * Helper functions for cross-browser compatibility testing
 */

class CrossBrowserTestUtils {
  constructor(page, browserName) {
    this.page = page;
    this.browserName = browserName;
  }

  /**
   * Browser-specific configurations and capabilities
   */
  static get BROWSER_CONFIGS() {
    return {
      chromium: {
        name: 'Chrome',
        engine: 'Blink',
        supportsWebP: true,
        supportsES6: true,
        supportsCSS3: true,
        supportsFlexbox: true,
        supportsGrid: true,
        supportsServiceWorker: true,
        userAgent: /Chrome/,
      },
      firefox: {
        name: 'Firefox',
        engine: 'Gecko',
        supportsWebP: true,
        supportsES6: true,
        supportsCSS3: true,
        supportsFlexbox: true,
        supportsGrid: true,
        supportsServiceWorker: true,
        userAgent: /Firefox/,
      },
      webkit: {
        name: 'Safari',
        engine: 'WebKit',
        supportsWebP: false, // Older versions
        supportsES6: true,
        supportsCSS3: true,
        supportsFlexbox: true,
        supportsGrid: true,
        supportsServiceWorker: true,
        userAgent: /Safari/,
      },
    };
  }

  /**
   * Get current browser configuration
   * @returns {Object} - Browser configuration
   */
  getBrowserConfig() {
    return (
      CrossBrowserTestUtils.BROWSER_CONFIGS[this.browserName] ||
      CrossBrowserTestUtils.BROWSER_CONFIGS.chromium
    );
  }

  /**
   * Check if browser supports a specific feature
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  supportsFeature(feature) {
    const config = this.getBrowserConfig();
    return config[`supports${feature}`] || false;
  }

  /**
   * Get browser-specific CSS property values
   * @param {Locator} element - Element locator
   * @param {string} property - CSS property name
   * @returns {Object} - Property values and browser-specific info
   */
  async getCSSProperty(element, property) {
    const value = await element.evaluate((el, prop) => {
      const style = window.getComputedStyle(el);
      return {
        value: style[prop],
        webkitValue: style[`-webkit-${prop}`] || style[prop],
        mozValue: style[`-moz-${prop}`] || style[prop],
        msValue: style[`-ms-${prop}`] || style[prop],
      };
    }, property);

    return {
      ...value,
      browserName: this.browserName,
      isConsistent: this.checkCSSConsistency(value),
    };
  }

  /**
   * Check CSS property consistency across prefixes
   * @param {Object} propertyValues - CSS property values
   * @returns {boolean}
   */
  checkCSSConsistency(propertyValues) {
    const { value, webkitValue, mozValue, msValue } = propertyValues;
    const values = [value, webkitValue, mozValue, msValue].filter((v) => v && v !== 'initial');

    if (values.length <= 1) return true;

    // Check if all non-initial values are the same
    return values.every((v) => v === values[0]);
  }

  /**
   * Test JavaScript API availability
   * @param {Array} apis - Array of API names to test
   * @returns {Object} - API availability results
   */
  async testJavaScriptAPIs(apis) {
    const results = {};

    for (const api of apis) {
      const isAvailable = await this.page.evaluate((apiName) => {
        try {
          const parts = apiName.split('.');
          let obj = window;

          for (const part of parts) {
            if (obj && typeof obj[part] !== 'undefined') {
              obj = obj[part];
            } else {
              return false;
            }
          }

          return typeof obj !== 'undefined';
        } catch (error) {
          return false;
        }
      }, api);

      results[api] = {
        available: isAvailable,
        browserName: this.browserName,
      };
    }

    return results;
  }

  /**
   * Test form input types support
   * @returns {Object} - Input type support results
   */
  async testInputTypeSupport() {
    const inputTypes = [
      'email',
      'url',
      'tel',
      'number',
      'range',
      'date',
      'time',
      'datetime-local',
      'month',
      'week',
      'color',
      'search',
    ];

    const results = {};

    for (const type of inputTypes) {
      const isSupported = await this.page.evaluate((inputType) => {
        const input = document.createElement('input');
        input.type = inputType;
        return input.type === inputType;
      }, type);

      results[type] = {
        supported: isSupported,
        browserName: this.browserName,
      };
    }

    return results;
  }

  /**
   * Test CSS feature support
   * @returns {Object} - CSS feature support results
   */
  async testCSSFeatureSupport() {
    const cssFeatures = [
      'display: flex',
      'display: grid',
      'position: sticky',
      'backdrop-filter: blur(10px)',
      'clip-path: circle(50%)',
      'filter: blur(5px)',
      'transform: translateZ(0)',
      'will-change: transform',
    ];

    const results = {};

    for (const feature of cssFeatures) {
      const [property, value] = feature.split(': ');

      const isSupported = await this.page.evaluate(
        (prop, val) => {
          const element = document.createElement('div');
          element.style[prop] = val;
          return element.style[prop] === val;
        },
        property,
        value
      );

      results[feature] = {
        supported: isSupported,
        browserName: this.browserName,
      };
    }

    return results;
  }

  /**
   * Test event handling consistency
   * @param {Locator} element - Element to test
   * @param {Array} events - Array of event types
   * @returns {Object} - Event handling results
   */
  async testEventHandling(element, events) {
    const results = {};

    for (const eventType of events) {
      const eventResult = await element.evaluate((el, event) => {
        return new Promise((resolve) => {
          let fired = false;

          const handler = () => {
            fired = true;
            el.removeEventListener(event, handler);
            resolve(true);
          };

          el.addEventListener(event, handler);

          // Trigger the event
          const evt = new Event(event, { bubbles: true });
          el.dispatchEvent(evt);

          // Timeout after 100ms
          setTimeout(() => {
            if (!fired) {
              el.removeEventListener(event, handler);
              resolve(false);
            }
          }, 100);
        });
      }, eventType);

      results[eventType] = {
        handled: eventResult,
        browserName: this.browserName,
      };
    }

    return results;
  }

  /**
   * Test font rendering consistency
   * @param {Locator} element - Text element
   * @returns {Object} - Font rendering information
   */
  async testFontRendering(element) {
    const fontInfo = await element.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      ctx.font = `${style.fontSize} ${style.fontFamily}`;
      const metrics = ctx.measureText(el.textContent || 'Test Text');

      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        textRendering: style.textRendering,
        fontSmoothing: style.webkitFontSmoothing || style.fontSmoothing,
        textWidth: metrics.width,
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
      };
    });

    return {
      ...fontInfo,
      browserName: this.browserName,
    };
  }

  /**
   * Test image format support
   * @returns {Object} - Image format support results
   */
  async testImageFormatSupport() {
    const formats = [
      {
        format: 'webp',
        dataUrl: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      },
      {
        format: 'avif',
        dataUrl: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQ==',
      },
      {
        format: 'jpeg',
        dataUrl:
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
      },
      {
        format: 'png',
        dataUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA6VP8AAAAABJRU5ErkJggg==',
      },
    ];

    const results = {};

    for (const { format, dataUrl } of formats) {
      const isSupported = await this.page.evaluate((url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        });
      }, dataUrl);

      results[format] = {
        supported: isSupported,
        browserName: this.browserName,
      };
    }

    return results;
  }

  /**
   * Test local storage functionality
   * @returns {Object} - Storage test results
   */
  async testStorageAPIs() {
    const storageTests = await this.page.evaluate(() => {
      const results = {};

      // Test localStorage
      try {
        localStorage.setItem('test', 'value');
        results.localStorage = localStorage.getItem('test') === 'value';
        localStorage.removeItem('test');
      } catch (error) {
        results.localStorage = false;
      }

      // Test sessionStorage
      try {
        sessionStorage.setItem('test', 'value');
        results.sessionStorage = sessionStorage.getItem('test') === 'value';
        sessionStorage.removeItem('test');
      } catch (error) {
        results.sessionStorage = false;
      }

      // Test IndexedDB
      results.indexedDB = typeof indexedDB !== 'undefined';

      // Test WebSQL (deprecated)
      results.webSQL = typeof openDatabase !== 'undefined';

      return results;
    });

    return {
      ...storageTests,
      browserName: this.browserName,
    };
  }

  /**
   * Test network request capabilities
   * @returns {Object} - Network capabilities
   */
  async testNetworkCapabilities() {
    const networkTests = await this.page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        xmlHttpRequest: typeof XMLHttpRequest !== 'undefined',
        webSocket: typeof WebSocket !== 'undefined',
        eventSource: typeof EventSource !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notification: 'Notification' in window,
      };
    });

    return {
      ...networkTests,
      browserName: this.browserName,
    };
  }

  /**
   * Compare element rendering across browsers
   * @param {Locator} element - Element to compare
   * @param {Object} baseline - Baseline measurements from another browser
   * @returns {Object} - Comparison results
   */
  async compareElementRendering(element, baseline = null) {
    const currentMeasurements = await element.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      return {
        boundingBox: {
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
        },
        computedStyle: {
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontFamily: style.fontFamily,
          color: style.color,
          backgroundColor: style.backgroundColor,
          margin: style.margin,
          padding: style.padding,
          border: style.border,
        },
      };
    });

    const result = {
      current: {
        ...currentMeasurements,
        browserName: this.browserName,
      },
    };

    if (baseline) {
      result.baseline = baseline;
      result.differences = this.calculateRenderingDifferences(currentMeasurements, baseline);
    }

    return result;
  }

  /**
   * Calculate rendering differences between browsers
   * @param {Object} current - Current browser measurements
   * @param {Object} baseline - Baseline browser measurements
   * @returns {Object} - Differences
   */
  calculateRenderingDifferences(current, baseline) {
    const differences = {
      boundingBox: {},
      computedStyle: {},
      significant: false,
    };

    // Compare bounding box
    for (const [key, value] of Object.entries(current.boundingBox)) {
      const baselineValue = baseline.boundingBox[key];
      const diff = Math.abs(value - baselineValue);
      const percentDiff = baselineValue !== 0 ? (diff / baselineValue) * 100 : 0;

      differences.boundingBox[key] = {
        current: value,
        baseline: baselineValue,
        difference: diff,
        percentDifference: percentDiff,
        significant: percentDiff > 5, // More than 5% difference
      };

      if (percentDiff > 5) {
        differences.significant = true;
      }
    }

    // Compare computed styles
    for (const [key, value] of Object.entries(current.computedStyle)) {
      const baselineValue = baseline.computedStyle[key];
      differences.computedStyle[key] = {
        current: value,
        baseline: baselineValue,
        different: value !== baselineValue,
      };

      if (value !== baselineValue) {
        differences.significant = true;
      }
    }

    return differences;
  }

  /**
   * Generate comprehensive browser compatibility report
   * @param {Locator} testElement - Element to test (optional)
   * @returns {Object} - Comprehensive compatibility report
   */
  async generateCompatibilityReport(testElement = null) {
    const report = {
      browserName: this.browserName,
      browserConfig: this.getBrowserConfig(),
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test JavaScript APIs
    const commonAPIs = [
      'fetch',
      'Promise',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'WebSocket',
      'EventSource',
      'navigator.serviceWorker',
      'Notification',
      'requestAnimationFrame',
      'IntersectionObserver',
      'MutationObserver',
    ];
    report.tests.javascriptAPIs = await this.testJavaScriptAPIs(commonAPIs);

    // Test input types
    report.tests.inputTypes = await this.testInputTypeSupport();

    // Test CSS features
    report.tests.cssFeatures = await this.testCSSFeatureSupport();

    // Test image formats
    report.tests.imageFormats = await this.testImageFormatSupport();

    // Test storage APIs
    report.tests.storageAPIs = await this.testStorageAPIs();

    // Test network capabilities
    report.tests.networkCapabilities = await this.testNetworkCapabilities();

    // Test element-specific features if element provided
    if (testElement) {
      const commonEvents = ['click', 'focus', 'blur', 'input', 'change'];
      report.tests.eventHandling = await this.testEventHandling(testElement, commonEvents);
      report.tests.fontRendering = await this.testFontRendering(testElement);
      report.tests.elementRendering = await this.compareElementRendering(testElement);
    }

    // Calculate overall compatibility score
    report.compatibilityScore = this.calculateCompatibilityScore(report.tests);

    return report;
  }

  /**
   * Calculate overall compatibility score
   * @param {Object} tests - Test results
   * @returns {number} - Compatibility score (0-100)
   */
  calculateCompatibilityScore(tests) {
    let totalTests = 0;
    let passedTests = 0;

    // Count JavaScript API tests
    for (const result of Object.values(tests.javascriptAPIs || {})) {
      totalTests++;
      if (result.available) passedTests++;
    }

    // Count input type tests
    for (const result of Object.values(tests.inputTypes || {})) {
      totalTests++;
      if (result.supported) passedTests++;
    }

    // Count CSS feature tests
    for (const result of Object.values(tests.cssFeatures || {})) {
      totalTests++;
      if (result.supported) passedTests++;
    }

    // Count image format tests
    for (const result of Object.values(tests.imageFormats || {})) {
      totalTests++;
      if (result.supported) passedTests++;
    }

    // Count storage API tests
    for (const [key, result] of Object.entries(tests.storageAPIs || {})) {
      if (key !== 'browserName') {
        totalTests++;
        if (result) passedTests++;
      }
    }

    // Count network capability tests
    for (const [key, result] of Object.entries(tests.networkCapabilities || {})) {
      if (key !== 'browserName') {
        totalTests++;
        if (result) passedTests++;
      }
    }

    return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  }
}

module.exports = CrossBrowserTestUtils;
