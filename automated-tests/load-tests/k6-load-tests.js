/* eslint-disable no-empty, no-constant-condition, no-redeclare */
/* global __ENV */
/**
 * K6 Load Testing Suite
 * Comprehensive load testing scenarios for e-commerce application
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let requestCount = new Counter('requests');

// Test configuration
const allScenarios = {
  // Smoke Test - Basic functionality check
  smoke_test: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
    tags: { test_type: 'smoke' },
  },

  // Load Test - Normal expected load
  load_test: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 10 }, // Ramp up to 10 users
      { duration: '5m', target: 10 }, // Stay at 10 users
      { duration: '2m', target: 0 }, // Ramp down
    ],
    tags: { test_type: 'load' },
  },

  // Stress Test - Beyond normal capacity
  stress_test: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 20 }, // Ramp up to 20 users
      { duration: '5m', target: 20 }, // Stay at 20 users
      { duration: '2m', target: 50 }, // Ramp up to 50 users
      { duration: '5m', target: 50 }, // Stay at 50 users
      { duration: '2m', target: 0 }, // Ramp down
    ],
    tags: { test_type: 'stress' },
  },

  // Spike Test - Sudden traffic spikes
  spike_test: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 10 }, // Normal load
      { duration: '30s', target: 100 }, // Spike to 100 users
      { duration: '1m', target: 10 }, // Back to normal
      { duration: '30s', target: 0 }, // Ramp down
    ],
    tags: { test_type: 'spike' },
  },

  // Volume Test - Large amounts of data
  volume_test: {
    executor: 'constant-vus',
    vus: 5,
    duration: '10m',
    tags: { test_type: 'volume' },
  },
};

const typeToKey = {
  smoke: 'smoke_test',
  load: 'load_test',
  stress: 'stress_test',
  spike: 'spike_test',
  volume: 'volume_test',
};

const selectedType = (__ENV.TEST_TYPE || 'load').toLowerCase();
const selectedKey = typeToKey[selectedType] || 'load_test';

export let options = {
  scenarios: selectedType === 'all' ? allScenarios : { [selectedKey]: allScenarios[selectedKey] },
  // Performance thresholds
  thresholds: {
    // SLOs: keep reasonably strict but CI-friendly; override in script if needed
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '20s' }], // <1% errors
    http_req_duration: [
      'p(95)<800',
      { threshold: 'p(99)<1500', abortOnFail: true, delayAbortEval: '30s' },
    ], // p95 < 800ms, p99 < 1500ms
    errors: ['rate<0.01'], // custom error rate aligned to <1%
    // Endpoint-specific thresholds (tagged via request params)
    'http_req_duration{endpoint:home}': ['p(95)<800'],
    'http_req_duration{endpoint:login}': [
      'p(95)<1000',
      { threshold: 'p(99)<2000', abortOnFail: true, delayAbortEval: '30s' },
    ],
    'http_req_duration{endpoint:inventory}': ['p(95)<900'],
    'http_req_duration{endpoint:add_to_cart}': ['p(95)<1000'],
    'http_req_duration{endpoint:cart}': ['p(95)<900'],
    'http_req_duration{endpoint:product_detail}': ['p(95)<1200'],
  },
};

// Test data
const testUsers = [
  { username: 'standard_user', password: 'secret_sauce' },
  { username: 'problem_user', password: 'secret_sauce' },
  { username: 'performance_glitch_user', password: 'secret_sauce' },
];

const products = [
  'sauce-labs-backpack',
  'sauce-labs-bike-light',
  'sauce-labs-bolt-t-shirt',
  'sauce-labs-fleece-jacket',
  'sauce-labs-onesie',
  'test.allthethings()-t-shirt-(red)',
];

// Base URL configuration (overridable via env)
const BASE_URL = __ENV.BASE_URL || 'https://www.saucedemo.com';

export default function () {
  const testType = __ENV.TEST_TYPE || 'load';

  // Select random test user and product
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  const product = products[Math.floor(Math.random() * products.length)];

  // Execute test scenario based on type
  switch (testType) {
    case 'smoke':
      smokeTestScenario();
      break;
    case 'load':
      loadTestScenario(user, product);
      break;
    case 'stress':
      stressTestScenario(user, product);
      break;
    case 'spike':
      spikeTestScenario(user, product);
      break;
    case 'volume':
      volumeTestScenario(user, product);
      break;
    default:
      loadTestScenario(user, product);
  }
}

/**
 * Smoke Test Scenario - Basic functionality
 */
