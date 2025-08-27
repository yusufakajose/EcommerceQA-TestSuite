# Performance Testing Implementation

This document outlines the comprehensive performance testing framework implemented using Apache JMeter and k6 for the e-commerce application.

## Overview

The performance testing framework provides:

- JMeter test plans for critical user journeys
- Automated test execution with configurable parameters
- Comprehensive reporting and analysis
- Integration with CI/CD pipelines
- Performance baseline establishment and monitoring

## Architecture

### Test Plan Structure

```
JMeter Test Plans
├── User Authentication Load Test
│   ├── User Registration Flow
│   ├── User Login Flow
│   └── Profile Access Validation
├── Product Catalog Load Test
│   ├── Product Listing Performance
│   ├── Search Functionality Testing
│   ├── Filtering and Sorting Performance
│   └── Product Detail Page Access
└── Shopping Cart and Checkout Load Test
    ├── Cart Management Operations
    ├── Item Addition/Removal Performance
    ├── Checkout Process Testing
    └── Payment Processing Validation
```

### Execution Framework

````
Performance Testing Framework
├── JMeter Test Plans (.jmx files)
├── Test Data Management (CSV files)
├── Execution Scripts (Bash and Node.js)
├── Result Processing and Analysis
└── Report Generation and Visualization

### k6 Load Testing (HTTP/API)

We use k6 for lightweight HTTP/API load and smoke tests alongside JMeter.

- Script location: `automated-tests/load-tests/k6-load-tests.js`
- Base URL: read from environment variable `BASE_URL` (e.g. `BASE_URL=https://staging.example.com`)
- Scenarios: smoke, load, stress, spike, volume (selected via `TEST_TYPE`)
- Per-endpoint tagging: requests are tagged (e.g. `name: home`, `login`, `inventory`), enabling scoped thresholds
- Outputs (written per scenario type, e.g. `smoke`, `load`):
  - JSON summary: `reports/load-tests/k6/<scenario>-summary.json`
  - JUnit XML: `reports/load-tests/k6/<scenario>-results.junit.xml`
  - Console: human-readable text summary

Fail-fast thresholds are enabled for critical metrics using k6 `abortOnFail`, so CI can stop early when SLOs are exceeded.

#### Wrapper CLI

Use the wrapper to standardize execution and outputs:

