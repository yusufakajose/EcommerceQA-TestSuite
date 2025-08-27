# Performance Testing with JMeter

This directory contains JMeter performance test plans and execution scripts for the e-commerce application.

## Overview

The performance testing framework includes:

- JMeter test plans for different application modules
- Automated test execution scripts
- Data-driven testing capabilities
- Comprehensive reporting and analysis

## Directory Structure

```
automated-tests/performance-tests/
├── jmeter/
│   ├── test-plans/           # JMeter test plan files (.jmx)
│   ├── data/                 # Test data files (CSV)
│   └── results/              # Test execution results (.jtl)
├── scripts/                  # Execution scripts
│   ├── run-jmeter-tests.sh   # Bash script for JMeter execution
│   └── jmeter-runner.js      # Node.js wrapper for JMeter
└── README.md                 # This file
```

## Test Plans

### 1. User Authentication Load Test

**File**: `user-authentication-load-test.jmx`

**Scenarios**:

- User registration with unique data generation
- User login with credential validation
- User profile retrieval with authentication
- Response time and throughput validation

**Key Features**:

- Dynamic user data generation using thread numbers and timestamps
- Authentication token extraction and reuse
- Response time assertions (< 2000ms for login)
- Realistic think times between requests

### 2. Product Catalog Load Test

**File**: `product-catalog-load-test.jmx`

**Scenarios**:

- Product listing with pagination
- Product search with various terms
- Product filtering by category and price
- Product detail page access
- Sorting and advanced filtering

**Key Features**:

- CSV data-driven search terms and filters
- Random pagination and sorting parameters
- Response time assertions (< 1500ms for listing, < 2000ms for search)
- Product ID extraction for subsequent requests

### 3. Shopping Cart and Checkout Load Test

**File**: `shopping-cart-checkout-load-test.jmx`

**Scenarios**:

- Shopping cart creation and management
- Adding/removing items from cart
- Cart quantity updates
- Checkout process with payment validation
- Order creation and confirmation

**Key Features**:

- CSV data-driven product and payment data
- Cart state management across requests
- Extended timeouts for checkout operations (< 45s)
- Payment method variation testing

## Prerequisites

### JMeter Installation

1. **Download JMeter**:

   ```bash
   # Download from Apache JMeter website
   wget https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.2.tgz
   tar -xzf apache-jmeter-5.6.2.tgz
   ```

2. **Add to PATH**:

   ```bash
   export PATH=$PATH:/path/to/apache-jmeter-5.6.2/bin
   ```

3. **Verify Installation**:
   ```bash
   jmeter --version
   ```

### System Requirements

- Java 8 or higher
- Minimum 4GB RAM for load testing
- Sufficient disk space for results and reports

## Test Execution

### Using NPM Scripts

```bash
# Run all performance tests
npm run test:performance

# Run specific test modules
npm run test:performance:auth
npm run test:performance:catalog
npm run test:performance:cart

# Run load tests (100 users)
npm run test:performance:load

# Run stress tests (200 users)
npm run test:performance:stress
```

### Using Node.js Runner

```bash
# Basic execution
node automated-tests/performance-tests/scripts/jmeter-runner.js

# Custom configuration
node automated-tests/performance-tests/scripts/jmeter-runner.js \
  --base-url http://staging.example.com \
  --users 100 \
  --ramp-up 120 \
  --loops 10

# Run specific tests
node automated-tests/performance-tests/scripts/jmeter-runner.js \
  --test user-auth,product-catalog
```

### Using Bash Script

```bash
# Make script executable
chmod +x automated-tests/performance-tests/scripts/run-jmeter-tests.sh

# Run all tests
./automated-tests/performance-tests/scripts/run-jmeter-tests.sh

# Run with custom parameters
./automated-tests/performance-tests/scripts/run-jmeter-tests.sh \
  --users 150 \
  --ramp-up 180 \
  --base-url http://production.example.com \
  all
```

## Test Configuration

### Parameters

