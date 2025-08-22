# Test Execution and Reporting Framework

## Overview

The Test Execution and Reporting Framework provides a comprehensive solution for automated test execution, result aggregation, and detailed reporting with CI/CD integration. This framework orchestrates test execution across multiple environments and browsers, generates comprehensive reports with screenshots and videos, and provides automated notifications for test results.

## Architecture

### Core Components

1. **TestExecutor** - Orchestrates test execution across environments and browsers
2. **NotificationManager** - Handles email notifications for test results
3. **ReportGenerator** - Creates comprehensive HTML reports with media
4. **CIResultsAggregator** - Aggregates results in CI/CD environments
5. **TestRunner** - Main orchestration script

### Key Features

- ✅ **Parallel Execution** - Run tests across multiple environments and browsers simultaneously
- ✅ **Comprehensive Reporting** - HTML reports with screenshots, videos, and traces
- ✅ **Email Notifications** - Automated notifications for failures and summaries
- ✅ **Trend Analysis** - Historical test performance tracking
- ✅ **CI/CD Integration** - GitHub Actions workflow with artifact management
- ✅ **Media Management** - Automatic collection and organization of test artifacts
- ✅ **Dashboard Views** - Interactive charts and visualizations

## Quick Start

### Basic Usage

```bash
# Run tests with default configuration
npm test

# Run tests for specific environment
npm run test:all:staging

# Run cross-browser tests
npm run test:cross-browser

# Run with custom configuration
node scripts/run-tests.js -e staging,production -b chromium,firefox -w 8
```

### Command Line Options

```bash
node scripts/run-tests.js [options]

Options:
  -e, --environments <envs>    Comma-separated environments (default: development)
  -b, --browsers <browsers>    Comma-separated browsers (default: chromium)
  -w, --workers <number>       Number of parallel workers (default: 4)
  -t, --timeout <seconds>      Test timeout in seconds (default: 300)
  -r, --retries <number>       Number of retries (default: 2)
  -p, --pattern <pattern>      Test file pattern to run
  --no-notifications           Disable email notifications
  --clean                      Clean previous results (default)
  --no-clean                   Don't clean previous results
  -h, --help                   Show help message
```

## Configuration

### Configuration File

Create `config/test-execution.json`:

```json
{
  "execution": {
    "maxParallelWorkers": 4,
    "timeout": 300000,
    "retries": 2,
    "environments": ["development", "staging"],
    "browsers": ["chromium", "firefox", "webkit"],
    "outputDir": "./test-results",
    "reportDir": "./reports",
    "cleanPreviousResults": true
  },
  "notifications": {
    "enabled": true,
    "thresholds": {
      "criticalFailureRate": 50,
      "warningFailureRate": 20,
      "maxDurationIncrease": 100
    }
  },
  "reporting": {
    "generateComprehensive": true,
    "includeScreenshots": true,
    "includeVideos": true,
    "includeTraces": true,
    "generateTrends": true
  }
}
```

### Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Notification Settings
NOTIFICATION_FROM=noreply@yourcompany.com
SUMMARY_RECIPIENTS=team@yourcompany.com,manager@yourcompany.com
FAILURE_RECIPIENTS=dev-team@yourcompany.com
CRITICAL_RECIPIENTS=oncall@yourcompany.com
NOTIFICATIONS_ENABLED=true
```

## Test Execution

### Local Execution

```bash
# Basic test run
npm test

# Environment-specific runs
npm run test:all:dev
npm run test:all:staging
npm run test:all:prod

# Browser-specific runs
npm run test:cross-browser

# Performance testing
npm run test:parallel

# Smoke tests only
npm run test:smoke

# Full regression suite
npm run test:regression
```

### Programmatic Usage

```javascript
const TestExecutor = require('./scripts/test-execution/TestExecutor');

const executor = new TestExecutor({
  environments: ['staging', 'production'],
  browsers: ['chromium', 'firefox'],
  maxParallelWorkers: 8,
  retries: 3
});

