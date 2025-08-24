#!/usr/bin/env node
/**
 * Test Status Monitor
 * Monitors test execution and provides real-time status updates
 */
const fs = require('fs');
const path = require('path');
class TestStatusMonitor {
    constructor() {
        this.statusFile = path.join(process.cwd(), 'test-status.json');
        this.startTime = Date.now();
        this.status = {
            overall: 'running',
            suites: {},
            startTime: this.startTime,
            lastUpdate: this.startTime,
            errors: [],
            warnings: []
        };
    }
    updateSuiteStatus(suiteName, status, details = {}) {
        this.status.suites[suiteName] = {
            status,
            ...details,
            lastUpdate: Date.now()
        };
        this.status.lastUpdate = Date.now();
        this.saveStatus();
        this.logUpdate(suiteName, status, details);
    }
    addError(error, suite = null) {
        const errorEntry = {
            timestamp: Date.now(),
            suite,
            error: error.toString(),
            stack: error.stack
        };
        this.status.errors.push(errorEntry);
        this.saveStatus();
        console.error(`❌ Error${suite ? ` in ${suite}` : ''}: ${error.message}`);
    }
    addWarning(warning, suite = null) {
        const warningEntry = {
            timestamp: Date.now(),
            suite,
            warning: warning.toString()
        };
        this.status.warnings.push(warningEntry);
        this.saveStatus();
        console.warn(`⚠️ Warning${suite ? ` in ${suite}` : ''}: ${warning}`);
    }
    setOverallStatus(status) {
        this.status.overall = status;
        this.status.lastUpdate = Date.now();
        this.saveStatus();
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        console.log(`🎯 Overall status: ${status.toUpperCase()} (${duration}s)`);
    }
    saveStatus() {
        try {
            fs.writeFileSync(this.statusFile, JSON.stringify(this.status, null, 2));
        }
        catch (error) {
            console.error('Failed to save status:', error);
        }
    }
    loadStatus() {
        try {
            if (fs.existsSync(this.statusFile)) {
                const data = fs.readFileSync(this.statusFile, 'utf8');
                this.status = JSON.parse(data);
                return this.status;
            }
        }
        catch (error) {
            console.error('Failed to load status:', error);
        }
        return null;
    }
    logUpdate(suiteName, status, details) {
        const duration = details.duration ? ` (${Math.round(details.duration / 1000)}s)` : '';
        const statusIcon = this.getStatusIcon(status);
        console.log(`${statusIcon} ${suiteName}: ${status.toUpperCase()}${duration}`);
        if (details.tests) {
            console.log(`  📊 Tests: ${details.tests}, Passed: ${details.passed || 0}, Failed: ${details.failed || 0}`);
        }
    }
    getStatusIcon(status) {
        const icons = {
            running: '🔄',
            passed: '✅',
            failed: '❌',
            skipped: '⏭️',
            warning: '⚠️'
        };
        return icons[status] || '❓';
    }
    generateSummary() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const suites = Object.keys(this.status.suites);
        const passedSuites = suites.filter(s => this.status.suites[s].status === 'passed').length;
        const failedSuites = suites.filter(s => this.status.suites[s].status === 'failed').length;
        console.log('\n📋 Test Execution Summary');
        console.log('========================');
        console.log(`Overall Status: ${this.status.overall.toUpperCase()}`);
        console.log(`Duration: ${duration}s`);
        console.log(`Suites: ${passedSuites}/${suites.length} passed`);
        if (this.status.errors.length > 0) {
            console.log(`Errors: ${this.status.errors.length}`);
        }
        if (this.status.warnings.length > 0) {
            console.log(`Warnings: ${this.status.warnings.length}`);
        }
        console.log('\nSuite Details:');
        Object.entries(this.status.suites).forEach(([name, suite]) => {
            const icon = this.getStatusIcon(suite.status);
            const duration = suite.duration ? ` (${Math.round(suite.duration / 1000)}s)` : '';
            console.log(`  ${icon} ${name}: ${suite.status.toUpperCase()}${duration}`);
        });
        return {
            overall: this.status.overall,
            duration,
            passedSuites,
            totalSuites: suites.length,
            errors: this.status.errors.length,
            warnings: this.status.warnings.length
        };
    }
    cleanup() {
        try {
            if (fs.existsSync(this.statusFile)) {
                fs.unlinkSync(this.statusFile);
            }
        }
        catch (error) {
            console.error('Failed to cleanup status file:', error);
        }
    }
}
// CLI interface
if (require.main === module) {
    const monitor = new TestStatusMonitor();
    const command = process.argv[2];
    const suiteName = process.argv[3];
    const status = process.argv[4];
    switch (command) {
        case 'init':
            monitor.setOverallStatus('running');
            console.log('🚀 Test monitoring initialized');
            break;
        case 'update': {
            if (!suiteName || !status) {
                console.error('Usage: node test-status-monitor.js update <suite> <status> [details]');
                process.exit(1);
            }
            let details = {};
            if (process.argv[5]) {
                try {
                    details = JSON.parse(process.argv[5]);
                }
                catch (error) {
                    console.error('Invalid details JSON:', error);
                }
            }
            monitor.updateSuiteStatus(suiteName, status, details);
            break;
        }
        case 'error': {
            const errorMsg = process.argv[3] || 'Unknown error';
            monitor.addError(new Error(errorMsg), suiteName);
            break;
        }
        case 'warning': {
            const warningMsg = process.argv[3] || 'Unknown warning';
            monitor.addWarning(warningMsg, suiteName);
            break;
        }
        case 'finish': {
            const finalStatus = process.argv[3] || 'completed';
            monitor.setOverallStatus(finalStatus);
            const summary = monitor.generateSummary();
            // Exit with appropriate code
            if (finalStatus === 'failed' || summary.errors > 0) {
                process.exit(1);
            }
            break;
        }
        case 'summary':
            monitor.loadStatus();
            monitor.generateSummary();
            break;
        case 'cleanup':
            monitor.cleanup();
            console.log('🧹 Status monitoring cleaned up');
            break;
        default:
            console.log('Usage: node test-status-monitor.js <command> [args]');
            console.log('Commands:');
            console.log('  init                           - Initialize monitoring');
            console.log('  update <suite> <status> [json] - Update suite status');
            console.log('  error <message> [suite]        - Log error');
            console.log('  warning <message> [suite]      - Log warning');
            console.log('  finish [status]                - Finish monitoring');
            console.log('  summary                        - Show summary');
            console.log('  cleanup                        - Clean up files');
            break;
    }
}
module.exports = TestStatusMonitor;
