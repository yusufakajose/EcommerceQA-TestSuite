#!/usr/bin/env node

/**
 * Think Time Calculator
 * Calculates realistic think times based on user behavior patterns and actions
 */

class ThinkTimeCalculator {
  constructor() {
    this.actionThinkTimes = {
      // Page navigation and browsing
      page_load: { min: 2000, max: 5000, description: 'Time to read and understand page content' },
      browse_products: { min: 3000, max: 8000, description: 'Time to browse product listings' },
      search_products: { min: 1000, max: 3000, description: 'Time to think about search terms' },
      filter_products: { min: 2000, max: 4000, description: 'Time to select filters and options' },

      // Product interaction
      view_product_details: {
        min: 5000,
        max: 15000,
        description: 'Time to read product details and reviews',
      },
      compare_products: { min: 8000, max: 20000, description: 'Time to compare multiple products' },
      read_reviews: { min: 10000, max: 30000, description: 'Time to read customer reviews' },

      // Cart and checkout
      add_to_cart: { min: 1000, max: 3000, description: 'Time to decide on adding item to cart' },
      view_cart: { min: 2000, max: 5000, description: 'Time to review cart contents' },
      update_cart: { min: 1500, max: 4000, description: 'Time to modify cart quantities' },
      checkout_start: {
        min: 2000,
        max: 5000,
        description: 'Time to decide to proceed with checkout',
      },
      enter_shipping: { min: 30000, max: 90000, description: 'Time to enter shipping information' },
      select_payment: {
        min: 10000,
        max: 30000,
        description: 'Time to select and enter payment method',
      },
      review_order: {
        min: 15000,
        max: 45000,
        description: 'Time to review order before confirmation',
      },

      // User account
      login: { min: 5000, max: 15000, description: 'Time to enter login credentials' },
      register: { min: 60000, max: 180000, description: 'Time to fill registration form' },
      profile_update: {
        min: 30000,
        max: 120000,
        description: 'Time to update profile information',
      },

      // General interactions
      form_fill: { min: 2000, max: 5000, description: 'Time per form field' },
      button_click: { min: 500, max: 1500, description: 'Time to locate and click button' },
      menu_navigation: { min: 1000, max: 2500, description: 'Time to navigate through menus' },
    };

    this.userTypeModifiers = {
      fast: 0.7, // Tech-savvy users, familiar with e-commerce
      normal: 1.0, // Average users
      slow: 1.5, // Less tech-savvy users, first-time visitors
      mobile: 1.3, // Mobile users (slower interaction)
      elderly: 2.0, // Elderly users (more deliberate)
      expert: 0.5, // Expert users, very familiar with the site
    };

    this.deviceModifiers = {
      desktop: 1.0,
      tablet: 1.2,
      mobile: 1.4,
      slow_connection: 1.8,
    };

    this.timeOfDayModifiers = {
      morning: 0.9, // Users are more focused
      afternoon: 1.0, // Normal browsing
      evening: 1.1, // More leisurely browsing
      night: 1.3, // Tired users, slower decisions
    };
  }

  /**
   * Calculate think time for a specific action
   */
  calculateThinkTime(action, userType = 'normal', device = 'desktop', timeOfDay = 'afternoon') {
    const baseTime = this.actionThinkTimes[action];

    if (!baseTime) {
      console.warn(`Unknown action: ${action}, using default think time`);
      return { min: 1000, max: 3000 };
    }

    const userModifier = this.userTypeModifiers[userType] || 1.0;
    const deviceModifier = this.deviceModifiers[device] || 1.0;
    const timeModifier = this.timeOfDayModifiers[timeOfDay] || 1.0;

    const totalModifier = userModifier * deviceModifier * timeModifier;

    return {
      min: Math.round(baseTime.min * totalModifier),
      max: Math.round(baseTime.max * totalModifier),
      description: baseTime.description,
      modifiers: {
        user: userModifier,
        device: deviceModifier,
        time: timeModifier,
        total: totalModifier,
      },
    };
  }

  /**
   * Generate realistic user journey with think times
   */
  generateUserJourney(userBehavior = 'shopper', sessionLength = 'medium') {
    const journeys = {
      browser: [
        'page_load',
        'browse_products',
        'view_product_details',
        'search_products',
        'filter_products',
        'view_product_details',
      ],
      researcher: [
        'page_load',
        'search_products',
        'filter_products',
        'view_product_details',
        'read_reviews',
        'compare_products',
        'view_product_details',
      ],
      shopper: [
        'page_load',
        'browse_products',
        'view_product_details',
        'add_to_cart',
        'view_cart',
        'checkout_start',
        'enter_shipping',
        'select_payment',
        'review_order',
      ],
      returner: [
        'page_load',
        'login',
        'search_products',
        'view_product_details',
        'add_to_cart',
        'checkout_start',
        'select_payment',
        'review_order',
      ],
    };

    const baseJourney = journeys[userBehavior] || journeys.shopper;

    // Adjust journey length based on session length
    let journey = [...baseJourney];
    if (sessionLength === 'short') {
      journey = journey.slice(0, Math.ceil(journey.length * 0.6));
    } else if (sessionLength === 'long') {
      // Add more browsing and research actions
      const additionalActions = ['browse_products', 'view_product_details', 'read_reviews'];
      journey.splice(2, 0, ...additionalActions);
    }

    return journey;
  }

