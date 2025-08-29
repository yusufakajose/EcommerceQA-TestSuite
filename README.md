# E-commerce QA Testing Showcase

[![CodeQL](https://github.com/yusufakajose/EcommerceQA-TestSuite/actions/workflows/codeql.yml/badge.svg)](https://github.com/yusufakajose/EcommerceQA-TestSuite/actions/workflows/codeql.yml)
[![ZAP Baseline](https://github.com/yusufakajose/EcommerceQA-TestSuite/actions/workflows/zap-baseline.yml/badge.svg)](https://github.com/yusufakajose/EcommerceQA-TestSuite/actions/workflows/zap-baseline.yml)

A comprehensive, production-ready QA testing framework demonstrating advanced testing methodologies, automation, and performance engineering capabilities.

## **Overview**

This showcase demonstrates world-class QA engineering skills through a complete testing framework that includes:

- **UI Automation Testing** with Playwright
- **API Performance Testing** with comprehensive monitoring
- **Load Testing Integration** with K6 and JMeter
- **Executive Reporting** with professional dashboards
- **CI/CD Integration** ready for DevOps pipelines

## **Key Achievements**

- **36+ Automated Tests** with 100% pass rate
- **Real-time Performance Monitoring** with industry baselines
- **Professional Executive Reports** with visual dashboards
- **Comprehensive Load Testing** with K6 and JMeter integration
- **API Performance Validation** with backend monitoring
- **Cross-browser Testing** across Chrome, Firefox, Safari
- **Mobile Testing** for responsive applications

## **Quick Start**

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ecommerce-qa-testsuite.git
cd ecommerce-qa-testsuite

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run the showcase demo
npm run demo:showcase
```

## **Test Execution**

### UI Testing

```bash
# Run all UI tests
npm run test:ui

# Cross-browser testing
npm run test:cross-browser

# Mobile testing
### UI Seeding and Clean State

You can pre-seed or reset UI state for more reliable runs:
## Visual Regression Testing

This repo includes Playwright-based visual comparisons using `expect(page).toHaveScreenshot()`.

- Run locally (Chromium only by default):
  - `npm run test:ui:vrt`
- Update baselines when a legitimate UI change occurs:
  - `npm run test:ui:vrt:update`

Notes:
- Baseline snapshots are checked into version control under `*-snapshots` folders next to the spec.
- To keep screenshots stable, animations are disabled and the caret is hidden by default in `config/playwright.config.js`.
- In CI, diffs on failures are uploaded as artifacts for review.


- Reset session/cart: `npm run seed:ui:reset`
- Seed login/logout: `npm run seed:ui:login`
- Seed cart items: `SEED_PRODUCT_IDS=1,2 npm run seed:ui:cart`

Important:

- Target URL comes from Playwright env configs at `config/environments/<env>.json` (select via `TEST_ENV`), or override with `BASE_URL`.
- If the target app isn’t running and `BASE_URL` points to localhost, login seeding will be skipped gracefully; reset still clears storage.
- For public demos set `TEST_ENV=development` (defaults to `https://www.saucedemo.com`) or `TEST_ENV=staging` (Magento demo).
npm run test:mobile
```

### API Testing

```bash
# Run API performance tests
npm run test:api

# Generate API performance report
npm run report:api
```

### Load Testing

```bash
# Comprehensive load testing (K6 + JMeter)
npm run test:load:comprehensive

# K6 load testing scenarios
npm run test:load:k6:smoke
npm run test:load:k6:stress

# New: k6 wrapper CLI examples
# Run multiple scenarios serially
npm run test:load:k6 -- --types=smoke,load
# Override VUs and duration
npm run test:load:k6 -- --types=load --vus 20 --duration 60s
# Target a different base URL
npm run test:load:k6 -- --types=smoke --base-url https://your-env.example.com

# JMeter load testing
npm run test:load:jmeter:all
```

### Reporting

```bash
# Generate executive summary
npm run report:executive

# Generate all reports
npm run report:all
```

### Contract Testing (Pact + Broker)

```bash
# Generate consumer pacts
npm run test:contract:consumer

# Publish pacts to Pact Broker (requires env vars)
npm run contract:publish

# Verify provider (uses Broker if configured)
npm run contract:verify

# Pre-deploy safety gate and record deployment
npm run contract:can-i-deploy
npm run contract:record-deployment
```

## **Test Results & Reports**

### Sample Performance Results

```
PERFORMANCE SUMMARY:
Page Load: 1403ms (Baseline: 3000ms) - EXCELLENT
Login Process: 271ms (Baseline: 2000ms) - EXCELLENT
Add to Cart: 169ms (Baseline: 1000ms) - EXCELLENT
API Response: 229ms average across 4 endpoints
Load Test: 19,000+ requests, 3.2% error rate
OVERALL STATUS: ALL METRICS EXCELLENT
```

### Generated Reports

- **Executive Dashboard**: `reports/executive-dashboard.html`
- **Performance Report**: `reports/performance-report.html`
- **API Performance**: `reports/api-performance-report.html`
- **Load Testing**: `reports/load-test-report.html`

## **Framework Architecture**

### Directory Structure

```
ecommerce-qa-testsuite/
├── automated-tests/
│   ├── ui-tests/           # Playwright UI tests
│   ├── api-tests/          # API performance tests
│   └── load-tests/         # K6 and JMeter load tests
├── scripts/
│   ├── reporting/          # Report generation
│   ├── load-testing/       # Load test orchestration
│   └── ci/                 # CI/CD utilities
├── config/                 # Test configurations
└── reports/                # Generated reports
```

### Key Components

- **Performance Monitoring**: Real-time performance validation with baselines
- **Executive Reporting**: Professional dashboards for stakeholders
- **Load Testing Integration**: K6 and JMeter unified framework
- **API Monitoring**: Backend performance and health checks
- **Cross-platform Testing**: Desktop and mobile coverage

## **Testing Capabilities**

### UI Testing

- **Functional Testing**: Complete e-commerce user journeys
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iOS Safari, Android Chrome
- **Performance Monitoring**: Real-time UI performance validation

### API Testing

- **Performance Testing**: Response time monitoring with baselines
- **Backend Monitoring**: Health checks and database operations
- **Load Testing**: Concurrent API request validation
- **Error Handling**: Timeout and error rate monitoring

### Load Testing

- **K6 Integration**: Modern JavaScript-based load testing
- **JMeter Integration**: Enterprise-grade load testing
- **Multiple Scenarios**: Smoke, Load, Stress, Spike, Endurance
- **Professional Reporting**: Comprehensive performance analysis

## **Performance Baselines**

| Metric        | Baseline | Current | Status    |
| ------------- | -------- | ------- | --------- |
| Page Load     | < 3000ms | 1403ms  | EXCELLENT |
| Login Process | < 2000ms | 271ms   | EXCELLENT |
| API Response  | < 500ms  | 229ms   | EXCELLENT |
| Add to Cart   | < 1000ms | 169ms   | EXCELLENT |
| Error Rate    | < 5%     | 3.2%    | GOOD      |

## **CI/CD Integration**

### GitHub Actions Ready

```yaml
# Example workflow integration
- name: Run QA Test Suite
  run: |
    npm run test
    npm run test:api
    npm run test:load:comprehensive
    npm run report:all
```

### Available Scripts

- `npm run ci:test` - CI-optimized test execution
- `npm run ci:load` - CI-optimized load testing
- `npm run report:all` - Generate all reports

## **What This Demonstrates**

### Professional QA Engineering Skills

- **Advanced Test Automation** - Comprehensive framework architecture
- **Performance Engineering** - Real-time monitoring and validation
- **Load Testing Expertise** - Multi-tool integration (K6 + JMeter)
- **Executive Communication** - Professional reporting and dashboards
- **DevOps Integration** - CI/CD ready automation

### Industry Best Practices

- **Performance-First Testing** - Performance validation in all test types
- **Data-Driven Quality** - Metrics-based decision making
- **Comprehensive Coverage** - UI, API, and Load testing integration
- **Professional Reporting** - Executive and technical stakeholder reports
- **Scalable Architecture** - Maintainable and extensible framework

## **Sample Reports**

### Executive Dashboard

![Executive Dashboard](docs/images/executive-dashboard.png)

### Performance Report

![Performance Report](docs/images/performance-report.png)

### Load Testing Report

![Load Testing Report](docs/images/load-test-report.png)

## **Contributing**

This is a showcase project demonstrating QA engineering capabilities. For questions or discussions about the implementation, please open an issue.

## **License**

MIT License - see [LICENSE](LICENSE) file for details.

## **Contact**

This showcase demonstrates advanced QA engineering capabilities including:

- UI Test Automation with Playwright
- API Performance Testing and Monitoring
- Load Testing with K6 and JMeter Integration
- Executive Reporting and Dashboards
- CI/CD Integration and DevOps Readiness

---

**This project showcases production-ready QA engineering skills suitable for senior-level positions in quality assurance, performance engineering, and test automation.**