function smokeTestScenario() {
  let response = http.get(`${BASE_URL}/`, { tags: { endpoint: 'home', test_type: 'smoke' } });

  check(response, {
    'homepage loads': (r) => r.status === 200,
    'homepage has login form': (r) => r.body.includes('user-name'),
    'response time < 3s': (r) => r.timings.duration < 3000,
  });

  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  requestCount.add(1);

  sleep(1);
}

/**
 * Load Test Scenario - Normal user journey
 */
function loadTestScenario(user, product) {
  // 1. Load homepage
  let response = http.get(`${BASE_URL}/`, { tags: { endpoint: 'home', test_type: 'load' } });
  check(response, {
    'homepage loads': (r) => r.status === 200,
  });

  // 2. Login
  response = http.post(
    `${BASE_URL}/`,
    {
      'user-name': user.username,
      password: user.password,
    },
    { tags: { endpoint: 'login', test_type: 'load' } }
  );

  check(response, {
    'login successful': (r) => r.status === 200 && r.url.includes('inventory'),
    'login response time < 2s': (r) => r.timings.duration < 2000,
  });

  // 3. Browse products
  response = http.get(`${BASE_URL}/inventory.html`, {
    tags: { endpoint: 'inventory', test_type: 'load' },
  });
  check(response, {
    'inventory loads': (r) => r.status === 200,
    'products visible': (r) => r.body.includes('inventory_item'),
  });

  // 4. Add product to cart
  response = http.post(
    `${BASE_URL}/inventory-item.html`,
    {
      'add-to-cart': product,
    },
    { tags: { endpoint: 'add_to_cart', test_type: 'load' } }
  );

  // 5. View cart
  response = http.get(`${BASE_URL}/cart.html`, { tags: { endpoint: 'cart', test_type: 'load' } });
  check(response, {
    'cart loads': (r) => r.status === 200,
  });

  // Track metrics
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  requestCount.add(1);

  sleep(Math.random() * 2 + 1); // Random think time 1-3s
}

/**
 * Stress Test Scenario - High load user journey
 */
function stressTestScenario(user, product) {
  // Simulate more aggressive user behavior
  loadTestScenario(user, product);

  // Additional stress operations
  for (let i = 0; i < 3; i++) {
    let response = http.get(`${BASE_URL}/inventory.html`, {
      tags: { endpoint: 'inventory', test_type: 'stress' },
    });
    check(response, {
      [`stress_request_${i}_success`]: (r) => r.status === 200,
      [`stress_request_${i}_performance`]: (r) => r.timings.duration < 5000,
    });

    errorRate.add(response.status !== 200);
    responseTime.add(response.timings.duration);
    requestCount.add(1);

    sleep(0.5); // Shorter think time for stress
  }
}

/**
 * Spike Test Scenario - Sudden load increase
 */
function spikeTestScenario(user, product) {
  // Rapid fire requests to simulate spike
  const requests = [
    {
      method: 'GET',
      url: `${BASE_URL}/`,
      params: { tags: { endpoint: 'home', test_type: 'spike' } },
    },
    {
      method: 'GET',
      url: `${BASE_URL}/inventory.html`,
      params: { tags: { endpoint: 'inventory', test_type: 'spike' } },
    },
    {
      method: 'GET',
      url: `${BASE_URL}/cart.html`,
      params: { tags: { endpoint: 'cart', test_type: 'spike' } },
    },
  ];

  let responses = http.batch(requests);

  responses.forEach((response, index) => {
    check(response, {
      [`spike_batch_${index}_success`]: (r) => r.status === 200,
      [`spike_batch_${index}_performance`]: (r) => r.timings.duration < 3000,
    });

    errorRate.add(response.status !== 200);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  });

  sleep(0.1); // Very short think time for spike
}

/**
 * Volume Test Scenario - Large data operations
 */
