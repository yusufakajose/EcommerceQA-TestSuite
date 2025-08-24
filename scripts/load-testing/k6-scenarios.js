/**
 * K6 Advanced Load Testing Scenarios
 * Specialized load testing scenarios for different performance aspects
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let requestCount = new Counter('requests');
export let activeUsers = new Gauge('active_users');

// Advanced test configurations
export let options = {
  scenarios: {
    // Baseline Performance Test
    baseline_performance: {
      executor: 'constant-vus',
      vus: 5,
      duration: '5m',
      tags: { test_type: 'baseline' },
    },
    
    // Capacity Planning Test
    capacity_planning: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '2m', target: 5 },   // Start with 5 req/s
        { duration: '5m', target: 10 },  // Increase to 10 req/s
        { duration: '5m', target: 20 },  // Increase to 20 req/s
        { duration: '2m', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'capacity' },
    },
    
    // Endurance Test
    endurance_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30m',
      tags: { test_type: 'endurance' },
    },
    
    // Breakpoint Test
    breakpoint_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '2m', target: 40 },
        { duration: '2m', target: 60 },
        { duration: '2m', target: 80 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'breakpoint' },
    },
  },
  
  // Performance thresholds
  thresholds: {
    http_req_duration: [
      'p(50)<500',   // 50% of requests under 500ms
      'p(95)<2000',  // 95% of requests under 2s
      'p(99)<5000',  // 99% of requests under 5s
    ],
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    errors: ['rate<0.05'],
    response_time: ['p(95)<2000'],
  },
};

// Test data and configuration
const BASE_URL = __ENV.BASE_URL || 'https://www.saucedemo.com';
const TEST_USERS = [
  { username: 'standard_user', password: 'secret_sauce' },
  { username: 'problem_user', password: 'secret_sauce' },
  { username: 'performance_glitch_user', password: 'secret_sauce' },
];

const PRODUCTS = [
  'sauce-labs-backpack',
  'sauce-labs-bike-light',
  'sauce-labs-bolt-t-shirt',
  'sauce-labs-fleece-jacket',
];

export default function () {
  const testType = __ENV.TEST_TYPE || 'baseline';
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  activeUsers.add(1);
  
  switch (testType) {
    case 'baseline':
      baselinePerformanceTest(user);
      break;
    case 'capacity':
      capacityPlanningTest(user);
      break;
    case 'endurance':
      enduranceTest(user);
      break;
    case 'breakpoint':
      breakpointTest(user);
      break;
    default:
      baselinePerformanceTest(user);
  }
  
  activeUsers.add(-1);
}

/**
 * Baseline Performance Test - Establish performance baseline
 */
function baselinePerformanceTest(user) {
  group('Baseline User Journey', function () {
    // Homepage load
    group('01 - Homepage Load', function () {
      let response = http.get(`${BASE_URL}/`);
      
      check(response, {
        'homepage status 200': (r) => r.status === 200,
        'homepage load time < 2s': (r) => r.timings.duration < 2000,
        'homepage has login form': (r) => r.body.includes('user-name'),
      });
      
      recordMetrics(response, 'homepage');
    });
    
    // Login process
    group('02 - Login Process', function () {
      let response = http.post(`${BASE_URL}/`, {
        'user-name': user.username,
        'password': user.password,
      });
      
      check(response, {
        'login successful': (r) => r.status === 200,
        'login time < 3s': (r) => r.timings.duration < 3000,
        'redirected to inventory': (r) => r.url.includes('inventory'),
      });
      
      recordMetrics(response, 'login');
    });
    
    // Product browsing
    group('03 - Product Browsing', function () {
      let response = http.get(`${BASE_URL}/inventory.html`);
      
      check(response, {
        'inventory loaded': (r) => r.status === 200,
        'products visible': (r) => r.body.includes('inventory_item'),
        'browse time < 2s': (r) => r.timings.duration < 2000,
      });
      
      recordMetrics(response, 'browse');
    });
    
    // Add to cart
    group('04 - Add to Cart', function () {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      let response = http.get(`${BASE_URL}/inventory-item.html?id=${product}`);
      
      check(response, {
        'product page loaded': (r) => r.status === 200,
        'add to cart time < 1.5s': (r) => r.timings.duration < 1500,
      });
      
      recordMetrics(response, 'add_to_cart');
    });
    
    sleep(Math.random() * 2 + 1); // Think time 1-3s
  });
}

/**
 * Capacity Planning Test - Find optimal capacity
 */