const results = await executor.executeTests();
console.log(`Tests completed: ${results.passed}/${results.total} passed`);
```

## Reporting

### Report Types

1. **JSON Report** - Machine-readable test results
2. **HTML Report** - Human-readable summary with charts
3. **JUnit XML** - CI/CD integration format
4. **Comprehensive Report** - Detailed report with media
5. **Dashboard** - Interactive visualizations

### Generated Reports

```
reports/
├── test-results.json           # JSON results
├── test-report.html           # HTML summary
├── junit-results.xml          # JUnit XML
├── trend-analysis.json        # Historical trends
├── test-history.json          # Test history
└── comprehensive/
    ├── index.html             # Main comprehensive report
    ├── dashboard.html         # Interactive dashboard
    ├── media-gallery.html     # Media gallery
    ├── environment-*.html     # Environment reports
    └── browser-*.html         # Browser reports
```

### Accessing Reports

```bash
# Open main HTML report
open reports/test-report.html

# Open comprehensive report
open reports/comprehensive/index.html

# Open dashboard
npm run report:dashboard

# Generate comprehensive report manually
npm run report:comprehensive
```

## Notifications

### Email Notifications

The framework sends three types of email notifications:

1. **Summary Notifications** - Sent after each test run
2. **Failure Notifications** - Sent when tests fail
3. **Trend Notifications** - Sent when significant trends are detected

### Notification Configuration

```javascript
const NotificationManager = require('./scripts/notifications/NotificationManager');

const notificationManager = new NotificationManager({
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  },
  recipients: {
    summary: ['team@company.com'],
    failures: ['dev-team@company.com'],
    critical: ['oncall@company.com']
  },
  thresholds: {
    criticalFailureRate: 50,
    warningFailureRate: 20
  }
});
```

### Notification Content

- **HTML Format** - Rich formatting with charts and tables
- **Text Format** - Plain text fallback
- **Attachments** - JSON and HTML reports attached
- **Severity Levels** - Critical, Warning, Minor, Success

## CI/CD Integration

### GitHub Actions Workflow

The framework includes a complete GitHub Actions workflow:

```yaml
# .github/workflows/test-execution.yml
name: Automated Test Execution

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:     # Manual trigger
```

### Workflow Features

- **Matrix Strategy** - Parallel execution across environments/browsers
- **Artifact Management** - Automatic collection of test results
- **PR Comments** - Test results posted to pull requests
- **Failure Handling** - Graceful error handling and reporting
- **Cleanup** - Automatic cleanup of old artifacts

### CI/CD Commands

```bash
# Aggregate CI results
npm run ci:aggregate

# Generate reports in CI
npm run report:comprehensive

# Clean up old reports
npm run clean:reports
```

## Media Management

### Automatic Collection

The framework automatically collects and organizes:

- **Screenshots** - Failure screenshots and visual comparisons
- **Videos** - Test execution recordings
- **Traces** - Playwright trace files
- **Attachments** - Additional test artifacts

### Media Organization

```
test-results/
├── environment1/
│   ├── browser1/
│   │   ├── screenshots/
│   │   ├── videos/
│   │   └── traces/
│   └── browser2/
└── environment2/
```

### Media Gallery

Access the media gallery at `reports/comprehensive/media-gallery.html`:

- **Filterable** - Filter by environment, browser, or test name
- **Searchable** - Search through test artifacts
- **Lightbox** - Click to view full-size media
- **Downloadable** - Direct download links for traces

## Trend Analysis

### Historical Tracking

The framework tracks test performance over time:

- **Pass Rate Trends** - Track success rates
- **Duration Trends** - Monitor execution time
- **Failure Patterns** - Identify recurring issues
- **Environment Comparison** - Compare across environments

### Trend Data

```json
{
  "totalRuns": 30,
  "recentRuns": 5,
  "trends": {
    "passRate": {
      "current": 95.2,
      "previous": 92.1,
      "change": 3.1,
      "trend": "improving"
    },
    "duration": {
      "current": 180000,
      "previous": 165000,
      "change": 15000,
      "trend": "declining"
    }
  }
}
```

## Advanced Features

### Parallel Execution

```javascript
// Configure parallel execution
const executor = new TestExecutor({
  maxParallelWorkers: 8,
  environments: ['dev', 'staging', 'prod'],
  browsers: ['chromium', 'firefox', 'webkit']
});