  /**
   * Calculate total session duration
   */
  calculateSessionDuration(
    journey,
    userType = 'normal',
    device = 'desktop',
    timeOfDay = 'afternoon'
  ) {
    let totalMin = 0;
    let totalMax = 0;
    const actionDetails = [];

    journey.forEach((action) => {
      const thinkTime = this.calculateThinkTime(action, userType, device, timeOfDay);
      totalMin += thinkTime.min;
      totalMax += thinkTime.max;
      actionDetails.push({
        action,
        thinkTime,
        description: thinkTime.description,
      });
    });

    return {
      totalDuration: {
        min: totalMin,
        max: totalMax,
        average: Math.round((totalMin + totalMax) / 2),
      },
      actionDetails,
      journey,
    };
  }

  /**
   * Generate JMeter-compatible think time configuration
   */
  generateJMeterThinkTimes(action, userType = 'normal', device = 'desktop') {
    const thinkTime = this.calculateThinkTime(action, userType, device);

    return {
      constantTimer: Math.round((thinkTime.min + thinkTime.max) / 2),
      uniformRandomTimer: {
        delay: thinkTime.min,
        range: thinkTime.max - thinkTime.min,
      },
      gaussianRandomTimer: {
        delay: Math.round((thinkTime.min + thinkTime.max) / 2),
        deviation: Math.round((thinkTime.max - thinkTime.min) / 6), // 99.7% within range
      },
    };
  }

  /**
   * Generate realistic ramp-up pattern
   */
  generateRampUpPattern(totalUsers, duration, pattern = 'linear') {
    const patterns = {
      linear: (time, duration) => time / duration,
      exponential: (time, duration) => Math.pow(time / duration, 2),
      logarithmic: (time, duration) => Math.log(1 + 9 * (time / duration)) / Math.log(10),
      step: (time, duration) => Math.floor((time / duration) * 4) / 4,
      spike: (time, duration) => {
        const midPoint = duration / 2;
        return time < midPoint
          ? Math.pow(time / midPoint, 0.5)
          : 1 - Math.pow((time - midPoint) / midPoint, 2);
      },
    };

    const patternFunc = patterns[pattern] || patterns.linear;
    const steps = [];
    const stepCount = 20; // 20 steps for smooth ramp-up

    for (let i = 0; i <= stepCount; i++) {
      const time = (i / stepCount) * duration;
      const userRatio = patternFunc(time, duration);
      const users = Math.round(totalUsers * userRatio);

      steps.push({
        time: Math.round(time),
        users,
        percentage: Math.round(userRatio * 100),
      });
    }

    return {
      pattern,
      totalUsers,
      duration,
      steps,
    };
  }

  /**
   * Analyze and recommend optimal test configuration
   */
  recommendTestConfiguration(targetThroughput, averageSessionDuration, peakHours = false) {
    // Calculate required concurrent users based on Little's Law
    // Concurrent Users = Throughput × Average Session Duration
    const sessionDurationSeconds = averageSessionDuration / 1000;
    const baseUsers = Math.ceil(targetThroughput * sessionDurationSeconds);

    // Adjust for peak hours and safety margin
    const peakMultiplier = peakHours ? 1.5 : 1.0;
    const safetyMargin = 1.2;
    const recommendedUsers = Math.ceil(baseUsers * peakMultiplier * safetyMargin);

    // Calculate ramp-up time (should be 2-3 times average session duration)
    const rampUpTime = Math.max(300, sessionDurationSeconds * 2.5);

    // Calculate test duration (should be at least 3 times ramp-up time)
    const testDuration = Math.max(1800, rampUpTime * 3);

    return {
      recommendedUsers,
      rampUpTime: Math.round(rampUpTime),
      testDuration: Math.round(testDuration),
      calculations: {
        baseUsers,
        sessionDurationSeconds,
        peakMultiplier,
        safetyMargin,
        targetThroughput,
      },
      recommendations: [
        `Use ${recommendedUsers} concurrent users for target throughput of ${targetThroughput} TPS`,
        `Ramp-up over ${Math.round(rampUpTime)} seconds for gradual load increase`,
        `Run test for ${Math.round(testDuration)} seconds to capture steady-state performance`,
        peakHours
          ? 'Configuration adjusted for peak hour traffic patterns'
          : 'Configuration for normal traffic patterns',
      ],
    };
  }

