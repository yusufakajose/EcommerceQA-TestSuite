/**
 * CI/CD Test Results Aggregation Script
 * Aggregates test results from multiple environments and browsers
 */
const fs = require('fs');
const path = require('path');
const TestExecutor = require('../test-execution/TestExecutor');
const NotificationManager = require('../notifications/NotificationManager');
class CIResultsAggregator {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            flaky: 0,
            duration: 0,
            environments: {},
            browsers: {},
            suites: {},
            errors: [],
            metadata: {
                ciRun: true,
                githubRef: process.env.GITHUB_REF,
                githubSha: process.env.GITHUB_SHA,
                githubActor: process.env.GITHUB_ACTOR,
                githubWorkflow: process.env.GITHUB_WORKFLOW,
                githubRunId: process.env.GITHUB_RUN_ID,
                githubRunNumber: process.env.GITHUB_RUN_NUMBER,
                timestamp: new Date().toISOString()
            }
        };
        this.notificationManager = new NotificationManager({
            enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            },
            from: process.env.NOTIFICATION_FROM,
            recipients: {
                summary: process.env.SUMMARY_RECIPIENTS?.split(',') || [],
                failures: process.env.FAILURE_RECIPIENTS?.split(',') || [],
                critical: process.env.CRITICAL_RECIPIENTS?.split(',') || []
            }
        });
    }
    /**
     * Main aggregation function
     */
    async aggregate() {
        console.log('Starting CI test results aggregation...');
        try {
            // Discover and process test result files
            await this.discoverTestResults();
            // Process Playwright reports
            await this.processPlaywrightReports();
            // Generate aggregated reports
            await this.generateReports();
            // Load trend analysis
            const trendAnalysis = await this.loadTrendAnalysis();
            // Send notifications
            await this.sendNotifications(trendAnalysis);
            // Set GitHub Actions outputs
            this.setGitHubOutputs();
            console.log('CI test results aggregation completed successfully');
        }
        catch (error) {
            console.error('CI aggregation failed:', error);
            process.exit(1);
        }
    }
    /**
     * Discover and process test result files
     */
    async discoverTestResults() {
        const testResultsDir = './test-results';
        if (!fs.existsSync(testResultsDir)) {
            console.warn('No test results directory found');
            return;
        }
        console.log('Discovering test result files...');
        // Recursively find all results.json files
        const resultFiles = this.findResultFiles(testResultsDir);
        console.log(`Found ${resultFiles.length} result files`);
        for (const resultFile of resultFiles) {
            await this.processResultFile(resultFile);
        }
    }
    /**
     * Find all result files recursively
     * @param {string} dir - Directory to search
     * @returns {Array} - Array of result file paths
     */
    findResultFiles(dir) {
        const resultFiles = [];
        const traverse = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            for (const item of items) {
                const itemPath = path.join(currentDir, item);
                const stat = fs.statSync(itemPath);
                if (stat.isDirectory()) {
                    traverse(itemPath);
                }
                else if (item === 'results.json' || item.endsWith('-results.json')) {
                    resultFiles.push(itemPath);
                }
            }
        };
        traverse(dir);
        return resultFiles;
    }
    /**
     * Process individual result file
     * @param {string} filePath - Path to result file
     */
    async processResultFile(filePath) {
        try {
            console.log(`Processing result file: ${filePath}`);
            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(rawData);
            // Extract environment and browser from file path
            const pathParts = filePath.split(path.sep);
            const environment = this.extractEnvironmentFromPath(pathParts);
            const browser = this.extractBrowserFromPath(pathParts);
            // Process test results
            this.processTestData(data, environment, browser);
        }
        catch (error) {
            console.error(`Failed to process result file ${filePath}:`, error.message);
            this.results.errors.push({
                type: 'result_processing_error',
                file: filePath,
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Extract environment from file path
     * @param {Array} pathParts - Path components
     * @returns {string} - Environment name
     */
    extractEnvironmentFromPath(pathParts) {
        // Look for known environment names in path
        const environments = ['development', 'staging', 'production', 'test'];
        for (const part of pathParts) {
            if (environments.includes(part)) {
                return part;
            }
        }
        return 'unknown';
    }
    /**
     * Extract browser from file path
     * @param {Array} pathParts - Path components
     * @returns {string} - Browser name
     */
    extractBrowserFromPath(pathParts) {
        // Look for known browser names in path
        const browsers = ['chromium', 'firefox', 'webkit', 'chrome', 'safari', 'edge'];
        for (const part of pathParts) {
            if (browsers.includes(part)) {
                return part;
            }
        }
        return 'unknown';
    }
    /**
     * Process test data and update aggregated results
     * @param {Object} data - Test result data
     * @param {string} environment - Environment name
     * @param {string} browser - Browser name
     */
    processTestData(data, environment, browser) {
        // Handle different result formats
        let stats = {};
        let suites = [];
        if (data.stats) {
            // Playwright format
            stats = data.stats;
            suites = data.suites || [];
        }
        else if (data.numTotalTests !== undefined) {
            // Jest format
            stats = {
                total: data.numTotalTests,
                passed: data.numPassedTests,
                failed: data.numFailedTests,
                skipped: data.numPendingTests || 0
            };
            suites = data.testResults || [];
        }
        else {
            // Try to infer from structure
            stats = this.inferStatsFromData(data);
            suites = data.suites || data.testResults || [];
        }
        // Update totals
        this.results.total += stats.total || 0;
        this.results.passed += stats.passed || 0;
        this.results.failed += stats.failed || 0;
        this.results.skipped += stats.skipped || 0;
        // Update environment results
        if (!this.results.environments[environment]) {
            this.results.environments[environment] = {
                total: 0, passed: 0, failed: 0, skipped: 0, browsers: {}
            };
        }
        const envResult = this.results.environments[environment];
        envResult.total += stats.total || 0;
        envResult.passed += stats.passed || 0;
        envResult.failed += stats.failed || 0;
        envResult.skipped += stats.skipped || 0;
        envResult.browsers[browser] = stats;
        // Update browser results
        if (!this.results.browsers[browser]) {
            this.results.browsers[browser] = {
                total: 0, passed: 0, failed: 0, skipped: 0, environments: {}
            };
        }
        const browserResult = this.results.browsers[browser];
        browserResult.total += stats.total || 0;
        browserResult.passed += stats.passed || 0;
        browserResult.failed += stats.failed || 0;
        browserResult.skipped += stats.skipped || 0;
        browserResult.environments[environment] = stats;
        // Process suites
        this.processSuites(suites, environment, browser);
    }
    /**
     * Infer statistics from data structure
     * @param {Object} data - Test data
     * @returns {Object} - Inferred statistics
     */
    inferStatsFromData(data) {
        const stats = { total: 0, passed: 0, failed: 0, skipped: 0 };
        // Try to count from various possible structures
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item.status) {
                    stats.total++;
                    switch (item.status) {
                        case 'passed':
                            stats.passed++;
                            break;
                        case 'failed':
                            stats.failed++;
                            break;
                        case 'skipped':
                            stats.skipped++;
                            break;
                    }
                }
            });
        }
        return stats;
    }
    /**
     * Process test suites
     * @param {Array} suites - Test suites
     * @param {string} environment - Environment name
     * @param {string} browser - Browser name
     */
    processSuites(suites, environment, browser) {
        suites.forEach(suite => {
            const suiteName = suite.title || suite.name || 'Unknown Suite';
            if (!this.results.suites[suiteName]) {
                this.results.suites[suiteName] = {
                    total: 0, passed: 0, failed: 0, skipped: 0,
                    environments: {}, browsers: {}
                };
            }
            const suiteStats = this.calculateSuiteStats(suite);
            const suiteResult = this.results.suites[suiteName];
            suiteResult.total += suiteStats.total;
            suiteResult.passed += suiteStats.passed;
            suiteResult.failed += suiteStats.failed;
            suiteResult.skipped += suiteStats.skipped;
            if (!suiteResult.environments[environment]) {
                suiteResult.environments[environment] = { total: 0, passed: 0, failed: 0, skipped: 0 };
            }
            if (!suiteResult.browsers[browser]) {
                suiteResult.browsers[browser] = { total: 0, passed: 0, failed: 0, skipped: 0 };
            }
            const envSuite = suiteResult.environments[environment];
            const browserSuite = suiteResult.browsers[browser];
            envSuite.total += suiteStats.total;
            envSuite.passed += suiteStats.passed;
            envSuite.failed += suiteStats.failed;
            envSuite.skipped += suiteStats.skipped;
            browserSuite.total += suiteStats.total;
            browserSuite.passed += suiteStats.passed;
            browserSuite.failed += suiteStats.failed;
            browserSuite.skipped += suiteStats.skipped;
        });
    }
    /**
     * Calculate statistics for a test suite
     * @param {Object} suite - Test suite
     * @returns {Object} - Suite statistics
     */
    calculateSuiteStats(suite) {
        const stats = { total: 0, passed: 0, failed: 0, skipped: 0 };
        // Handle different suite formats
        if (suite.tests) {
            suite.tests.forEach(test => {
                stats.total++;
                switch (test.status || test.state) {
                    case 'passed':
                        stats.passed++;
                        break;
                    case 'failed':
                        stats.failed++;
                        break;
                    case 'skipped':
                    case 'pending':
                        stats.skipped++;
                        break;
                }
            });
        }
        if (suite.suites) {
            suite.suites.forEach(subSuite => {
                const subStats = this.calculateSuiteStats(subSuite);
                stats.total += subStats.total;
                stats.passed += subStats.passed;
                stats.failed += subStats.failed;
                stats.skipped += subStats.skipped;
            });
        }
        return stats;
    }
    /**
     * Process Playwright HTML reports
     */
    async processPlaywrightReports() {
        const reportsDir = './playwright-reports';
        if (!fs.existsSync(reportsDir)) {
            console.log('No Playwright reports directory found');
            return;
        }
        console.log('Processing Playwright reports...');
        // Copy Playwright reports to main reports directory
        const targetDir = './reports/playwright-reports';
        if (!fs.existsSync('./reports')) {
            fs.mkdirSync('./reports', { recursive: true });
        }
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        // Copy all Playwright report files
        this.copyDirectory(reportsDir, targetDir);
    }
    /**
     * Copy directory recursively
     * @param {string} src - Source directory
     * @param {string} dest - Destination directory
     */
    copyDirectory(src, dest) {
        const items = fs.readdirSync(src);
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = fs.statSync(srcPath);
            if (stat.isDirectory()) {
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true });
                }
                this.copyDirectory(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    /**
     * Generate aggregated reports
     */
    async generateReports() {
        console.log('Generating aggregated reports...');
        // Ensure reports directory exists
        if (!fs.existsSync('./reports')) {
            fs.mkdirSync('./reports', { recursive: true });
        }
        // Generate JSON report
        await this.generateJSONReport();
        // Generate HTML report
        await this.generateHTMLReport();
        // Generate JUnit XML report
        await this.generateJUnitReport();
        // Update trend analysis
        await this.updateTrendAnalysis();
    }
    /**
     * Generate JSON report
     */
    async generateJSONReport() {
        const reportPath = './reports/test-results.json';
        const report = {
            ...this.results,
            generatedAt: new Date().toISOString(),
            passRate: this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0
        };
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`JSON report saved: ${reportPath}`);
    }
    /**
     * Generate HTML report
     */
    async generateHTMLReport() {
        const reportPath = './reports/test-report.html';
        const passRate = this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CI/CD Test Execution Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .ci-info { background: rgba(255,255,255,0.1); padding: 15px; margin-top: 20px; border-radius: 8px; }
        .ci-info div { display: inline-block; margin: 0 20px 0 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { text-align: center; padding: 20px; border-radius: 12px; background: #f8f9fa; }
        .metric h3 { margin: 0 0 15px 0; color: #495057; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .metric .value { font-size: 3em; font-weight: bold; margin-bottom: 10px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .total { color: #007bff; }
        .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s ease; }
        .section { padding: 0 30px 30px 30px; }
        .section h2 { color: #495057; border-bottom: 3px solid #007bff; padding-bottom: 15px; margin-bottom: 25px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background: #f8f9fa; padding: 15px; text-align: left; font-weight: 600; color: #495057; }
        td { padding: 15px; border-bottom: 1px solid #dee2e6; }
        tr:hover { background: #f8f9fa; }
        .status-passed { background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-failed { background: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-skipped { background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px 30px; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CI/CD Test Execution Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <div class="ci-info">
                <div><strong>Workflow:</strong> ${this.results.metadata.githubWorkflow || 'N/A'}</div>
                <div><strong>Run #:</strong> ${this.results.metadata.githubRunNumber || 'N/A'}</div>
                <div><strong>Commit:</strong> ${this.results.metadata.githubSha?.substring(0, 8) || 'N/A'}</div>
                <div><strong>Actor:</strong> ${this.results.metadata.githubActor || 'N/A'}</div>
            </div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value total">${this.results.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${this.results.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${this.results.failed}</div>
            </div>
            <div class="metric">
                <h3>Skipped</h3>
                <div class="value skipped">${this.results.skipped}</div>
            </div>
            <div class="metric">
                <h3>Pass Rate</h3>
                <div class="value">${passRate}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${passRate}%"></div>
                </div>
            </div>
        </div>
        
        ${this.generateEnvironmentSection()}
        ${this.generateBrowserSection()}
        ${this.generateSuiteSection()}
        
        <div class="footer">
            <p>This report was automatically generated by the CI/CD pipeline.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;
        fs.writeFileSync(reportPath, html);
        console.log(`HTML report saved: ${reportPath}`);
    }
    /**
     * Generate environment results section
     * @returns {string} - HTML content
     */
    generateEnvironmentSection() {
        if (Object.keys(this.results.environments).length === 0)
            return '';
        let html = '<div class="section"><h2>Results by Environment</h2><table><thead><tr><th>Environment</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th></tr></thead><tbody>';
        Object.entries(this.results.environments).forEach(([env, stats]) => {
            const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
            html += `<tr><td><strong>${env}</strong></td><td>${stats.total}</td><td><span class="status-passed">${stats.passed}</span></td><td><span class="status-failed">${stats.failed}</span></td><td><span class="status-skipped">${stats.skipped}</span></td><td><strong>${passRate}%</strong></td></tr>`;
        });
        html += '</tbody></table></div>';
        return html;
    }
    /**
     * Generate browser results section
     * @returns {string} - HTML content
     */
    generateBrowserSection() {
        if (Object.keys(this.results.browsers).length === 0)
            return '';
        let html = '<div class="section"><h2>Results by Browser</h2><table><thead><tr><th>Browser</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th></tr></thead><tbody>';
        Object.entries(this.results.browsers).forEach(([browser, stats]) => {
            const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
            html += `<tr><td><strong>${browser}</strong></td><td>${stats.total}</td><td><span class="status-passed">${stats.passed}</span></td><td><span class="status-failed">${stats.failed}</span></td><td><span class="status-skipped">${stats.skipped}</span></td><td><strong>${passRate}%</strong></td></tr>`;
        });
        html += '</tbody></table></div>';
        return html;
    }
    /**
     * Generate test suite results section
     * @returns {string} - HTML content
     */
    generateSuiteSection() {
        if (Object.keys(this.results.suites).length === 0)
            return '';
        let html = '<div class="section"><h2>Results by Test Suite</h2><table><thead><tr><th>Suite</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th></tr></thead><tbody>';
        Object.entries(this.results.suites).forEach(([suite, stats]) => {
            const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
            html += `<tr><td><strong>${suite}</strong></td><td>${stats.total}</td><td><span class="status-passed">${stats.passed}</span></td><td><span class="status-failed">${stats.failed}</span></td><td><span class="status-skipped">${stats.skipped}</span></td><td><strong>${passRate}%</strong></td></tr>`;
        });
        html += '</tbody></table></div>';
        return html;
    }
    /**
     * Generate JUnit XML report
     */
    async generateJUnitReport() {
        const reportPath = './reports/junit-results.xml';
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<testsuites tests="${this.results.total}" failures="${this.results.failed}" time="0">\n`;
        Object.entries(this.results.suites).forEach(([suiteName, stats]) => {
            xml += `  <testsuite name="${this.escapeXml(suiteName)}" tests="${stats.total}" failures="${stats.failed}" time="0">\n`;
            // Add test cases (simplified)
            for (let i = 0; i < stats.passed; i++) {
                xml += `    <testcase name="test-${i}" classname="${this.escapeXml(suiteName)}" time="0"/>\n`;
            }
            for (let i = 0; i < stats.failed; i++) {
                xml += `    <testcase name="failed-test-${i}" classname="${this.escapeXml(suiteName)}" time="0">\n`;
                xml += `      <failure message="Test failed">Test execution failed</failure>\n`;
                xml += `    </testcase>\n`;
            }
            xml += '  </testsuite>\n';
        });
        xml += '</testsuites>';
        fs.writeFileSync(reportPath, xml);
        console.log(`JUnit report saved: ${reportPath}`);
    }
    /**
     * Update trend analysis
     */
    async updateTrendAnalysis() {
        const historyPath = './reports/test-history.json';
        // Load existing history
        let history = [];
        if (fs.existsSync(historyPath)) {
            try {
                history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            }
            catch (error) {
                console.warn('Failed to load test history:', error.message);
            }
        }
        // Add current results to history
        const currentResult = {
            timestamp: new Date().toISOString(),
            total: this.results.total,
            passed: this.results.passed,
            failed: this.results.failed,
            skipped: this.results.skipped,
            passRate: this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0,
            metadata: this.results.metadata
        };
        history.push(currentResult);
        // Keep only last 50 runs
        if (history.length > 50) {
            history = history.slice(-50);
        }
        // Save updated history
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
        // Generate trend analysis
        const trendAnalysis = this.analyzeTrends(history);
        fs.writeFileSync('./reports/trend-analysis.json', JSON.stringify(trendAnalysis, null, 2));
        console.log('Trend analysis updated');
    }
    /**
     * Analyze test trends
     * @param {Array} history - Test history data
     * @returns {Object} - Trend analysis
     */
    analyzeTrends(history) {
        if (history.length < 2) {
            return { message: 'Insufficient data for trend analysis' };
        }
        const recent = history.slice(-5); // Last 5 runs
        const older = history.slice(-10, -5); // Previous 5 runs
        const recentAvg = {
            passRate: recent.reduce((sum, r) => sum + r.passRate, 0) / recent.length
        };
        const olderAvg = {
            passRate: older.length > 0 ? older.reduce((sum, r) => sum + r.passRate, 0) / older.length : recentAvg.passRate
        };
        return {
            totalRuns: history.length,
            recentRuns: recent.length,
            trends: {
                passRate: {
                    current: recentAvg.passRate,
                    previous: olderAvg.passRate,
                    change: recentAvg.passRate - olderAvg.passRate,
                    trend: recentAvg.passRate > olderAvg.passRate ? 'improving' :
                        recentAvg.passRate < olderAvg.passRate ? 'declining' : 'stable'
                }
            },
            history: history
        };
    }
    /**
     * Load trend analysis
     * @returns {Object} - Trend analysis data
     */
    async loadTrendAnalysis() {
        const trendPath = './reports/trend-analysis.json';
        if (fs.existsSync(trendPath)) {
            try {
                return JSON.parse(fs.readFileSync(trendPath, 'utf8'));
            }
            catch (error) {
                console.warn('Failed to load trend analysis:', error.message);
            }
        }
        return null;
    }
    /**
     * Send notifications
     * @param {Object} trendAnalysis - Trend analysis data
     */
    async sendNotifications(trendAnalysis) {
        try {
            console.log('Sending notifications...');
            // Send summary notification
            await this.notificationManager.sendSummaryNotification(this.results, trendAnalysis);
            // Send failure notification if there are failures
            if (this.results.failed > 0) {
                await this.notificationManager.sendFailureNotification(this.results, []);
            }
            // Send trend notification if significant trends detected
            if (trendAnalysis) {
                await this.notificationManager.sendTrendNotification(trendAnalysis);
            }
            console.log('Notifications sent successfully');
        }
        catch (error) {
            console.error('Failed to send notifications:', error.message);
            // Don't fail the entire process for notification errors
        }
    }
    /**
     * Set GitHub Actions outputs
     */
    setGitHubOutputs() {
        if (process.env.GITHUB_ACTIONS) {
            const passRate = this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(1) : 0;
            console.log(`::set-output name=total_tests::${this.results.total}`);
            console.log(`::set-output name=passed_tests::${this.results.passed}`);
            console.log(`::set-output name=failed_tests::${this.results.failed}`);
            console.log(`::set-output name=skipped_tests::${this.results.skipped}`);
            console.log(`::set-output name=pass_rate::${passRate}`);
            console.log(`::set-output name=has_failures::${this.results.failed > 0}`);
        }
    }
    /**
     * Escape XML special characters
     * @param {string} str - String to escape
     * @returns {string} - Escaped string
     */
    escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
// Run aggregation if called directly
if (require.main === module) {
    const aggregator = new CIResultsAggregator();
    aggregator.aggregate().catch(error => {
        console.error('Aggregation failed:', error);
        process.exit(1);
    });
}
module.exports = CIResultsAggregator;
