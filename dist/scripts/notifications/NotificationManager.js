/**
 * Notification Manager
 * Handles email notifications for test failures and summary reports
 */
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
class NotificationManager {
    constructor(config = {}) {
        this.config = {
            smtp: {
                host: config.smtp?.host || process.env.SMTP_HOST || 'localhost',
                port: config.smtp?.port || process.env.SMTP_PORT || 587,
                secure: config.smtp?.secure || process.env.SMTP_SECURE === 'true',
                auth: {
                    user: config.smtp?.user || process.env.SMTP_USER,
                    pass: config.smtp?.pass || process.env.SMTP_PASS
                }
            },
            from: config.from || process.env.NOTIFICATION_FROM || 'noreply@example.com',
            recipients: {
                failures: config.recipients?.failures || process.env.FAILURE_RECIPIENTS?.split(',') || [],
                summary: config.recipients?.summary || process.env.SUMMARY_RECIPIENTS?.split(',') || [],
                critical: config.recipients?.critical || process.env.CRITICAL_RECIPIENTS?.split(',') || []
            },
            thresholds: {
                criticalFailureRate: config.thresholds?.criticalFailureRate || 50, // 50% failure rate
                warningFailureRate: config.thresholds?.warningFailureRate || 20, // 20% failure rate
                maxDurationIncrease: config.thresholds?.maxDurationIncrease || 100 // 100% duration increase
            },
            enabled: config.enabled !== false && process.env.NOTIFICATIONS_ENABLED !== 'false',
            ...config
        };
        this.transporter = null;
        this.initializeTransporter();
    }
    /**
     * Initialize email transporter
     */
    async initializeTransporter() {
        if (!this.config.enabled) {
            console.log('Notifications disabled');
            return;
        }
        try {
            this.transporter = nodemailer.createTransporter(this.config.smtp);
            // Verify connection
            await this.transporter.verify();
            console.log('Email transporter initialized successfully');
        }
        catch (error) {
            console.warn('Failed to initialize email transporter:', error.message);
            this.config.enabled = false;
        }
    }
    /**
     * Send test execution summary notification
     * @param {Object} results - Test execution results
     * @param {Object} trendAnalysis - Trend analysis data
     */
    async sendSummaryNotification(results, trendAnalysis = null) {
        if (!this.config.enabled || this.config.recipients.summary.length === 0) {
            return;
        }
        const severity = this.calculateSeverity(results);
        const subject = this.generateSummarySubject(results, severity);
        const htmlContent = this.generateSummaryHTML(results, trendAnalysis, severity);
        const textContent = this.generateSummaryText(results, trendAnalysis, severity);
        const recipients = severity === 'critical' ?
            [...this.config.recipients.summary, ...this.config.recipients.critical] :
            this.config.recipients.summary;
        await this.sendEmail({
            to: recipients,
            subject: subject,
            html: htmlContent,
            text: textContent,
            attachments: await this.generateAttachments(results)
        });
        console.log(`Summary notification sent to ${recipients.length} recipients`);
    }
    /**
     * Send failure notification for critical test failures
     * @param {Object} results - Test execution results
     * @param {Array} failedTests - Array of failed test details
     */
    async sendFailureNotification(results, failedTests = []) {
        if (!this.config.enabled || this.config.recipients.failures.length === 0) {
            return;
        }
        const severity = this.calculateSeverity(results);
        if (severity === 'success') {
            return; // Don't send failure notifications for successful runs
        }
        const subject = this.generateFailureSubject(results, severity);
        const htmlContent = this.generateFailureHTML(results, failedTests, severity);
        const textContent = this.generateFailureText(results, failedTests, severity);
        const recipients = severity === 'critical' ?
            [...this.config.recipients.failures, ...this.config.recipients.critical] :
            this.config.recipients.failures;
        await this.sendEmail({
            to: recipients,
            subject: subject,
            html: htmlContent,
            text: textContent,
            priority: severity === 'critical' ? 'high' : 'normal'
        });
        console.log(`Failure notification sent to ${recipients.length} recipients`);
    }
    /**
     * Send trend analysis notification
     * @param {Object} trendAnalysis - Trend analysis data
     */
    async sendTrendNotification(trendAnalysis) {
        if (!this.config.enabled || this.config.recipients.summary.length === 0) {
            return;
        }
        const hasSignificantTrends = this.hasSignificantTrends(trendAnalysis);
        if (!hasSignificantTrends) {
            return; // Don't send notifications for insignificant trends
        }
        const subject = this.generateTrendSubject(trendAnalysis);
        const htmlContent = this.generateTrendHTML(trendAnalysis);
        const textContent = this.generateTrendText(trendAnalysis);
        await this.sendEmail({
            to: this.config.recipients.summary,
            subject: subject,
            html: htmlContent,
            text: textContent
        });
        console.log('Trend analysis notification sent');
    }
    /**
     * Calculate severity based on test results
     * @param {Object} results - Test execution results
     * @returns {string} - Severity level
     */
    calculateSeverity(results) {
        const failureRate = results.total > 0 ? (results.failed / results.total) * 100 : 0;
        if (failureRate >= this.config.thresholds.criticalFailureRate) {
            return 'critical';
        }
        else if (failureRate >= this.config.thresholds.warningFailureRate) {
            return 'warning';
        }
        else if (results.failed > 0) {
            return 'minor';
        }
        else {
            return 'success';
        }
    }
    /**
     * Generate summary email subject
     * @param {Object} results - Test execution results
     * @param {string} severity - Severity level
     * @returns {string} - Email subject
     */
    generateSummarySubject(results, severity) {
        const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
        const statusEmoji = this.getSeverityEmoji(severity);
        return `${statusEmoji} Test Execution Summary - ${passRate}% Pass Rate (${results.passed}/${results.total})`;
    }
    /**
     * Generate failure email subject
     * @param {Object} results - Test execution results
     * @param {string} severity - Severity level
     * @returns {string} - Email subject
     */
    generateFailureSubject(results, severity) {
        const statusEmoji = this.getSeverityEmoji(severity);
        return `${statusEmoji} Test Failures Detected - ${results.failed} Failed Tests`;
    }
    /**
     * Generate trend email subject
     * @param {Object} trendAnalysis - Trend analysis data
     * @returns {string} - Email subject
     */
    generateTrendSubject(trendAnalysis) {
        const passRateTrend = trendAnalysis.trends?.passRate?.trend || 'stable';
        const durationTrend = trendAnalysis.trends?.duration?.trend || 'stable';
        const emoji = passRateTrend === 'improving' ? '📈' :
            passRateTrend === 'declining' ? '📉' : '📊';
        return `${emoji} Test Trend Analysis - Pass Rate ${passRateTrend}, Duration ${durationTrend}`;
    }
    /**
     * Get emoji for severity level
     * @param {string} severity - Severity level
     * @returns {string} - Emoji
     */
    getSeverityEmoji(severity) {
        switch (severity) {
            case 'critical': return '🚨';
            case 'warning': return '⚠️';
            case 'minor': return '🟡';
            case 'success': return '✅';
            default: return '📊';
        }
    }
    /**
     * Generate summary HTML content
     * @param {Object} results - Test execution results
     * @param {Object} trendAnalysis - Trend analysis data
     * @param {string} severity - Severity level
     * @returns {string} - HTML content
     */
    generateSummaryHTML(results, trendAnalysis, severity) {
        const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
        const statusColor = this.getSeverityColor(severity);
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Execution Summary</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
        .metric .value { font-size: 24px; font-weight: bold; color: #333; }
        .section { margin-bottom: 20px; }
        .section h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Execution Summary</h1>
        <p>Execution completed on ${new Date().toLocaleString()}</p>
        <p>Duration: ${this.formatDuration(results.duration)}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${results.total}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value passed">${results.passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value failed">${results.failed}</div>
        </div>
        <div class="metric">
            <h3>Skipped</h3>
            <div class="value skipped">${results.skipped}</div>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <div class="value">${passRate}%</div>
        </div>
    </div>
    
    ${this.generateEnvironmentTable(results)}
    ${this.generateBrowserTable(results)}
    ${trendAnalysis ? this.generateTrendSection(trendAnalysis) : ''}
    
    <div class="footer">
        <p>This is an automated notification from the QA Testing System.</p>
        <p>Generated at ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
    }
    /**
     * Generate summary text content
     * @param {Object} results - Test execution results
     * @param {Object} trendAnalysis - Trend analysis data
     * @param {string} severity - Severity level
     * @returns {string} - Text content
     */
    generateSummaryText(results, trendAnalysis, severity) {
        const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
        let text = `TEST EXECUTION SUMMARY\n`;
        text += `========================\n\n`;
        text += `Execution completed on ${new Date().toLocaleString()}\n`;
        text += `Duration: ${this.formatDuration(results.duration)}\n\n`;
        text += `RESULTS:\n`;
        text += `- Total Tests: ${results.total}\n`;
        text += `- Passed: ${results.passed}\n`;
        text += `- Failed: ${results.failed}\n`;
        text += `- Skipped: ${results.skipped}\n`;
        text += `- Pass Rate: ${passRate}%\n\n`;
        if (Object.keys(results.environments).length > 0) {
            text += `RESULTS BY ENVIRONMENT:\n`;
            Object.entries(results.environments).forEach(([env, stats]) => {
                const envPassRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
                text += `- ${env}: ${stats.passed}/${stats.total} (${envPassRate}%)\n`;
            });
            text += '\n';
        }
        if (Object.keys(results.browsers).length > 0) {
            text += `RESULTS BY BROWSER:\n`;
            Object.entries(results.browsers).forEach(([browser, stats]) => {
                const browserPassRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
                text += `- ${browser}: ${stats.passed}/${stats.total} (${browserPassRate}%)\n`;
            });
            text += '\n';
        }
        if (trendAnalysis && trendAnalysis.trends) {
            text += `TREND ANALYSIS:\n`;
            text += `- Pass Rate Trend: ${trendAnalysis.trends.passRate.trend}\n`;
            text += `- Duration Trend: ${trendAnalysis.trends.duration.trend}\n\n`;
        }
        text += `This is an automated notification from the QA Testing System.\n`;
        text += `Generated at ${new Date().toISOString()}`;
        return text;
    }
    /**
     * Generate failure HTML content
     * @param {Object} results - Test execution results
     * @param {Array} failedTests - Failed test details
     * @param {string} severity - Severity level
     * @returns {string} - HTML content
     */
    generateFailureHTML(results, failedTests, severity) {
        const statusColor = this.getSeverityColor(severity);
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Failure Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .failure { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 15px; }
        .failure h3 { margin: 0 0 10px 0; color: #856404; }
        .failure pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric .value { font-size: 20px; font-weight: bold; }
        .failed { color: #dc3545; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Test Failures Detected</h1>
        <p>${results.failed} tests failed out of ${results.total} total tests</p>
    </div>
    
    <div class="alert">
        <strong>Action Required:</strong> The following tests have failed and require immediate attention.
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Failed Tests</h3>
            <div class="value failed">${results.failed}</div>
        </div>
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${results.total}</div>
        </div>
        <div class="metric">
            <h3>Failure Rate</h3>
            <div class="value failed">${((results.failed / results.total) * 100).toFixed(1)}%</div>
        </div>
    </div>
    
    ${failedTests.length > 0 ? this.generateFailedTestsSection(failedTests) : ''}
    
    <div class="footer">
        <p>Please investigate these failures and take appropriate action.</p>
        <p>Generated at ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
    }
    /**
     * Generate failure text content
     * @param {Object} results - Test execution results
     * @param {Array} failedTests - Failed test details
     * @param {string} severity - Severity level
     * @returns {string} - Text content
     */
    generateFailureText(results, failedTests, severity) {
        let text = `TEST FAILURE NOTIFICATION\n`;
        text += `=========================\n\n`;
        text += `${results.failed} tests failed out of ${results.total} total tests\n`;
        text += `Failure Rate: ${((results.failed / results.total) * 100).toFixed(1)}%\n\n`;
        text += `ACTION REQUIRED: The following tests have failed and require immediate attention.\n\n`;
        if (failedTests.length > 0) {
            text += `FAILED TESTS:\n`;
            failedTests.forEach((test, index) => {
                text += `${index + 1}. ${test.title}\n`;
                if (test.error) {
                    text += `   Error: ${test.error}\n`;
                }
                text += '\n';
            });
        }
        text += `Please investigate these failures and take appropriate action.\n`;
        text += `Generated at ${new Date().toISOString()}`;
        return text;
    }
    /**
     * Generate trend HTML content
     * @param {Object} trendAnalysis - Trend analysis data
     * @returns {string} - HTML content
     */
    generateTrendHTML(trendAnalysis) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Trend Analysis</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .trend { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .trend-item { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .trend-value { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .improving { color: #28a745; }
        .declining { color: #dc3545; }
        .stable { color: #6c757d; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Test Trend Analysis</h1>
        <p>Analysis based on ${trendAnalysis.totalRuns} test runs</p>
    </div>
    
    <div class="trend">
        <div class="trend-item">
            <h3>Pass Rate Trend</h3>
            <div class="trend-value ${trendAnalysis.trends.passRate.trend}">
                ${trendAnalysis.trends.passRate.current.toFixed(1)}%
            </div>
            <p>Change: ${trendAnalysis.trends.passRate.change > 0 ? '+' : ''}${trendAnalysis.trends.passRate.change.toFixed(1)}%</p>
            <p>Trend: ${trendAnalysis.trends.passRate.trend}</p>
        </div>
        
        <div class="trend-item">
            <h3>Duration Trend</h3>
            <div class="trend-value ${trendAnalysis.trends.duration.trend}">
                ${this.formatDuration(trendAnalysis.trends.duration.current)}
            </div>
            <p>Change: ${trendAnalysis.trends.duration.change > 0 ? '+' : ''}${this.formatDuration(Math.abs(trendAnalysis.trends.duration.change))}</p>
            <p>Trend: ${trendAnalysis.trends.duration.trend}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This trend analysis is based on the last ${trendAnalysis.recentRuns} test runs.</p>
        <p>Generated at ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
    }
    /**
     * Generate trend text content
     * @param {Object} trendAnalysis - Trend analysis data
     * @returns {string} - Text content
     */
    generateTrendText(trendAnalysis) {
        let text = `TEST TREND ANALYSIS\n`;
        text += `===================\n\n`;
        text += `Analysis based on ${trendAnalysis.totalRuns} test runs\n\n`;
        text += `PASS RATE TREND:\n`;
        text += `- Current: ${trendAnalysis.trends.passRate.current.toFixed(1)}%\n`;
        text += `- Change: ${trendAnalysis.trends.passRate.change > 0 ? '+' : ''}${trendAnalysis.trends.passRate.change.toFixed(1)}%\n`;
        text += `- Trend: ${trendAnalysis.trends.passRate.trend}\n\n`;
        text += `DURATION TREND:\n`;
        text += `- Current: ${this.formatDuration(trendAnalysis.trends.duration.current)}\n`;
        text += `- Change: ${trendAnalysis.trends.duration.change > 0 ? '+' : ''}${this.formatDuration(Math.abs(trendAnalysis.trends.duration.change))}\n`;
        text += `- Trend: ${trendAnalysis.trends.duration.trend}\n\n`;
        text += `This trend analysis is based on the last ${trendAnalysis.recentRuns} test runs.\n`;
        text += `Generated at ${new Date().toISOString()}`;
        return text;
    }
    /**
     * Check if trends are significant enough to notify
     * @param {Object} trendAnalysis - Trend analysis data
     * @returns {boolean} - Whether trends are significant
     */
    hasSignificantTrends(trendAnalysis) {
        if (!trendAnalysis.trends)
            return false;
        const passRateChange = Math.abs(trendAnalysis.trends.passRate.change);
        const durationChange = Math.abs(trendAnalysis.trends.duration.change);
        // Notify if pass rate changed by more than 5% or duration changed by more than 50%
        return passRateChange > 5 || durationChange > (trendAnalysis.trends.duration.previous * 0.5);
    }
    /**
     * Generate environment results table
     * @param {Object} results - Test execution results
     * @returns {string} - HTML table
     */
    generateEnvironmentTable(results) {
        if (Object.keys(results.environments).length === 0)
            return '';
        let html = '<div class="section"><h2>Results by Environment</h2><table><thead><tr><th>Environment</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th></tr></thead><tbody>';
        Object.entries(results.environments).forEach(([env, stats]) => {
            const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
            html += `<tr><td>${env}</td><td>${stats.total}</td><td class="passed">${stats.passed}</td><td class="failed">${stats.failed}</td><td class="skipped">${stats.skipped}</td><td>${passRate}%</td></tr>`;
        });
        html += '</tbody></table></div>';
        return html;
    }
    /**
     * Generate browser results table
     * @param {Object} results - Test execution results
     * @returns {string} - HTML table
     */
    generateBrowserTable(results) {
        if (Object.keys(results.browsers).length === 0)
            return '';
        let html = '<div class="section"><h2>Results by Browser</h2><table><thead><tr><th>Browser</th><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Pass Rate</th></tr></thead><tbody>';
        Object.entries(results.browsers).forEach(([browser, stats]) => {
            const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
            html += `<tr><td>${browser}</td><td>${stats.total}</td><td class="passed">${stats.passed}</td><td class="failed">${stats.failed}</td><td class="skipped">${stats.skipped}</td><td>${passRate}%</td></tr>`;
        });
        html += '</tbody></table></div>';
        return html;
    }
    /**
     * Generate trend analysis section
     * @param {Object} trendAnalysis - Trend analysis data
     * @returns {string} - HTML content
     */
    generateTrendSection(trendAnalysis) {
        if (!trendAnalysis.trends)
            return '';
        return `
    <div class="section">
        <h2>Trend Analysis</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h3>Pass Rate Trend</h3>
                <p><strong>Current:</strong> ${trendAnalysis.trends.passRate.current.toFixed(1)}%</p>
                <p><strong>Change:</strong> ${trendAnalysis.trends.passRate.change > 0 ? '+' : ''}${trendAnalysis.trends.passRate.change.toFixed(1)}%</p>
                <p><strong>Trend:</strong> ${trendAnalysis.trends.passRate.trend}</p>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <h3>Duration Trend</h3>
                <p><strong>Current:</strong> ${this.formatDuration(trendAnalysis.trends.duration.current)}</p>
                <p><strong>Change:</strong> ${trendAnalysis.trends.duration.change > 0 ? '+' : ''}${this.formatDuration(Math.abs(trendAnalysis.trends.duration.change))}</p>
                <p><strong>Trend:</strong> ${trendAnalysis.trends.duration.trend}</p>
            </div>
        </div>
    </div>`;
    }
    /**
     * Generate failed tests section
     * @param {Array} failedTests - Failed test details
     * @returns {string} - HTML content
     */
    generateFailedTestsSection(failedTests) {
        let html = '<div class="section"><h2>Failed Tests</h2>';
        failedTests.forEach((test, index) => {
            html += `<div class="failure">`;
            html += `<h3>${index + 1}. ${test.title}</h3>`;
            if (test.error) {
                html += `<p><strong>Error:</strong> ${test.error}</p>`;
            }
            if (test.stack) {
                html += `<pre>${test.stack}</pre>`;
            }
            html += `</div>`;
        });
        html += '</div>';
        return html;
    }
    /**
     * Get color for severity level
     * @param {string} severity - Severity level
     * @returns {string} - Color code
     */
    getSeverityColor(severity) {
        switch (severity) {
            case 'critical': return '#dc3545';
            case 'warning': return '#fd7e14';
            case 'minor': return '#ffc107';
            case 'success': return '#28a745';
            default: return '#007bff';
        }
    }
    /**
     * Generate email attachments
     * @param {Object} results - Test execution results
     * @returns {Array} - Email attachments
     */
    async generateAttachments(results) {
        const attachments = [];
        // Attach JSON report if it exists
        const jsonReportPath = path.join('./reports', 'test-results.json');
        if (fs.existsSync(jsonReportPath)) {
            attachments.push({
                filename: 'test-results.json',
                path: jsonReportPath,
                contentType: 'application/json'
            });
        }
        // Attach HTML report if it exists
        const htmlReportPath = path.join('./reports', 'test-report.html');
        if (fs.existsSync(htmlReportPath)) {
            attachments.push({
                filename: 'test-report.html',
                path: htmlReportPath,
                contentType: 'text/html'
            });
        }
        return attachments;
    }
    /**
     * Send email
     * @param {Object} options - Email options
     */
    async sendEmail(options) {
        if (!this.transporter) {
            console.warn('Email transporter not available');
            return;
        }
        try {
            const mailOptions = {
                from: this.config.from,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments || [],
                priority: options.priority || 'normal'
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
        }
        catch (error) {
            console.error('Failed to send email:', error.message);
            throw error;
        }
    }
    /**
     * Format duration in human readable format
     * @param {number} ms - Duration in milliseconds
     * @returns {string} - Formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
}
module.exports = NotificationManager;