function volumeTestScenario(user, product) {
  // Simulate operations with large amounts of data
  loadTestScenario(user, product);

  // Multiple product operations
  for (let i = 0; i < products.length; i++) {
    let response = http.get(`${BASE_URL}/inventory-item.html?id=${products[i]}`, {
      tags: { endpoint: 'product_detail', test_type: 'volume' },
    });
    check(response, {
      [`volume_product_${i}_load`]: (r) => r.status === 200,
    });

    errorRate.add(response.status !== 200);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  }

  sleep(1);
}

/**
 * Setup function - runs once before test
 */
export function setup() {
  console.log('🚀 Starting K6 Load Tests');
  console.log(`Test Type: ${__ENV.TEST_TYPE || 'load'}`);
  console.log(`Base URL: ${BASE_URL}`);

  // Verify application is accessible
  let response = http.get(BASE_URL, { tags: { endpoint: 'home', test_type: 'setup' } });
  if (response.status !== 200) {
    throw new Error(`Application not accessible: ${response.status}`);
  }

  return { startTime: new Date().toISOString() };
}

/**
 * Teardown function - runs once after test
 */
export function teardown(data) {
  console.log('✅ K6 Load Tests Completed');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}

/**
 * Custom end-of-test summary
 * - Writes JSON summary to K6_SUMMARY_PATH (or default)
 * - Prints human-readable summary to console
 */
export function handleSummary(data) {
  const testType = __ENV.TEST_TYPE || 'load';
  const summaryPath = __ENV.K6_SUMMARY_PATH || `reports/load-tests/k6/${testType}-summary.json`;

  // Safely extract key metrics
  const httpReqs = data.metrics.http_reqs?.values?.count || 0;
  const httpFailedRate = data.metrics.http_req_failed?.values?.rate || 0;
  const durVals = data.metrics.http_req_duration?.values || {};
  const p90 = durVals['p(90)'] ?? null;
  const p95 = durVals['p(95)'] ?? null;
  const p99 = durVals['p(99)'] ?? null;
  const min = durVals['min'] ?? null;
  const max = durVals['max'] ?? null;
  const med = durVals['med'] ?? null;

  // Duration and request rate from state if available (k6 >= v0.33 exposes testRunDurationMs)
  const durationMs =
    (data.state && (data.state.testRunDurationMs || data.state['testRunDurationMs'])) || null;
  const durationSec = durationMs ? Math.round(durationMs / 1000) : null;
  const reqRate = durationSec && httpReqs ? Number((httpReqs / durationSec).toFixed(2)) : null;

  // Evaluate threshold outcomes (if present in summary)
  const durThresh = data.metrics.http_req_duration?.thresholds || {};
  const failThresh = data.metrics.http_req_failed?.thresholds || {};
  // Determine pass status: all configured thresholds must be ok
  const thresholdOk = [
    ...Object.values(durThresh || {}).map((t) => t.ok !== false),
    ...Object.values(failThresh || {}).map((t) => t.ok !== false),
  ].every(Boolean);

  const payload = {
    generatedAt: new Date().toISOString(),
    testType,
    metrics: {
      total_requests: httpReqs,
      error_rate: httpFailedRate,
      http_req_duration: {
        min,
        med,
        avg: durVals['avg'] ?? null,
        p90,
        p95,
        p99,
        max,
      },
    },
    duration_seconds: durationSec,
    request_rate_rps: reqRate,
    thresholds: {
      http_req_failed: failThresh,
      http_req_duration: durThresh,
      ok: thresholdOk,
    },
    status: thresholdOk ? 'PASS' : 'FAIL',
  };

  // Minimal JUnit XML for CI ingestion summarizing threshold status
  const junitPath = `reports/load-tests/k6/${testType}-results.junit.xml`;
  const tests = 2; // http_req_failed and http_req_duration
  const failures = thresholdOk ? 0 : 1; // mark single failure if any threshold failed
  const suiteName = `k6-${testType}-thresholds`;
  const caseName = 'thresholds';
  const failureMessage = 'One or more k6 thresholds failed';
  const junitXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<testsuite name="${suiteName}" tests="${tests}" failures="${failures}">` +
    `<testcase classname="${suiteName}" name="${caseName}">` +
    `${thresholdOk ? '' : `<failure message="${failureMessage}"></failure>`}` +
    `</testcase>` +
    `</testsuite>\n`;

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [summaryPath]: JSON.stringify(payload, null, 2),
    [junitPath]: junitXml,
  };
}