```bash
# Single scenario
node scripts/load-testing/k6-wrapper.js --types load

# Multiple scenarios
node scripts/load-testing/k6-wrapper.js --types smoke,load,stress

# Override base URL and k6 args
BASE_URL=https://staging.example.com \
node scripts/load-testing/k6-wrapper.js --types load --k6-args "--vus 10 --duration 2m"
````

The wrapper sets `TEST_TYPE` per run and writes streaming JSONL to `reports/load-tests/k6/<type>-results.json`. The script’s `handleSummary` also emits per-type:

- `<type>-summary.json` with fields:
  - `metrics.total_requests`, `metrics.error_rate`
  - `metrics.http_req_duration`: `min`, `med`, `avg`, `p90`, `p95`, `p99`, `max`
  - `duration_seconds`, `request_rate_rps`
  - `thresholds.ok` and `status` (PASS/FAIL)
- `<type>-results.junit.xml` summarizing threshold status

Environment variables:

- `BASE_URL` target host (defaults to SauceDemo)
- `K6_SUMMARY_PATH` optional override for summary JSON output path
  - See `.env.example` for placeholders

````

## Test Plans Implementation

### 1. User Authentication Load Test

**File**: `user-authentication-load-test.jmx`

**Test Scenarios**:
- **User Registration**: Creates unique users with dynamic data generation
- **User Login**: Validates authentication with registered credentials
- **Profile Access**: Tests authenticated API access with JWT tokens

**Key Features**:
- Dynamic user data generation using JMeter functions
- Authentication token extraction and variable storage
- Response time assertions for performance validation
- Realistic think times between user actions

**Performance Targets**:
- Registration: < 2000ms response time
- Login: < 1500ms response time
- Profile access: < 1000ms response time

### 2. Product Catalog Load Test

**File**: `product-catalog-load-test.jmx`

**Test Scenarios**:
- **Product Listing**: Tests pagination and product retrieval
- **Search Functionality**: Validates search performance with various queries
- **Filtering and Sorting**: Tests category, price, and sorting operations
- **Product Details**: Measures individual product page performance

**Key Features**:
- CSV data-driven search terms and filter parameters
- Random pagination and sorting parameter generation
- Product ID extraction for subsequent requests
- Response time validation for different operations

**Performance Targets**:
- Product listing: < 1500ms response time
- Search operations: < 2000ms response time
- Product details: < 1000ms response time
- Filter operations: < 1800ms response time

### 3. Shopping Cart and Checkout Load Test

**File**: `shopping-cart-checkout-load-test.jmx`

**Test Scenarios**:
- **Cart Creation**: Tests cart initialization for users
- **Item Management**: Validates add/remove/update operations
- **Checkout Process**: Tests complete purchase flow
- **Payment Processing**: Validates payment method handling

**Key Features**:
- CSV data-driven product and payment information
- Cart state management across multiple requests
- Extended timeouts for complex checkout operations
- Payment method variation testing

**Performance Targets**:
- Cart operations: < 1500ms response time
- Checkout process: < 5000ms response time
- Payment processing: < 3000ms response time

## Test Data Management

### Dynamic Data Generation
- **User Registration**: Unique emails and usernames using thread numbers and timestamps
- **Product Selection**: Random product IDs from available catalog
- **Payment Methods**: Rotation through different payment options

### CSV Data Files
- **Search Terms**: Product search queries with categories and price ranges
- **Cart Test Data**: Product IDs, quantities, and payment methods
- **Performance Test Data**: User scenarios for load simulation

## Execution Scripts

### Node.js Runner (`jmeter-runner.js`)

**Features**:
- Cross-platform JMeter execution
- Configurable test parameters
- Automated report generation
- Error handling and logging
- Integration with npm scripts

**Usage**:
```bash
node automated-tests/performance-tests/scripts/jmeter-runner.js \
  --base-url http://staging.example.com \
  --users 100 \
  --ramp-up 120 \
  --loops 10
````

### Bash Script (`run-jmeter-tests.sh`)

**Features**:

- Native JMeter command-line execution
- Comprehensive parameter validation
- Colored output for better readability
- Consolidated report generation
- Shell environment integration

**Usage**:

```bash
./automated-tests/performance-tests/scripts/run-jmeter-tests.sh \
  --users 150 \
  --ramp-up 180 \
  --base-url http://production.example.com \
  all
```

## NPM Script Integration

### Available Scripts

```bash
# Basic performance testing
npm run test:performance                    # Run all performance tests
npm run test:performance:auth              # User authentication tests only
npm run test:performance:catalog           # Product catalog tests only
npm run test:performance:cart              # Shopping cart tests only

# Load and stress testing
npm run test:performance:load              # Load test (100 users)
npm run test:performance:stress            # Stress test (200 users)
```

### Configuration Options

- **Users**: Number of concurrent virtual users
- **Ramp-up**: Time to reach full user load
- **Loops**: Number of iterations per user
- **Base URL**: Target application URL

## Reporting and Analysis

### Report Types

#### 1. JMeter HTML Dashboard Reports

- **Interactive Visualizations**: Charts and graphs for performance metrics
- **Response Time Analysis**: Average, median, 90th percentile breakdowns
- **Throughput Metrics**: Requests per second over time
- **Error Analysis**: Detailed failure information and patterns

#### 2. Consolidated Performance Report

- **Test Summary**: Overall performance test results
- **Cross-Test Comparison**: Performance metrics across different modules
- **Trend Analysis**: Performance changes over time
- **Recommendations**: Actionable performance improvement suggestions

#### 3. Raw Result Files

