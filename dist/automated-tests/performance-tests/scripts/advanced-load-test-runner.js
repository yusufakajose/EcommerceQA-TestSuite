#!/usr/bin/env node
/**
 * Advanced Load Testing Runner
 * Implements realistic user journey simulation with configurable load patterns
 */
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
class AdvancedLoadTestRunner {
    constructor() {
        this.baseDir = path.join(process.cwd(), 'automated-tests/performance-tests');
        this.testPlansDir = path.join(this.baseDir, 'jmeter/test-plans');
        this.dataDir = path.join(this.baseDir, 'jmeter/data');
        this.resultsDir = path.join(this.baseDir, 'jmeter/results');
        this.reportsDir = path.join(process.cwd(), 'reports/performance-tests');
        this.loadScenarios = {};
        this.testPlans = {
            'user-journey': 'realistic-user-journey-load-test.jmx',
            'stress-test': 'stress-test-scenario.jmx',
            'user-auth': 'user-authentication-load-test.jmx',
            'product-catalog': 'product-catalog-load-test.jmx',
            'shopping-cart': 'shopping-cart-checkout-load-test.jmx'
        };
        this.defaultConfig = {
            baseUrl: 'http://localhost:3000',
            scenario: 'normal_load'
        };
    }
    /**
     * Initialize the runner by loading load test scenarios
     */
    async initialize() {
        await this.loadScenarioConfigurations();
        this.ensureDirectories();
    }
    /**
     * Load scenario configurations from CSV file
     */
    async loadScenarioConfigurations() {
        const scenarioFile = path.join(this.dataDir, 'load-test-scenarios.csv');
        if (!fs.existsSync(scenarioFile)) {
            console.warn('Load test scenarios file not found, using defaults');
            return;
        }
        return new Promise((resolve, reject) => {
            const scenarios = {};
            fs.createReadStream(scenarioFile)
                .pipe(csv())
                .on('data', (row) => {
                scenarios[row.scenarioName] = {
                    users: parseInt(row.users),
                    rampUp: parseInt(row.rampUp),
                    duration: parseInt(row.duration),
                    thinkTimeMin: parseInt(row.thinkTimeMin),
                    thinkTimeMax: parseInt(row.thinkTimeMax),
                    description: row.description
                };
            })
                .on('end', () => {
                this.loadScenarios = scenarios;
                console.log(`Loaded ${Object.keys(scenarios).length} load test scenarios`);
                resolve();
            })
                .on('error', reject);
        });
    }
    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        const dirs = [this.resultsDir, this.reportsDir];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    /**
     * Check if JMeter is installed
     */
    async checkJMeter() {
        return new Promise((resolve, reject) => {
            exec('jmeter --version', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error('JMeter is not installed or not in PATH'));
                    return;
                }
                const version = stdout.split('\n')[0];
                console.log(`JMeter found: ${version}`);
                resolve(version);
            });
        });
    }
    /**
     * Run realistic user journey load test
     */
    async runUserJourneyTest(scenarioName = 'normal_load', config = {}) {
        const scenario = this.loadScenarios[scenarioName];
        if (!scenario) {
            throw new Error(`Load scenario '${scenarioName}' not found`);
        }
        const testConfig = { ...this.defaultConfig, ...config };
        const testPlan = this.testPlans['user-journey'];
        const testPlanPath = path.join(this.testPlansDir, testPlan);
        if (!fs.existsSync(testPlanPath)) {
            throw new Error(`Test plan file not found: ${testPlanPath}`);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultFile = path.join(this.resultsDir, `user-journey-${scenarioName}-${timestamp}.jtl`);
        const logFile = path.join(this.resultsDir, `user-journey-${scenarioName}-${timestamp}.log`);
        const reportDir = path.join(this.reportsDir, `user-journey-${scenarioName}-${timestamp}`);
        console.log(`Running User Journey Load Test - ${scenarioName}`);
        console.log(`Description: ${scenario.description}`);
        console.log(`Configuration: ${scenario.users} users, ${scenario.rampUp}s ramp-up, ${scenario.duration}s duration`);
        console.log(`Think time: ${scenario.thinkTimeMin}-${scenario.thinkTimeMax}ms`);
        const jmeterArgs = [
            '-n',
            '-t', testPlanPath,
            '-l', resultFile,
            '-j', logFile,
            '-Jbase_url=' + testConfig.baseUrl,
            '-Jnormal_users=' + Math.floor(scenario.users * 0.4),
            '-Jpeak_users=' + Math.floor(scenario.users * 0.8),
            '-Jstress_users=' + scenario.users,
            '-Jramp_up=' + scenario.rampUp,
            '-Jduration=' + scenario.duration,
            '-Jthink_time_min=' + scenario.thinkTimeMin,
            '-Jthink_time_max=' + scenario.thinkTimeMax,
            '-e',
            '-o', reportDir
        ];
        return this.executeJMeterTest('User Journey Load Test', jmeterArgs, {
            resultFile,
            logFile,
            reportDir,
            scenario: scenarioName
        });
    }
    /**
     * Run stress test to identify breaking points
     */
    async runStressTest(config = {}) {
        const testConfig = { ...this.defaultConfig, ...config };
        const testPlan = this.testPlans['stress-test'];
        const testPlanPath = path.join(this.testPlansDir, testPlan);
        if (!fs.existsSync(testPlanPath)) {
            throw new Error(`Test plan file not found: ${testPlanPath}`);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultFile = path.join(this.resultsDir, `stress-test-${timestamp}.jtl`);
        const logFile = path.join(this.resultsDir, `stress-test-${timestamp}.log`);
        const reportDir = path.join(this.reportsDir, `stress-test-${timestamp}`);
        const initialUsers = config.initialUsers || 50;
        const maxUsers = config.maxUsers || 500;
        const stepUsers = config.stepUsers || 50;
        const stepDuration = config.stepDuration || 300;
        console.log(`Running Stress Test to identify breaking points`);
        console.log(`Configuration: ${initialUsers} to ${maxUsers} users, ${stepUsers} user steps, ${stepDuration}s per step`);
        const jmeterArgs = [
            '-n',
            '-t', testPlanPath,
            '-l', resultFile,
            '-j', logFile,
            '-Jbase_url=' + testConfig.baseUrl,
            '-Jinitial_users=' + initialUsers,
            '-Jmax_users=' + maxUsers,
            '-Jstep_users=' + stepUsers,
            '-Jstep_duration=' + stepDuration,
            '-e',
            '-o', reportDir
        ];
        return this.executeJMeterTest('Stress Test', jmeterArgs, {
            resultFile,
            logFile,
            reportDir,
            scenario: 'stress_test'
        });
    }
    /**
     * Run concurrent user load test with configurable parameters
     */
    async runConcurrentUserTest(userCounts, config = {}) {
        const results = [];
        const testConfig = { ...this.defaultConfig, ...config };
        console.log(`Running Concurrent User Load Tests with user counts: ${userCounts.join(', ')}`);
        for (const userCount of userCounts) {
            const scenario = {
                users: userCount,
                rampUp: Math.max(60, userCount * 0.5),
                duration: 600,
                thinkTimeMin: 1000,
                thinkTimeMax: 3000,
                description: `Concurrent user test with ${userCount} users`
            };
            try {
                console.log(`\nTesting with ${userCount} concurrent users...`);
                const result = await this.runCustomScenario(scenario, testConfig);
                results.push({
                    userCount,
                    success: true,
                    ...result
                });
                // Wait between tests to allow system recovery
                if (userCounts.indexOf(userCount) < userCounts.length - 1) {
                    console.log('Waiting 60 seconds for system recovery...');
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            }
            catch (error) {
                console.error(`Failed test with ${userCount} users:`, error.message);
                results.push({
                    userCount,
                    success: false,
                    error: error.message
                });
            }
        }
        return results;
    }
    /**
     * Run custom load scenario
     */
    async runCustomScenario(scenario, config = {}) {
        const testConfig = { ...this.defaultConfig, ...config };
        const testPlan = this.testPlans['user-journey'];
        const testPlanPath = path.join(this.testPlansDir, testPlan);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultFile = path.join(this.resultsDir, `custom-scenario-${scenario.users}users-${timestamp}.jtl`);
        const logFile = path.join(this.resultsDir, `custom-scenario-${scenario.users}users-${timestamp}.log`);
        const reportDir = path.join(this.reportsDir, `custom-scenario-${scenario.users}users-${timestamp}`);
        const jmeterArgs = [
            '-n',
            '-t', testPlanPath,
            '-l', resultFile,
            '-j', logFile,
            '-Jbase_url=' + testConfig.baseUrl,
            '-Jnormal_users=' + Math.floor(scenario.users * 0.4),
            '-Jpeak_users=' + Math.floor(scenario.users * 0.8),
            '-Jstress_users=' + scenario.users,
            '-Jramp_up=' + scenario.rampUp,
            '-Jduration=' + scenario.duration,
            '-e',
            '-o', reportDir
        ];
        return this.executeJMeterTest(`Custom Scenario (${scenario.users} users)`, jmeterArgs, {
            resultFile,
            logFile,
            reportDir,
            scenario: 'custom'
        });
    }
    /**
     * Execute JMeter test with given arguments
     */
    async executeJMeterTest(testName, jmeterArgs, metadata) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const jmeter = spawn('jmeter', jmeterArgs);
            let output = '';
            let errorOutput = '';
            jmeter.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                process.stdout.write(text);
            });
            jmeter.stderr.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                process.stderr.write(text);
            });
            jmeter.on('close', (code) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                if (code === 0) {
                    console.log(`${testName} completed successfully in ${Math.round(duration / 1000)}s`);
                    console.log(`Results: ${metadata.resultFile}`);
                    console.log(`Report: ${metadata.reportDir}/index.html`);
                    resolve({
                        testName,
                        success: true,
                        duration,
                        ...metadata,
                        output
                    });
                }
                else {
                    console.error(`${testName} failed with exit code ${code}`);
                    reject(new Error(`JMeter test failed with exit code ${code}: ${errorOutput}`));
                }
            });
            jmeter.on('error', (error) => {
                reject(new Error(`Failed to start JMeter: ${error.message}`));
            });
        });
    }
    /**
     * Generate comprehensive load test report
     */
    generateLoadTestReport(results, config) {
        const reportPath = path.join(this.reportsDir, 'comprehensive-load-test-report.html');
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .scenario-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metrics { display: flex; gap: 20px; margin: 15px 0; flex-wrap: wrap; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; min-width: 150px; }
        .success { background: #d4edda; }
        .warning { background: #fff3cd; }
        .error { background: #f8d7da; }
        .chart-placeholder { background: #f8f9fa; padding: 20px; text-align: center; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Load Test Report</h1>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Base URL:</strong> ${config.baseUrl}</p>
        <p><strong>Test Duration:</strong> ${Math.round((results.reduce((sum, r) => sum + (r.duration || 0), 0)) / 1000 / 60)} minutes</p>
    </div>
    
    <div class="scenario-section">
        <h2>Load Test Summary</h2>
        <div class="metrics">
            <div class="metric">
                <h3>Total Tests</h3>
                <p>${results.length}</p>
            </div>
            <div class="metric success">
                <h3>Successful</h3>
                <p>${results.filter(r => r.success).length}</p>
            </div>
            <div class="metric error">
                <h3>Failed</h3>
                <p>${results.filter(r => !r.success).length}</p>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <p>${Math.round((results.filter(r => r.success).length / results.length) * 100)}%</p>
            </div>
        </div>
    </div>
    
    <div class="scenario-section">
        <h2>Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Scenario</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Report</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(result => `
                    <tr class="${result.success ? 'success' : 'error'}">
                        <td>${result.testName}</td>
                        <td>${result.scenario || 'N/A'}</td>
                        <td>${result.success ? 'Success' : 'Failed'}</td>
                        <td>${result.duration ? Math.round(result.duration / 1000) + 's' : 'N/A'}</td>
                        <td>${result.success && result.reportDir ?
            `<a href="${path.basename(result.reportDir)}/index.html" target="_blank">View Report</a>` :
            'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="scenario-section">
        <h2>Load Testing Scenarios</h2>
        <p>The following load testing scenarios were executed:</p>
        <ul>
            ${Object.entries(this.loadScenarios).map(([name, scenario]) => `
                <li><strong>${name}:</strong> ${scenario.description} (${scenario.users} users, ${scenario.rampUp}s ramp-up)</li>
            `).join('')}
        </ul>
    </div>
    
    <div class="scenario-section">
        <h2>Performance Analysis</h2>
        <div class="chart-placeholder">
            <h3>Performance Metrics Visualization</h3>
            <p>Detailed performance charts and analysis are available in individual test reports</p>
        </div>
        
        <h3>Key Findings</h3>
        <ul>
            <li>System performance under various load conditions</li>
            <li>Breaking point identification through stress testing</li>
            <li>Response time patterns across different user loads</li>
            <li>Resource utilization and bottleneck analysis</li>
        </ul>
    </div>
    
    <div class="scenario-section">
        <h2>Recommendations</h2>
        <ul>
            <li>Monitor system performance continuously during peak hours</li>
            <li>Implement auto-scaling based on load test findings</li>
            <li>Optimize database queries and caching strategies</li>
            <li>Set up alerting for performance threshold breaches</li>
        </ul>
    </div>
</body>
</html>`;
        fs.writeFileSync(reportPath, html);
        console.log(`Comprehensive load test report generated: ${reportPath}`);
        return reportPath;
    }
    /**
     * List available load scenarios
     */
    listScenarios() {
        console.log('Available Load Test Scenarios:');
        console.log('================================');
        Object.entries(this.loadScenarios).forEach(([name, scenario]) => {
            console.log(`${name}:`);
            console.log(`  Users: ${scenario.users}`);
            console.log(`  Ramp-up: ${scenario.rampUp}s`);
            console.log(`  Duration: ${scenario.duration}s`);
            console.log(`  Think time: ${scenario.thinkTimeMin}-${scenario.thinkTimeMax}ms`);
            console.log(`  Description: ${scenario.description}`);
            console.log('');
        });
    }
    /**
     * Run comprehensive load testing suite
     */
    async runComprehensiveLoadTests(config = {}) {
        const results = [];
        const testConfig = { ...this.defaultConfig, ...config };
        console.log('Starting Comprehensive Load Testing Suite...');
        try {
            // Run different load scenarios
            const scenarios = ['light_load', 'normal_load', 'peak_load', 'heavy_load'];
            for (const scenario of scenarios) {
                console.log(`\n--- Running ${scenario} scenario ---`);
                try {
                    const result = await this.runUserJourneyTest(scenario, testConfig);
                    results.push(result);
                    // Recovery time between scenarios
                    if (scenarios.indexOf(scenario) < scenarios.length - 1) {
                        console.log('Waiting 120 seconds for system recovery...');
                        await new Promise(resolve => setTimeout(resolve, 120000));
                    }
                }
                catch (error) {
                    console.error(`Failed ${scenario}:`, error.message);
                    results.push({
                        testName: `User Journey - ${scenario}`,
                        scenario,
                        success: false,
                        error: error.message
                    });
                }
            }
            // Run stress test
            console.log('\n--- Running Stress Test ---');
            try {
                const stressResult = await this.runStressTest(testConfig);
                results.push(stressResult);
            }
            catch (error) {
                console.error('Stress test failed:', error.message);
                results.push({
                    testName: 'Stress Test',
                    scenario: 'stress_test',
                    success: false,
                    error: error.message
                });
            }
            // Generate comprehensive report
            const reportPath = this.generateLoadTestReport(results, testConfig);
            console.log('\nComprehensive Load Testing Suite completed!');
            console.log(`Results: ${results.length} tests executed`);
            console.log(`Success rate: ${Math.round((results.filter(r => r.success).length / results.length) * 100)}%`);
            console.log(`Comprehensive report: ${reportPath}`);
            return results;
        }
        catch (error) {
            console.error('Comprehensive load testing failed:', error.message);
            throw error;
        }
    }
}
module.exports = AdvancedLoadTestRunner;
// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Advanced Load Testing Runner

Usage: node scripts/advanced-load-test-runner.js [COMMAND] [OPTIONS]

Commands:
  comprehensive             Run comprehensive load testing suite
  user-journey SCENARIO     Run user journey test with specific scenario
  stress-test              Run stress test to identify breaking points
  concurrent-users COUNTS   Run tests with specific user counts (comma-separated)
  list-scenarios           List available load test scenarios

Options:
  --base-url URL           Base URL for testing (default: http://localhost:3000)
  --initial-users N        Initial users for stress test (default: 50)
  --max-users N            Maximum users for stress test (default: 500)
  --step-users N           User increment for stress test (default: 50)
  --step-duration N        Duration per step in seconds (default: 300)

Examples:
  node scripts/advanced-load-test-runner.js comprehensive
  node scripts/advanced-load-test-runner.js user-journey peak_load
  node scripts/advanced-load-test-runner.js stress-test --max-users 1000
  node scripts/advanced-load-test-runner.js concurrent-users 50,100,200,400
  node scripts/advanced-load-test-runner.js list-scenarios
`);
        process.exit(0);
    }
    const runner = new AdvancedLoadTestRunner();
    (async () => {
        try {
            await runner.checkJMeter();
            await runner.initialize();
            const command = args[0] || 'comprehensive';
            const config = {};
            // Parse options
            for (let i = 1; i < args.length; i++) {
                const arg = args[i];
                const nextArg = args[i + 1];
                switch (arg) {
                    case '--base-url':
                        if (nextArg) {
                            config.baseUrl = nextArg;
                            i++;
                        }
                        break;
                    case '--initial-users':
                        if (nextArg) {
                            config.initialUsers = parseInt(nextArg);
                            i++;
                        }
                        break;
                    case '--max-users':
                        if (nextArg) {
                            config.maxUsers = parseInt(nextArg);
                            i++;
                        }
                        break;
                    case '--step-users':
                        if (nextArg) {
                            config.stepUsers = parseInt(nextArg);
                            i++;
                        }
                        break;
                    case '--step-duration':
                        if (nextArg) {
                            config.stepDuration = parseInt(nextArg);
                            i++;
                        }
                        break;
                }
            }
            let result;
            switch (command) {
                case 'comprehensive':
                    result = await runner.runComprehensiveLoadTests(config);
                    process.exit(result.every(r => r.success) ? 0 : 1);
                    break;
                case 'user-journey': {
                    const scenario = args[1] || 'normal_load';
                    result = await runner.runUserJourneyTest(scenario, config);
                    process.exit(result.success ? 0 : 1);
                    break;
                }
                case 'stress-test':
                    result = await runner.runStressTest(config);
                    process.exit(result.success ? 0 : 1);
                    break;
                case 'concurrent-users': {
                    const userCounts = args[1] ? args[1].split(',').map(n => parseInt(n.trim())) : [50, 100, 200];
                    result = await runner.runConcurrentUserTest(userCounts, config);
                    process.exit(result.every(r => r.success) ? 0 : 1);
                    break;
                }
                case 'list-scenarios':
                    runner.listScenarios();
                    process.exit(0);
                    break;
                default:
                    console.error(`Unknown command: ${command}`);
                    process.exit(1);
            }
        }
        catch (error) {
            console.error('Load testing failed:', error.message);
            process.exit(1);
        }
    })();
}