  /**
   * Generate comprehensive test report
   */
  generateThinkTimeReport(userBehaviors, userTypes, devices) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalScenarios: userBehaviors.length * userTypes.length * devices.length,
        actionTypes: Object.keys(this.actionThinkTimes).length,
      },
      scenarios: [],
    };

    userBehaviors.forEach((behavior) => {
      userTypes.forEach((userType) => {
        devices.forEach((device) => {
          const journey = this.generateUserJourney(behavior, 'medium');
          const sessionDuration = this.calculateSessionDuration(journey, userType, device);

          report.scenarios.push({
            behavior,
            userType,
            device,
            journey,
            sessionDuration: sessionDuration.totalDuration,
            actionCount: journey.length,
            averageThinkTime: Math.round(sessionDuration.totalDuration.average / journey.length),
          });
        });
      });
    });

    return report;
  }
}

module.exports = ThinkTimeCalculator;

// CLI Interface
if (require.main === module) {
  const calculator = new ThinkTimeCalculator();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Think Time Calculator

Usage: node scripts/think-time-calculator.js [COMMAND] [OPTIONS]

Commands:
  calculate ACTION [USER_TYPE] [DEVICE]    Calculate think time for specific action
  journey BEHAVIOR [SESSION_LENGTH]       Generate user journey with think times
  recommend THROUGHPUT DURATION [PEAK]    Recommend test configuration
  report                                   Generate comprehensive think time report
  list-actions                            List all available actions

Examples:
  node scripts/think-time-calculator.js calculate view_product_details normal desktop
  node scripts/think-time-calculator.js journey shopper medium
  node scripts/think-time-calculator.js recommend 50 30000 true
  node scripts/think-time-calculator.js report
`);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'calculate': {
      const action = args[1];
      const userType = args[2] || 'normal';
      const device = args[3] || 'desktop';

      if (!action) {
        console.error('Action is required');
        process.exit(1);
      }

      const thinkTime = calculator.calculateThinkTime(action, userType, device);
      console.log(`Think Time for "${action}":`);
      console.log(`  User Type: ${userType}`);
      console.log(`  Device: ${device}`);
      console.log(`  Range: ${thinkTime.min}ms - ${thinkTime.max}ms`);
      console.log(`  Average: ${Math.round((thinkTime.min + thinkTime.max) / 2)}ms`);
      console.log(`  Description: ${thinkTime.description}`);
      console.log(`  Modifiers:`, thinkTime.modifiers);
      break;
    }

    case 'journey': {
      const behavior = args[1] || 'shopper';
      const sessionLength = args[2] || 'medium';

      const journey = calculator.generateUserJourney(behavior, sessionLength);
      const sessionDuration = calculator.calculateSessionDuration(journey);

      console.log(`User Journey for "${behavior}" (${sessionLength} session):`);
      console.log(
        `  Total Duration: ${sessionDuration.totalDuration.min}ms - ${sessionDuration.totalDuration.max}ms`
      );
      console.log(`  Average Duration: ${sessionDuration.totalDuration.average}ms`);
      console.log(`  Actions (${journey.length}):`);

      sessionDuration.actionDetails.forEach((detail, index) => {
        console.log(
          `    ${index + 1}. ${detail.action}: ${detail.thinkTime.min}-${detail.thinkTime.max}ms`
        );
      });
      break;
    }

    case 'recommend': {
      const throughput = parseFloat(args[1]);
      const duration = parseInt(args[2]);
      const peak = args[3] === 'true';

      if (!throughput || !duration) {
        console.error('Throughput and duration are required');
        process.exit(1);
      }

      const recommendation = calculator.recommendTestConfiguration(throughput, duration, peak);
      console.log('Test Configuration Recommendation:');
      console.log(`  Concurrent Users: ${recommendation.recommendedUsers}`);
      console.log(`  Ramp-up Time: ${recommendation.rampUpTime}s`);
      console.log(`  Test Duration: ${recommendation.testDuration}s`);
      console.log('  Recommendations:');
      recommendation.recommendations.forEach((rec) => {
        console.log(`    - ${rec}`);
      });
      break;
    }

    case 'report': {
      const userBehaviors = ['browser', 'researcher', 'shopper', 'returner'];
      const userTypes = ['fast', 'normal', 'slow'];
      const devices = ['desktop', 'tablet', 'mobile'];

      const report = calculator.generateThinkTimeReport(userBehaviors, userTypes, devices);
      console.log('Think Time Analysis Report:');
      console.log(`  Generated: ${report.timestamp}`);
      console.log(`  Total Scenarios: ${report.summary.totalScenarios}`);
      console.log(`  Action Types: ${report.summary.actionTypes}`);
      console.log('\nScenario Summary:');

      report.scenarios.forEach((scenario) => {
        console.log(`  ${scenario.behavior}/${scenario.userType}/${scenario.device}:`);
        console.log(
          `    Duration: ${scenario.sessionDuration.average}ms (${scenario.actionCount} actions)`
        );
        console.log(`    Avg Think Time: ${scenario.averageThinkTime}ms per action`);
      });
      break;
    }

    case 'list-actions':
      console.log('Available Actions:');
      Object.entries(calculator.actionThinkTimes).forEach(([action, details]) => {
        console.log(`  ${action}: ${details.min}-${details.max}ms - ${details.description}`);
      });
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}