- **JTL Files**: Detailed test execution data
- **Log Files**: JMeter execution logs and debugging information
- **CSV Exports**: Performance data for external analysis

### Key Performance Indicators

#### Response Time Metrics

- **Average Response Time**: Mean response time across all requests
- **Median Response Time**: 50th percentile response time
- **90th Percentile**: Response time for 90% of requests
- **95th Percentile**: Response time for 95% of requests

#### Throughput Metrics

- **Requests per Second**: Transaction rate under load
- **Bytes per Second**: Data transfer rate
- **Concurrent Users**: Active user simulation count

#### Error Metrics

- **Error Rate**: Percentage of failed requests
- **Error Types**: Categorization of failure reasons
- **Error Distribution**: Error patterns across test duration

## Performance Thresholds and SLAs

### Response Time Targets

| Operation        | Target   | Warning     | Critical |
| ---------------- | -------- | ----------- | -------- |
| User Login       | < 1500ms | 1500-2500ms | > 2500ms |
| Product Search   | < 2000ms | 2000-3000ms | > 3000ms |
| Cart Operations  | < 1500ms | 1500-2500ms | > 2500ms |
| Checkout Process | < 5000ms | 5000-8000ms | > 8000ms |

### Throughput Targets

| Load Level  | Target TPS | Warning     | Critical  |
| ----------- | ---------- | ----------- | --------- |
| Normal Load | > 50 TPS   | 30-50 TPS   | < 30 TPS  |
| Peak Load   | > 100 TPS  | 70-100 TPS  | < 70 TPS  |
| Stress Load | > 150 TPS  | 100-150 TPS | < 100 TPS |

### Error Rate Targets

| Scenario         | Acceptable | Warning | Critical |
| ---------------- | ---------- | ------- | -------- |
| Functional Tests | < 0.1%     | 0.1-1%  | > 1%     |
| Load Tests       | < 1%       | 1-3%    | > 3%     |
| Stress Tests     | < 5%       | 5-10%   | > 10%    |

## CI/CD Integration

### GitHub Actions Integration

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  performance-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install JMeter
        run: |
          wget https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.2.tgz
          tar -xzf apache-jmeter-5.6.2.tgz
          echo "$PWD/apache-jmeter-5.6.2/bin" >> $GITHUB_PATH

      - name: Run Performance Tests
        run: npm run test:performance:load
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload Performance Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: performance-test-reports
          path: |
            reports/performance-tests/
            automated-tests/performance-tests/jmeter/results/
          retention-days: 30
```

### Jenkins Pipeline Integration

```groovy
pipeline {
    agent any

    parameters {
        choice(
            name: 'TEST_TYPE',
            choices: ['load', 'stress', 'all'],
            description: 'Type of performance test to run'
        )
        string(
            name: 'USERS',
            defaultValue: '100',
            description: 'Number of concurrent users'
        )
        string(
            name: 'BASE_URL',
            defaultValue: 'http://staging.example.com',
            description: 'Target application URL'
        )
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'wget -q https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.2.tgz'
                sh 'tar -xzf apache-jmeter-5.6.2.tgz'
            }
        }

        stage('Performance Tests') {
            steps {
                script {
                    env.PATH = "${env.WORKSPACE}/apache-jmeter-5.6.2/bin:${env.PATH}"

                    switch(params.TEST_TYPE) {
                        case 'load':
                            sh "npm run test:performance:load"
                            break
                        case 'stress':
                            sh "npm run test:performance:stress"
                            break
                        default:
                            sh "npm run test:performance"
                    }
                }
            }
        }

        stage('Publish Reports') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports/performance-tests',
                    reportFiles: 'consolidated-performance-report.html',
                    reportName: 'Performance Test Report'
                ])

                archiveArtifacts artifacts: 'automated-tests/performance-tests/jmeter/results/*.jtl'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