| Parameter  | Description                   | Default               | Range         |
| ---------- | ----------------------------- | --------------------- | ------------- |
| `users`    | Number of concurrent users    | 50                    | 1-1000        |
| `ramp_up`  | Ramp-up period in seconds     | 60                    | 10-600        |
| `loops`    | Number of iterations per user | 5                     | 1-100         |
| `base_url` | Target application URL        | http://localhost:3000 | Any valid URL |

### Test Data

#### Search Terms (`search-terms.csv`)

- Product search queries
- Category filters
- Price range filters
- Used for product catalog testing

#### Cart Test Data (`cart-test-data.csv`)

- Product IDs for cart operations
- Quantity variations
- Payment method options
- Used for shopping cart testing

## Results and Reporting

### Result Files

- **JTL Files**: Raw test results in JMeter format
- **Log Files**: JMeter execution logs
- **HTML Reports**: Interactive dashboard reports

### Report Locations

- Individual test reports: `reports/performance-tests/{test-name}-report/`
- Consolidated report: `reports/performance-tests/consolidated-performance-report.html`
- Raw results: `automated-tests/performance-tests/jmeter/results/`

### Key Metrics

- **Response Time**: Average, median, 90th percentile
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Concurrent Users**: Active user simulation

## Performance Thresholds

### Response Time Targets

- **User Authentication**: < 2000ms
- **Product Listing**: < 1500ms
- **Product Search**: < 2000ms
- **Product Details**: < 1000ms
- **Cart Operations**: < 1500ms
- **Checkout Process**: < 5000ms

### Throughput Targets

- **Minimum**: 10 requests/second
- **Target**: 50 requests/second
- **Optimal**: 100+ requests/second

### Error Rate Targets

- **Acceptable**: < 1%
- **Warning**: 1-5%
- **Critical**: > 5%

## Troubleshooting

### Common Issues

1. **JMeter Not Found**

   ```bash
   # Verify JMeter installation
   which jmeter
   jmeter --version
   ```

2. **Out of Memory Errors**

   ```bash
   # Increase JMeter heap size
   export JVM_ARGS="-Xms1g -Xmx4g"
   ```

3. **Connection Timeouts**
   - Increase timeout values in test plans
   - Check network connectivity
   - Verify target server capacity

4. **High Error Rates**
   - Reduce concurrent users
   - Increase ramp-up period
   - Check server logs for errors

### Performance Tuning

1. **JMeter Optimization**
   - Run in non-GUI mode
   - Disable unnecessary listeners
   - Use CSV data sets efficiently
   - Monitor JMeter resource usage

2. **Test Environment**
   - Use dedicated test environment
   - Ensure sufficient server resources
   - Monitor system metrics during tests
   - Isolate network traffic

## Best Practices

### Test Design

1. **Realistic User Behavior**: Include appropriate think times
2. **Data Variation**: Use CSV data sets for realistic scenarios
3. **Gradual Load**: Implement proper ramp-up patterns
4. **Error Handling**: Include assertions and error validation

### Test Execution

1. **Baseline Testing**: Establish performance baselines
2. **Incremental Load**: Gradually increase load to find limits
3. **Monitoring**: Monitor both client and server metrics
4. **Repeatability**: Ensure consistent test conditions

### Result Analysis

1. **Trend Analysis**: Compare results over time
2. **Bottleneck Identification**: Analyze response time patterns
3. **Capacity Planning**: Use results for scaling decisions
4. **Performance Regression**: Detect performance degradation

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Performance Tests
  run: |
    npm run test:performance:load
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}

- name: Upload Performance Reports
  uses: actions/upload-artifact@v4
  with:
    name: performance-test-reports
    path: reports/performance-tests/
```

### Jenkins Pipeline Example

```groovy
stage('Performance Tests') {
    steps {
        sh 'npm run test:performance'
        publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'reports/performance-tests',
            reportFiles: 'consolidated-performance-report.html',
            reportName: 'Performance Test Report'
        ])
    }
}
```

This performance testing framework provides comprehensive load testing capabilities for the e-commerce application, ensuring optimal performance under various load conditions.
