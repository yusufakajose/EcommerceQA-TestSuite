#!/usr/bin/env node
/**
 * CI/CD Test Runner
 * Optimized test execution for continuous integration environments
 */
const fs = require('fs');
const path = require('path');
const MasterTestRunner = require('./master-test-runner');
class CITestRunner extends MasterTestRunner {
    constructor() {
        super();
        this.ciConfig = {
            // CI-optimized test suites
            suites: {
                smoke: {
                    name: 'Smoke Tests',
                    suites: ['ui'],
                    environment: 'development',
                    browsers: ['chromium'],
                    timeout: 300000, // 5 minutes
                    parallel: true
                },
                regression: {
                    name: 'Regression Tests',
                    suites: ['ui', 'api'],
                    environment: 'staging',
                    browsers: ['chromium', 'firefox'],
                    timeout: 900000, // 15 minutes
                    parallel: true
                },
                full: {
                    name: 'Full Test Suite',
                    suites: ['ui', 'api', 'accessibility', 'security'],
                    environment: 'staging',
                    browsers: ['chromium', 'firefox', 'webkit'],
                    timeout: 1800000, // 30 minutes
                    parallel: true
                },
                performance: {
                    name: 'Performance Tests',
                    suites: ['performance'],
                    environment: 'staging',
                    timeout: 2400000, // 40 minutes
                    parallel: false
                },
                security: {
                    name: 'Security Tests',
                    suites: ['security', 'accessibility'],
                    environment: 'staging',
                    timeout: 900000, // 15 minutes
                    parallel: false
                }
            }
        };
    }
    /**
     * Execute CI test suite
     */
    async executeCITests(suiteType = 'smoke', options = {}) {
        console.log('🔄 CI/CD Test Execution Started');
        console.log(`Suite Type: ${suiteType}`);
        console.log(`CI Environment: ${process.env.CI ? 'Yes' : 'No'}`);
        console.log(`Branch: ${process.env.GITHUB_REF || process.env.GIT_BRANCH || 'unknown'}`);
        console.log(`Commit: ${process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'unknown'}`);
        const config = this.ciConfig.suites[suiteType];
        if (!config) {
            throw new Error(`Unknown CI suite type: ${suiteType}`);
        }
        // Merge CI config with options
        const testOptions = {
            ...config,
            ...options,
            generateReports: true,
            retryFailures: true,
            // CI-specific settings
            ci: true,
            headless: true,
            workers: this.getCIWorkers(),
            timeout: config.timeout
        };
        console.log(`\n📋 Executing ${config.name}...`);
        console.log(`Suites: ${config.suites.join(', ')}`);
        console.log(`Environment: ${config.environment}`);
        console.log(`Browsers: ${config.browsers?.join(', ') || 'default'}`);
        console.log(`Workers: ${testOptions.workers}`);
        const startTime = Date.now();
        try {
            // Set CI environment variables
            this.setCIEnvironmentVariables();
            // Execute tests
            const results = await this.executeAllTests(testOptions);
            // Process CI-specific results
            const ciResults = await this.processCIResults(results, suiteType);
            // Generate CI artifacts
            await this.generateCIArtifacts(ciResults);
            // Check quality gates
            const qualityGateResult = await this.checkQualityGates(ciResults);
            return {
                ...ciResults,
                qualityGate: qualityGateResult,
                ciMetadata: this.getCIMetadata()
            };
        }
        catch (error) {
            console.error('❌ CI test execution failed:', error);
            // Generate failure artifacts
            await this.generateFailureArtifacts(error, suiteType);
            throw error;
        }
    }
    /**
     * Get optimal number of workers for CI
     */
    getCIWorkers() {
        const cpus = require('os').cpus().length;
        const ciWorkers = process.env.CI_WORKERS ? parseInt(process.env.CI_WORKERS) : null;
        if (ciWorkers) {
            return Math.min(ciWorkers, cpus);
        }
        // Conservative worker count for CI stability
        return Math.min(Math.max(1, Math.floor(cpus / 2)), 4);
    }
    /**
     * Set CI-specific environment variables
     */
    setCIEnvironmentVariables() {
        process.env.CI = 'true';
        process.env.HEADLESS = 'true';
        process.env.NO_SANDBOX = 'true';
        // Playwright CI optimizations
        process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '0';
        // Reduce resource usage
        process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=4096';
    }
    /**
     * Process CI-specific results
     */
    async processCIResults(results, suiteType) {
        const ciResults = {
            ...results,
            ciSuite: suiteType,
            ciMetadata: this.getCIMetadata(),
            artifacts: {
                reports: [],
                screenshots: [],
                videos: [],
                logs: []
            },
            notifications: []
        };
        // Collect artifacts
        ciResults.artifacts = await this.collectCIArtifacts();
        // Generate notifications
        ciResults.notifications = this.generateNotifications(results);
        return ciResults;
    }
    /**
     * Get CI metadata
     */
    getCIMetadata() {
        return {
            ci: process.env.CI === 'true',
            provider: this.detectCIProvider(),
            branch: process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH || 'unknown',
            commit: process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'unknown',
            pullRequest: process.env.GITHUB_EVENT_NAME === 'pull_request',
            buildNumber: process.env.GITHUB_RUN_NUMBER || process.env.BUILD_NUMBER || 'unknown',
            buildUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID ?
                `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` :
                'unknown'
        };
    }
    /**
     * Detect CI provider
     */
    detectCIProvider() {
        if (process.env.GITHUB_ACTIONS)
            return 'GitHub Actions';
        if (process.env.JENKINS_URL)
            return 'Jenkins';
        if (process.env.GITLAB_CI)
            return 'GitLab CI';
        if (process.env.CIRCLECI)
            return 'CircleCI';
        if (process.env.TRAVIS)
            return 'Travis CI';
        if (process.env.BUILDKITE)
            return 'Buildkite';
        return 'Unknown';
    }
    /**
     * Collect CI artifacts
     */
    async collectCIArtifacts() {
        const artifacts = {
            reports: [],
            screenshots: [],
            videos: [],
            logs: []
        };
        try {
            // Collect test reports
            const reportDirs = [
                'reports',
                'test-results',
                'playwright-report'
            ];
            for (const dir of reportDirs) {
                const fullPath = path.join(this.baseDir, dir);
                if (fs.existsSync(fullPath)) {
                    const files = this.collectFilesRecursively(fullPath);
                    files.forEach(file => {
                        const ext = path.extname(file).toLowerCase();
                        const relativePath = path.relative(this.baseDir, file);
                        if (['.html', '.json', '.xml'].includes(ext)) {
                            artifacts.reports.push(relativePath);
                        }
                        else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                            artifacts.screenshots.push(relativePath);
                        }
                        else if (['.webm', '.mp4'].includes(ext)) {
                            artifacts.videos.push(relativePath);
                        }
                        else if (['.log', '.txt'].includes(ext)) {
                            artifacts.logs.push(relativePath);
                        }
                    });
                }
            }
        }
        catch (error) {
            console.warn('Failed to collect CI artifacts:', error.message);
        }
        return artifacts;
    }
    /**
     * Collect files recursively
     */
    collectFilesRecursively(dir) {
        const files = [];
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stat = fs.statSync(itemPath);
                if (stat.isDirectory()) {
                    files.push(...this.collectFilesRecursively(itemPath));
                }
                else {
                    files.push(itemPath);
                }
            }
        }
        catch (error) {
            console.warn(`Failed to read directory ${dir}:`, error.message);
        }
        return files;
    }
    /**
     * Generate notifications
     */
    generateNotifications(results) {
        const notifications = [];
        // Failure notifications
        if (results.summary.failed > 0) {
            notifications.push({
                type: 'failure',
                title: 'Test Failures Detected',
                message: `${results.summary.failed} out of ${results.summary.total} tests failed`,
                severity: 'high'
            });
        }
        // Success notifications
        if (results.summary.failed === 0 && results.summary.total > 0) {
            notifications.push({
                type: 'success',
                title: 'All Tests Passed',
                message: `${results.summary.total} tests executed successfully`,
                severity: 'info'
            });
        }
        // Performance notifications
        if (results.duration > 1800000) { // 30 minutes
            notifications.push({
                type: 'warning',
                title: 'Long Test Execution',
                message: `Test execution took ${Math.round(results.duration / 60000)} minutes`,
                severity: 'medium'
            });
        }
        return notifications;
    }
    /**
     * Check quality gates
     */
    async checkQualityGates(results) {
        const gates = {
            passRate: {
                threshold: 95,
                actual: results.summary.passRate,
                passed: results.summary.passRate >= 95
            },
            maxFailures: {
                threshold: 0,
                actual: results.summary.failed,
                passed: results.summary.failed === 0
            },
            maxDuration: {
                threshold: 1800000, // 30 minutes
                actual: results.duration,
                passed: results.duration <= 1800000
            }
        };
        const overallPassed = Object.values(gates).every(gate => gate.passed);
        console.log('\n🚪 Quality Gates Check:');
        Object.entries(gates).forEach(([name, gate]) => {
            const status = gate.passed ? '✅' : '❌';
            console.log(`  ${status} ${name}: ${gate.actual} (threshold: ${gate.threshold})`);
        });
        return {
            passed: overallPassed,
            gates
        };
    }
    /**
     * Generate CI artifacts
     */
    async generateCIArtifacts(results) {
        console.log('\n📦 Generating CI artifacts...');
        try {
            // Generate JUnit XML for CI integration
            await this.generateJUnitXML(results);
            // Generate CI summary
            await this.generateCISummary(results);
            // Generate GitHub Actions summary if applicable
            if (process.env.GITHUB_ACTIONS) {
                await this.generateGitHubActionsSummary(results);
            }
        }
        catch (error) {
            console.error('Failed to generate CI artifacts:', error.message);
        }
    }
    /**
     * Generate JUnit XML report
     */
    async generateJUnitXML(results) {
        const xml = this.createJUnitXML(results);
        const xmlPath = path.join(this.resultsDir, 'junit-results.xml');
        fs.writeFileSync(xmlPath, xml);
        console.log(`  📄 JUnit XML: ${xmlPath}`);
    }
    /**
     * Create JUnit XML content
     */
    createJUnitXML(results) {
        const testsuites = Object.entries(results.suites).map(([suiteId, suite]) => {
            const failures = suite.tests.failed || 0;
            const errors = suite.status === 'error' ? 1 : 0;
            return `    <testsuite name="${suite.name}" tests="${suite.tests.total}" failures="${failures}" errors="${errors}" time="${suite.duration / 1000}">
${suite.error ? `      <error message="${suite.error}"></error>` : ''}
    </testsuite>`;
        }).join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="CI Test Results" tests="${results.summary.total}" failures="${results.summary.failed}" time="${results.duration / 1000}">
${testsuites}
</testsuites>`;
    }
    /**
     * Generate CI summary
     */
    async generateCISummary(results) {
        const summary = {
            timestamp: new Date().toISOString(),
            ciMetadata: results.ciMetadata,
            summary: results.summary,
            qualityGate: results.qualityGate,
            artifacts: results.artifacts,
            notifications: results.notifications
        };
        const summaryPath = path.join(this.resultsDir, 'ci-summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`  📊 CI Summary: ${summaryPath}`);
    }
    /**
     * Generate GitHub Actions summary
     */
    async generateGitHubActionsSummary(results) {
        if (!process.env.GITHUB_STEP_SUMMARY) {
            return;
        }
        const summary = this.createGitHubActionsSummary(results);
        try {
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
            console.log('  📝 GitHub Actions Summary updated');
        }
        catch (error) {
            console.warn('Failed to update GitHub Actions summary:', error.message);
        }
    }
    /**
     * Create GitHub Actions summary content
     */
    createGitHubActionsSummary(results) {
        const passRate = results.summary.passRate;
        const status = results.qualityGate.passed ? '✅' : '❌';
        return `
## ${status} Test Execution Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | ${results.summary.total} |
| **Passed** | ${results.summary.passed} ✅ |
| **Failed** | ${results.summary.failed} ❌ |
| **Pass Rate** | ${passRate}% |
| **Duration** | ${Math.round(results.duration / 60000)}m ${Math.round((results.duration % 60000) / 1000)}s |
| **Quality Gate** | ${results.qualityGate.passed ? 'PASSED' : 'FAILED'} |

### Test Suites

${Object.entries(results.suites).map(([suiteId, suite]) => {
            const suiteStatus = suite.status === 'passed' ? '✅' : suite.status === 'failed' ? '❌' : '⚠️';
            return `- ${suiteStatus} **${suite.name}**: ${suite.tests.passed}/${suite.tests.total} passed`;
        }).join('\n')}

${results.notifications.length > 0 ? `
### Notifications

${results.notifications.map(notif => {
            const icon = notif.type === 'success' ? '✅' : notif.type === 'failure' ? '❌' : '⚠️';
            return `- ${icon} **${notif.title}**: ${notif.message}`;
        }).join('\n')}
` : ''}
`;
    }
    /**
     * Generate failure artifacts
     */
    async generateFailureArtifacts(error, suiteType) {
        console.log('\n💥 Generating failure artifacts...');
        const failureReport = {
            timestamp: new Date().toISOString(),
            suiteType,
            error: {
                message: error.message,
                stack: error.stack
            },
            ciMetadata: this.getCIMetadata(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
        const failurePath = path.join(this.resultsDir, 'failure-report.json');
        fs.writeFileSync(failurePath, JSON.stringify(failureReport, null, 2));
        console.log(`  💾 Failure report: ${failurePath}`);
    }
}
// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
CI/CD Test Runner

Usage: node scripts/test-execution/ci-test-runner.js [SUITE_TYPE] [OPTIONS]

Suite Types:
  smoke         Quick smoke tests (default)
  regression    Regression test suite
  full          Full comprehensive test suite
  performance   Performance tests only
  security      Security and accessibility tests

Options:
  --environment ENV     Override environment
  --browsers BROWSERS   Override browsers
  --help, -h            Show this help message

Examples:
  node scripts/test-execution/ci-test-runner.js smoke
  node scripts/test-execution/ci-test-runner.js regression --environment staging
  node scripts/test-execution/ci-test-runner.js full --browsers chromium,firefox
`);
        process.exit(0);
    }
    const suiteType = args[0] || 'smoke';
    const options = {};
    // Parse additional options
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        switch (arg) {
            case '--environment':
                if (nextArg) {
                    options.environment = nextArg;
                    i++;
                }
                break;
            case '--browsers':
                if (nextArg) {
                    options.browsers = nextArg.split(',').map(b => b.trim());
                    i++;
                }
                break;
        }
    }
    const runner = new CITestRunner();
    runner.executeCITests(suiteType, options)
        .then(results => {
        const exitCode = results.qualityGate.passed ? 0 : 1;
        if (exitCode === 0) {
            console.log('\n🎉 CI tests completed successfully!');
        }
        else {
            console.log('\n💥 CI tests failed quality gates.');
        }
        process.exit(exitCode);
    })
        .catch(error => {
        console.error('\n💥 CI test execution failed:', error.message);
        process.exit(1);
    });
}
module.exports = CITestRunner;