```

## Best Practices

### Test Design Principles

1. **Realistic User Behavior**: Include appropriate think times and user patterns
2. **Data Variation**: Use diverse test data to simulate real-world scenarios
3. **Gradual Load Increase**: Implement proper ramp-up to avoid overwhelming the system
4. **Error Handling**: Include comprehensive assertions and error validation

### Test Execution Guidelines

1. **Environment Isolation**: Use dedicated performance testing environments
2. **Baseline Establishment**: Create performance baselines for comparison
3. **Monitoring Integration**: Monitor both application and infrastructure metrics
4. **Repeatability**: Ensure consistent test conditions and configurations

### Result Analysis Methodology

1. **Trend Analysis**: Compare performance results over time
2. **Bottleneck Identification**: Analyze response time patterns and resource utilization
3. **Capacity Planning**: Use results for infrastructure scaling decisions
4. **Performance Regression Detection**: Identify performance degradation early

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. JMeter Installation Issues

```bash
# Verify Java installation
java -version

# Check JMeter installation
jmeter --version

# Set JAVA_HOME if needed
export JAVA_HOME=/path/to/java
```

#### 2. Memory and Resource Issues

```bash
# Increase JMeter heap size
export JVM_ARGS="-Xms2g -Xmx8g"

# Monitor system resources
top -p $(pgrep -f jmeter)
```

#### 3. Network and Connectivity Issues

- Verify target application availability
- Check firewall and network configurations
- Validate SSL certificates for HTTPS endpoints
- Monitor network bandwidth utilization

#### 4. High Error Rates

- Reduce concurrent user count
- Increase ramp-up period
- Check application server capacity
- Analyze server logs for error patterns

### Performance Optimization Tips

#### JMeter Optimization

- Run tests in non-GUI mode for better performance
- Disable unnecessary listeners during execution
- Use efficient regular expressions in assertions
- Optimize CSV data set configurations

#### Test Environment Optimization

- Use dedicated performance testing infrastructure
- Ensure sufficient server resources (CPU, memory, disk)
- Optimize database configurations for load testing
- Monitor and tune application server settings

This comprehensive performance testing framework provides robust load testing capabilities for the e-commerce application, ensuring optimal performance under various load conditions and helping identify performance bottlenecks before they impact users.##
Task 5.2 Implementation: Advanced Load Testing Scenarios

### Realistic User Journey Simulation

#### Advanced Load Test Runner (`advanced-load-test-runner.js`)

**Key Features**:

- **Configurable Load Scenarios**: Pre-defined scenarios from light load to stress testing
- **Realistic User Behavior**: CSV-driven user journey data with different user types
- **Concurrent User Testing**: Configurable user counts with automatic scaling
- **Stress Testing**: Gradual load increase to identify system breaking points
- **Comprehensive Reporting**: Consolidated reports across multiple test scenarios

**Load Test Scenarios**:

```javascript
{
  "light_load": { users: 25, rampUp: 60, duration: 600 },
  "normal_load": { users: 50, rampUp: 120, duration: 900 },
  "peak_load": { users: 100, rampUp: 180, duration: 1200 },
  "heavy_load": { users: 200, rampUp: 300, duration: 1800 },
  "stress_load": { users: 300, rampUp: 450, duration: 2400 },
  "spike_load": { users: 150, rampUp: 30, duration: 300 },
  "endurance_load": { users: 75, rampUp: 300, duration: 3600 },
  "burst_load": { users: 250, rampUp: 60, duration: 600 }
}
```

#### User Journey Data Management

**User Behavior Patterns**:

- **Browser (40%)**: Users who browse without purchasing
- **Researcher (25%)**: Users who research products extensively
- **Shopper (30%)**: Users who actively shop and make purchases
- **Returner (5%)**: Returning users with specific purchase intent

**Realistic Think Times**:

- **Page Load**: 2-5 seconds for content comprehension
- **Product Browsing**: 3-8 seconds for product evaluation
- **Product Details**: 5-15 seconds for detailed review
- **Cart Operations**: 1-3 seconds for decision making
- **Checkout Process**: 30-90 seconds for form completion

### Think Time Calculator (`think-time-calculator.js`)

**Advanced Think Time Calculation**:

- **Action-Based Times**: Specific think times for different user actions
- **User Type Modifiers**: Adjustments for fast/normal/slow users
- **Device Modifiers**: Mobile vs desktop interaction patterns
- **Time-of-Day Modifiers**: Morning/afternoon/evening behavior differences

**User Journey Generation**:

```javascript
// Example user journeys
browser: ['page_load', 'browse_products', 'view_product_details', 'search_products'];
shopper: ['page_load', 'browse_products', 'add_to_cart', 'checkout_start', 'complete_purchase'];
researcher: ['search_products', 'filter_products', 'compare_products', 'read_reviews'];
```

**Performance Recommendations**:

- **Little's Law Application**: Concurrent Users = Throughput × Average Session Duration
- **Ramp-up Calculations**: 2-3 times average session duration
- **Test Duration**: Minimum 3 times ramp-up period for steady-state analysis

### Stress Testing Implementation

#### Stress Test Scenario (`stress-test-scenario.jmx`)

**Stepping Thread Group Configuration**:

- **Initial Load**: Start with baseline user count
- **Step Increases**: Gradual user count increases
- **Breaking Point Detection**: Monitor for performance degradation
- **Resource Monitoring**: Track system resource utilization

**Stress Testing Parameters**:

```bash
# Example stress test execution
node scripts/advanced-load-test-runner.js stress-test \
  --initial-users 50 \
  --max-users 500 \
  --step-users 50 \
  --step-duration 300