// This will run 3 environments × 3 browsers = 9 parallel executions
// with up to 8 workers total
```

### Custom Reporters

```javascript
// Add custom reporter
const executor = new TestExecutor({
  customReporters: [
    {
      name: 'slack',
      config: { webhook: 'https://hooks.slack.com/...' }
    }
  ]
});
```

### Test Filtering

```bash
# Run specific test patterns
node scripts/run-tests.js -p "**/*smoke*"
node scripts/run-tests.js -p "**/auth/**"
node scripts/run-tests.js -p "**/*.regression.spec.js"
```

## Troubleshooting

### Common Issues

1. **SMTP Authentication Errors**
   ```bash
   # Use app-specific passwords for Gmail
   # Enable 2FA and generate app password
   ```

2. **Parallel Execution Timeouts**
   ```bash
   # Reduce parallel workers or increase timeout
   node scripts/run-tests.js -w 2 -t 600
   ```

3. **Missing Dependencies**
   ```bash
   npm install
   npx playwright install
   ```

4. **Report Generation Failures**
   ```bash
   # Ensure output directories exist
   mkdir -p reports test-results
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=test-executor node scripts/run-tests.js

# Verbose output
node scripts/run-tests.js --verbose
```

## Best Practices

### Configuration Management

1. **Environment-Specific Configs** - Use different configs per environment
2. **Secret Management** - Store SMTP credentials securely
3. **Resource Limits** - Configure appropriate worker counts
4. **Timeout Settings** - Set realistic timeouts for your tests

### CI/CD Integration

1. **Artifact Retention** - Configure appropriate retention periods
2. **Notification Filtering** - Avoid notification spam
3. **Parallel Limits** - Don't overwhelm CI resources
4. **Failure Handling** - Implement proper error handling

### Reporting

1. **Media Cleanup** - Regularly clean old media files
2. **Trend Analysis** - Monitor trends for performance regression
3. **Report Sharing** - Make reports accessible to stakeholders
4. **Historical Data** - Maintain test history for analysis

## API Reference

### TestExecutor

```javascript
class TestExecutor {
  constructor(config)
  async executeTests(options)
  async prepareExecution()
  async executeTestSuite(config)
  async processResults(results)
  async generateReports()
}
```

### NotificationManager

```javascript
class NotificationManager {
  constructor(config)
  async sendSummaryNotification(results, trends)
  async sendFailureNotification(results, failures)
  async sendTrendNotification(trends)
  calculateSeverity(results)
}
```

### ReportGenerator

```javascript
class ReportGenerator {
  constructor()
  async generateReport()
  async generateMainReport(results, media)
  async generateDetailedReports(results, media)
  async generateMediaGallery(media)
}
```

## Examples

### Basic Test Execution

```javascript
const TestRunner = require('./scripts/run-tests');

const runner = new TestRunner();
await runner.run();
```

### Custom Configuration

```javascript
const TestExecutor = require('./scripts/test-execution/TestExecutor');

const executor = new TestExecutor({
  environments: ['staging'],
  browsers: ['chromium', 'firefox'],
  maxParallelWorkers: 4,
  timeout: 600000,
  retries: 3,
  outputDir: './custom-results',
  reportDir: './custom-reports'
});

const results = await executor.executeTests({
  testPattern: '**/*critical*'
});
```

### Notification Setup

```javascript
const NotificationManager = require('./scripts/notifications/NotificationManager');

const notifications = new NotificationManager({
  enabled: true,
  smtp: {
    host: process.env.SMTP_HOST,
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  recipients: {
    summary: ['team@company.com'],
    failures: ['dev@company.com'],
    critical: ['oncall@company.com']
  }
});

await notifications.sendSummaryNotification(results);
```

## Conclusion

The Test Execution and Reporting Framework provides a complete solution for automated testing with comprehensive reporting and CI/CD integration. It supports parallel execution, detailed reporting, automated notifications, and trend analysis, making it suitable for enterprise-level testing requirements.

For additional support or feature requests, please refer to the project documentation or create an issue in the repository.