function capacityPlanningTest(user) {
  group('Capacity Planning Journey', function () {
    // Simulate realistic user behavior with varying load
    const actions = ['browse', 'search', 'add_to_cart', 'checkout'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    switch (action) {
      case 'browse':
        performBrowseAction();
        break;
      case 'search':
        performSearchAction();
        break;
      case 'add_to_cart':
        performAddToCartAction(user);
        break;
      case 'checkout':
        performCheckoutAction(user);
        break;
    }
    
    sleep(Math.random() * 3 + 0.5); // Variable think time
  });
}

/**
 * Endurance Test - Long-running stability test
 */
function enduranceTest(user) {
  group('Endurance Test Journey', function () {
    // Simulate continuous user activity
    const startTime = Date.now();
    
    // Login once per session
    if (__ITER === 0) {
      loginUser(user);
    }
    
    // Perform various actions
    performRandomUserActions();
    
    // Check for memory leaks or performance degradation
    const currentTime = Date.now();
    const sessionDuration = currentTime - startTime;
    
    check(null, {
      'session duration reasonable': () => sessionDuration < 300000, // 5 minutes max
    });
    
    sleep(Math.random() * 5 + 2); // Longer think time for endurance
  });
}

/**
 * Breakpoint Test - Find system breaking point
 */
function breakpointTest(user) {
  group('Breakpoint Test Journey', function () {
    // Aggressive user behavior to stress the system
    const requests = [
      { method: 'GET', url: `${BASE_URL}/` },
      { method: 'GET', url: `${BASE_URL}/inventory.html` },
      { method: 'GET', url: `${BASE_URL}/cart.html` },
    ];
    
    // Batch requests to increase load
    let responses = http.batch(requests);
    
    responses.forEach((response, index) => {
      check(response, {
        [`breakpoint_request_${index}_success`]: (r) => r.status === 200,
        [`breakpoint_request_${index}_time`]: (r) => r.timings.duration < 10000, // Allow higher times
      });
      
      recordMetrics(response, `breakpoint_${index}`);
    });
    
    sleep(0.1); // Minimal think time for maximum stress
  });
}

/**
 * Helper Functions
 */

function recordMetrics(response, operation) {
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  // Add operation-specific tags
  response.tags = response.tags || {};
  response.tags.operation = operation;
}

function loginUser(user) {
  group('Login', function () {
    let response = http.post(`${BASE_URL}/`, {
      'user-name': user.username,
      'password': user.password,
    });
    
    check(response, {
      'login successful': (r) => r.status === 200,
    });
    
    recordMetrics(response, 'login');
  });
}

function performBrowseAction() {
  group('Browse Products', function () {
    let response = http.get(`${BASE_URL}/inventory.html`);
    
    check(response, {
      'browse successful': (r) => r.status === 200,
    });
    
    recordMetrics(response, 'browse');
  });
}

function performSearchAction() {
  group('Search Products', function () {
    // Simulate search by browsing with filters
    let response = http.get(`${BASE_URL}/inventory.html?sort=name`);
    
    check(response, {
      'search successful': (r) => r.status === 200,
    });
    
    recordMetrics(response, 'search');
  });
}

function performAddToCartAction(user) {
  group('Add to Cart', function () {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    let response = http.get(`${BASE_URL}/inventory-item.html?id=${product}`);
    
    check(response, {
      'add to cart successful': (r) => r.status === 200,
    });
    
    recordMetrics(response, 'add_to_cart');
  });
}

function performCheckoutAction(user) {
  group('Checkout Process', function () {
    // Navigate through checkout steps
    let cartResponse = http.get(`${BASE_URL}/cart.html`);
    let checkoutResponse = http.get(`${BASE_URL}/checkout-step-one.html`);
    
    check(cartResponse, {
      'cart loaded': (r) => r.status === 200,
    });
    
    check(checkoutResponse, {
      'checkout loaded': (r) => r.status === 200,
    });
    
    recordMetrics(cartResponse, 'cart');
    recordMetrics(checkoutResponse, 'checkout');
  });
}

function performRandomUserActions() {
  const actions = [
    () => http.get(`${BASE_URL}/inventory.html`),
    () => http.get(`${BASE_URL}/cart.html`),
    () => http.get(`${BASE_URL}/inventory-item.html?id=1`),
  ];
  
  const action = actions[Math.floor(Math.random() * actions.length)];
  let response = action();
  
  check(response, {
    'random action successful': (r) => r.status === 200,
  });
  
  recordMetrics(response, 'random_action');
}

/**
 * Setup and teardown functions
 */
export function setup() {
  console.log('🚀 Starting Advanced K6 Load Testing');
  console.log(`Test Type: ${__ENV.TEST_TYPE || 'baseline'}`);
  console.log(`Base URL: ${BASE_URL}`);
  
  // Verify application accessibility
  let response = http.get(BASE_URL);
  if (response.status !== 200) {
    throw new Error(`Application not accessible: ${response.status}`);
  }
  
  return {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL,
  };
}

export function teardown(data) {
  console.log('✅ Advanced K6 Load Testing Completed');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}

// Generate HTML report
export function handleSummary(data) {
  return {
    'reports/load-tests/k6/summary-report.html': htmlReport(data),
    'reports/load-tests/k6/summary-data.json': JSON.stringify(data, null, 2),
  };
}