```

### Concurrent User Load Testing

#### Configurable User Counts

**Automatic Scaling Tests**:

```bash
# Test with increasing user counts
node scripts/advanced-load-test-runner.js concurrent-users 50,100,200,400,800

# Results show performance degradation points
User Count | Avg Response Time | Throughput | Error Rate
50         | 245ms            | 45 TPS     | 0.1%
100        | 380ms            | 78 TPS     | 0.3%
200        | 650ms            | 125 TPS    | 1.2%
400        | 1200ms           | 180 TPS    | 3.8%
800        | 2500ms           | 220 TPS    | 12.5%
```

**Breaking Point Identification**:

- **Response Time Degradation**: Monitor for exponential increases
- **Throughput Plateau**: Identify maximum sustainable throughput
- **Error Rate Spikes**: Detect system failure points
- **Resource Exhaustion**: CPU, memory, and connection limits

### Enhanced NPM Scripts

```bash
# Advanced load testing commands
npm run test:performance:advanced           # Comprehensive load testing suite
npm run test:performance:user-journey       # Realistic user journey simulation
npm run test:performance:stress-advanced    # Advanced stress testing
npm run test:performance:concurrent         # Concurrent user scaling tests
npm run test:performance:scenarios          # List available test scenarios

# Think time analysis
node scripts/think-time-calculator.js calculate view_product_details normal desktop
node scripts/think-time-calculator.js journey shopper medium
node scripts/think-time-calculator.js recommend 50 30000 true
```

### Load Test Configuration

#### Environment-Specific Configuration (`load-test-config.json`)

**Environment Profiles**:

- **Development**: Limited users (100), shorter timeouts
- **Staging**: Moderate users (300), production-like settings
- **Production**: Full scale (500+), extended timeouts

**Test Profiles**:

- **Smoke**: Quick validation (5 users, 5 minutes)
- **Baseline**: Performance baseline (25 users, 10 minutes)
- **Load**: Standard load test (100 users, 20 minutes)
- **Stress**: System limits (300 users, 30 minutes)
- **Endurance**: Sustained load (75 users, 2 hours)

### Performance Thresholds and SLAs

#### Response Time Targets

| User Load   | Excellent | Good     | Acceptable | Poor     |
| ----------- | --------- | -------- | ---------- | -------- |
| Light (25)  | < 200ms   | < 500ms  | < 1000ms   | > 1000ms |
| Normal (50) | < 300ms   | < 700ms  | < 1500ms   | > 1500ms |
| Peak (100)  | < 500ms   | < 1000ms | < 2000ms   | > 2000ms |
| Heavy (200) | < 800ms   | < 1500ms | < 3000ms   | > 3000ms |

#### Throughput Targets

| Load Level  | Minimum TPS | Target TPS | Optimal TPS |
| ----------- | ----------- | ---------- | ----------- |
| Light Load  | 15 TPS      | 25 TPS     | 35+ TPS     |
| Normal Load | 30 TPS      | 50 TPS     | 70+ TPS     |
| Peak Load   | 60 TPS      | 100 TPS    | 140+ TPS    |
| Heavy Load  | 100 TPS     | 150 TPS    | 200+ TPS    |

### Comprehensive Reporting

#### Load Test Report Features

**Multi-Scenario Analysis**:

- **Cross-Scenario Comparison**: Performance metrics across different load levels
- **Trend Analysis**: Performance degradation patterns
- **Breaking Point Identification**: System capacity limits
- **Resource Utilization**: CPU, memory, and network usage patterns

**Performance Visualizations**:

- **Response Time Trends**: Time-series analysis of response times
- **Throughput Patterns**: Requests per second over test duration
- **Error Rate Analysis**: Error distribution and patterns
- **User Load Correlation**: Performance vs concurrent user relationships

### Best Practices for Load Testing

#### Test Design Principles

**Realistic User Simulation**:

1. **Varied User Behavior**: Mix of browsers, researchers, and shoppers
2. **Realistic Think Times**: Based on actual user interaction patterns
3. **Gradual Load Increase**: Proper ramp-up to avoid system shock
4. **Session Continuity**: Maintain user sessions across multiple requests

**Load Pattern Design**:

1. **Baseline Establishment**: Start with known good performance
2. **Incremental Scaling**: Gradual user count increases
3. **Sustained Load**: Extended periods at target load levels
4. **Recovery Testing**: System behavior after load reduction

#### Execution Guidelines

**Test Environment Management**:

1. **Isolated Environment**: Dedicated performance testing infrastructure
2. **Consistent Conditions**: Repeatable test configurations
3. **Monitoring Integration**: Real-time system and application monitoring
4. **Data Management**: Consistent test data across runs

**Result Analysis**:

1. **Statistical Significance**: Multiple test runs for reliable results
2. **Percentile Analysis**: Focus on 90th and 95th percentile response times
3. **Correlation Analysis**: Identify relationships between metrics
4. **Trend Detection**: Monitor performance changes over time

### Integration with CI/CD

#### Automated Load Testing Pipeline

```yaml
name: Performance Testing Pipeline

on:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday at 2 AM
  workflow_dispatch:
    inputs:
      test_type:
        description: 'Type of performance test'
        required: true
        default: 'load'
        type: choice
        options:
          - smoke
          - load
          - stress
          - endurance

jobs:
  performance-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          npm ci
          npm install csv-parser

      - name: Install JMeter
        run: |
          wget https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.2.tgz
          tar -xzf apache-jmeter-5.6.2.tgz
          echo "$PWD/apache-jmeter-5.6.2/bin" >> $GITHUB_PATH

      - name: Run Performance Tests
        run: |
          case "${{ github.event.inputs.test_type || 'load' }}" in
            smoke)
              npm run test:performance:user-journey
              ;;
            load)
              npm run test:performance:advanced
              ;;
            stress)
              npm run test:performance:stress-advanced
              ;;
            endurance)
              node scripts/advanced-load-test-runner.js user-journey endurance_load
              ;;
          esac
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload Performance Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: performance-test-reports-${{ github.event.inputs.test_type || 'load' }}
          path: |
            reports/performance-tests/
            automated-tests/performance-tests/jmeter/results/
          retention-days: 30

      - name: Performance Regression Check
        run: |
          # Compare results with baseline and fail if performance degrades significantly
          node scripts/performance-regression-check.js
```

### Task 5.2 Completion Summary

**Advanced Load Testing Capabilities**:

- **Realistic User Journey Simulation**: CSV-driven user behavior patterns with proper think times
- **Configurable Load Scenarios**: 8 pre-defined scenarios from light load to stress testing
- **Concurrent User Testing**: Automatic scaling tests with breaking point identification
- **Stress Testing**: Gradual load increase with system limit detection
- **Think Time Calculator**: Advanced calculation based on user behavior and device types
- **Comprehensive Reporting**: Multi-scenario analysis with performance visualizations

**Key Features Implemented**:

- Realistic user behavior simulation with 4 distinct user types
- Advanced think time calculation with user/device/time modifiers
- Stress testing with stepping thread groups for breaking point identification
- Concurrent user load testing with configurable scaling patterns
- Comprehensive load test configuration management
- Enhanced reporting with cross-scenario performance analysis

The advanced load testing framework now provides sophisticated capabilities for realistic user journey simulation, proper think times and ramp-up patterns, concurrent user load testing with configurable user counts, and stress testing scenarios to identify system breaking points.

## SLO thresholds and CI gating

This project enforces Service Level Objectives (SLOs) for performance tests in CI:

- k6 thresholds (configured in `automated-tests/load-tests/k6-load-tests.js`):
  - Global: `http_req_failed` < 1% (fail-fast), `http_req_duration` p95 < 800 ms, p99 < 1500 ms (p99 fail-fast).
  - Per-endpoint: tagged thresholds for `home`, `login` (p99 fail-fast), `inventory`, `add_to_cart`, `cart`, and `product_detail`.
  - Artifacts per scenario (e.g. smoke, load):
    - JSON: `reports/load-tests/k6/<scenario>-summary.json`
    - JUnit: `reports/load-tests/k6/<scenario>-results.junit.xml`
  - Configure target host via `BASE_URL` env var.

- JMeter SLOs (enforced in `automated-tests/performance-tests/scripts/jmeter-runner.js`):
  - p95 < 800 ms, p99 < 1500 ms, error rate < 1%.
  - The runner parses the JTL, computes totals and per-label stats, and writes JSON summaries to `reports/performance-tests/summaries/<test>-summary.json`.

If thresholds are breached, the CI job fails. Tune SLOs by editing those files. Artifacts (HTML reports, JSON summaries) are uploaded by CI for inspection.

## JMeter streaming JTL parser and SLOs

- Parser: `scripts/load-testing/jmeter-jtl-parser.js` streams CSV JTL, aggregates metrics per label and overall, and computes p90/p95/p99 using t-digest. It outputs a JSON summary matching the shape consumed by the report UI.
- SLO config: `config/performance/jmeter-slo.json` defines global and per-label constraints for error_rate_pct, p95_ms, and throughput_rps. CI gating uses these; status is PASS/FAIL and breaches are listed.
- Runner integration: `scripts/load-testing/load-test-runner.js` invokes JMeter, parses the generated JTL with the streaming parser, and writes `<plan>-summary.json` alongside the JMeter HTML dashboard under `reports/load-tests/jmeter/`.
- Outputs per JMeter plan:
  - JTL: `reports/load-tests/jmeter/<plan>-results.jtl`
  - HTML: `reports/load-tests/jmeter/<plan>-report/index.html`
  - JSON: `reports/load-tests/jmeter/<plan>-summary.json`

Update SLOs as your system evolves and re-run to see breaches reflected in the load test report and CI results.

## Trend history, deltas, and artifact index

- Trend history: the load-test runner appends each execution to `reports/load-tests/test-history.json` (keeps last 20 runs) with k6 and JMeter key metrics.
- Trend deltas: the load-test HTML (`reports/load-test-report.html`) renders delta badges for p95, error rate, and throughput against the previous run. The executive dashboard also shows a compact widget for throughput/error delta between the last two runs.
- Artifacts index: `reports/index.html` links to the executive dashboard, performance and load reports, k6 combined JUnit, trend history JSON, CI job summary, and per-plan JMeter dashboards and JSON summaries.
