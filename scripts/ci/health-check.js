#!/usr/bin/env node

/**
 * CI Health Check Script
 * Validates CI environment and dependencies before running tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CIHealthCheck {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  async runAllChecks() {
    console.log('Running CI Health Check...\n');

    // Environment checks
    this.checkNodeVersion();
    this.checkNpmVersion();
    this.checkCIEnvironment();

    // Project structure checks
    this.checkProjectStructure();
    this.checkConfigFiles();
    this.checkDependencies();

    // Test framework checks
    this.checkPlaywrightSetup();
    this.checkNewmanSetup();
    this.checkJMeterAvailability();

    // Script availability checks
    this.checkNpmScripts();
    this.checkTestDirectories();

    // Generate report
    this.generateReport();

    // Exit with appropriate code
    if (this.errors.length > 0) {
      console.log('\nHealth check failed with errors');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('\nHealth check completed with warnings');
      process.exit(0);
    } else {
      console.log('\nHealth check passed');
      process.exit(0);
    }
  }

  checkNodeVersion() {
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      if (majorVersion >= 18) {
        this.addCheck('Node.js Version', 'passed', `${nodeVersion} (>= 18)`);
      } else {
        this.addError('Node.js Version', `${nodeVersion} (< 18 required)`);
      }
    } catch (error) {
      this.addError('Node.js Version', 'Unable to determine Node.js version');
    }
  }

  checkNpmVersion() {
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.addCheck('npm Version', 'passed', npmVersion);
    } catch (error) {
      this.addError('npm Version', 'npm not available');
    }
  }

  checkCIEnvironment() {
    const ciEnv = process.env.CI;
    const githubActions = process.env.GITHUB_ACTIONS;
    const gitlabCI = process.env.GITLAB_CI;
    const azureDevOps = process.env.TF_BUILD;

    if (ciEnv || githubActions || gitlabCI || azureDevOps) {
      let platform = 'Unknown CI';
      if (githubActions) platform = 'GitHub Actions';
      else if (gitlabCI) platform = 'GitLab CI';
      else if (azureDevOps) platform = 'Azure DevOps';

      this.addCheck('CI Environment', 'passed', platform);
    } else {
      this.addWarning('CI Environment', 'Not detected (running locally?)');
    }
  }

  checkProjectStructure() {
    const requiredDirs = ['automated-tests', 'scripts', 'config', 'test-data'];

    const requiredFiles = ['package.json', 'package-lock.json'];

    requiredDirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        this.addCheck(`Directory: ${dir}`, 'passed', 'exists');
      } else {
        this.addError(`Directory: ${dir}`, 'missing');
      }
    });

    requiredFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        this.addCheck(`File: ${file}`, 'passed', 'exists');
      } else {
        this.addError(`File: ${file}`, 'missing');
      }
    });
  }

  checkConfigFiles() {
    const configFiles = [
      { file: '.eslintrc.js', name: 'ESLint Config', required: false },
      { file: 'tsconfig.json', name: 'TypeScript Config', required: false },
      { file: 'config/playwright.config.js', name: 'Playwright Config', required: true },
      { file: '.gitignore', name: 'Git Ignore', required: false },
    ];

    configFiles.forEach(({ file, name, required }) => {
      if (fs.existsSync(file)) {
        this.addCheck(name, 'passed', 'configured');
      } else if (required) {
        this.addError(name, 'missing (required)');
      } else {
        this.addWarning(name, 'missing (optional)');
      }
    });
  }

  checkDependencies() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const criticalDeps = ['@playwright/test', 'newman', 'typescript', 'eslint'];

      criticalDeps.forEach((dep) => {
        if (deps[dep]) {
          this.addCheck(`Dependency: ${dep}`, 'passed', deps[dep]);
        } else {
          this.addWarning(`Dependency: ${dep}`, 'not found');
        }
      });

      // Check if node_modules exists
      if (fs.existsSync('node_modules')) {
        this.addCheck('Dependencies Installed', 'passed', 'node_modules exists');
      } else {
        this.addError('Dependencies Installed', 'node_modules missing - run npm install');
      }
    } catch (error) {
      this.addError('Package Dependencies', 'Unable to read package.json');
    }
  }

  checkPlaywrightSetup() {
    try {
      // Check if Playwright is installed
      const playwrightPath = path.join('node_modules', '@playwright', 'test');
      if (fs.existsSync(playwrightPath)) {
        this.addCheck('Playwright Installation', 'passed', 'installed');

        // Check for browsers
        try {
          execSync('npx playwright --version', { stdio: 'pipe' });
          this.addCheck('Playwright CLI', 'passed', 'available');
        } catch (error) {
          this.addWarning('Playwright CLI', 'not available');
        }
      } else {
        this.addError('Playwright Installation', 'not found');
      }
    } catch (error) {
      this.addError('Playwright Setup', error.message);
    }
  }

  checkNewmanSetup() {
    try {
      const newmanPath = path.join('node_modules', 'newman');
      if (fs.existsSync(newmanPath)) {
        this.addCheck('Newman Installation', 'passed', 'installed');

        // Check Newman CLI
        try {
          execSync('npx newman --version', { stdio: 'pipe' });
          this.addCheck('Newman CLI', 'passed', 'available');
        } catch (error) {
          this.addWarning('Newman CLI', 'not available');
        }
      } else {
        this.addWarning('Newman Installation', 'not found');
      }
    } catch (error) {
      this.addWarning('Newman Setup', error.message);
    }
  }

  checkJMeterAvailability() {
    try {
      execSync('jmeter --version', { stdio: 'pipe' });
      this.addCheck('JMeter', 'passed', 'available in PATH');
    } catch (error) {
      // Check if JMETER_HOME is set
      if (process.env.JMETER_HOME) {
        this.addCheck('JMeter', 'passed', `JMETER_HOME: ${process.env.JMETER_HOME}`);
      } else {
        this.addWarning('JMeter', 'not available (will be downloaded if needed)');
      }
    }
  }

  checkNpmScripts() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};

      const criticalScripts = ['test:ui', 'test:api', 'test:ci:smoke', 'lint', 'build'];

      criticalScripts.forEach((script) => {
        if (scripts[script]) {
          this.addCheck(`Script: ${script}`, 'passed', 'defined');
        } else {
          this.addWarning(`Script: ${script}`, 'not defined');
        }
      });
    } catch (error) {
      this.addError('NPM Scripts', 'Unable to check scripts');
    }
  }

  checkTestDirectories() {
    const testDirs = [
      'automated-tests/ui-tests',
      'automated-tests/api-tests',
      'automated-tests/performance-tests',
      'automated-tests/accessibility-tests',
      'automated-tests/security-tests',
    ];

    testDirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        // Count test files
        try {
          const files = fs
            .readdirSync(dir, { recursive: true })
            .filter(
              (file) =>
                file.endsWith('.spec.js') || file.endsWith('.spec.ts') || file.endsWith('.test.js')
            );
          this.addCheck(`Test Directory: ${dir}`, 'passed', `${files.length} test files`);
        } catch (error) {
          this.addCheck(`Test Directory: ${dir}`, 'passed', 'exists');
        }
      } else {
        this.addWarning(`Test Directory: ${dir}`, 'missing');
      }
    });
  }

  addCheck(name, status, details) {
    this.checks.push({ name, status, details });
    const icon = status === 'passed' ? '[PASS]' : status === 'warning' ? '[WARN]' : '[FAIL]';
    console.log(`${icon} ${name}: ${details}`);
  }

  addWarning(name, message) {
    this.warnings.push({ name, message });
    this.addCheck(name, 'warning', message);
  }

  addError(name, message) {
    this.errors.push({ name, message });
    this.addCheck(name, 'failed', message);
  }

  generateReport() {
    console.log('\nHealth Check Summary');
    console.log('====================');
    console.log(`Total Checks: ${this.checks.length}`);
    console.log(`Passed: ${this.checks.filter((c) => c.status === 'passed').length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\nCritical Issues:');
      this.errors.forEach((error) => {
        console.log(`  - ${error.name}: ${error.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\nWarnings:');
      this.warnings.forEach((warning) => {
        console.log(`  - ${warning.name}: ${warning.message}`);
      });
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.checks.length,
        passed: this.checks.filter((c) => c.status === 'passed').length,
        warnings: this.warnings.length,
        errors: this.errors.length,
      },
      checks: this.checks,
      warnings: this.warnings,
      errors: this.errors,
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(reportsDir, 'health-check.json'), JSON.stringify(report, null, 2));
  }
}

// Run health check if called directly
if (require.main === module) {
  const healthCheck = new CIHealthCheck();
  healthCheck.runAllChecks().catch(console.error);
}

module.exports = CIHealthCheck;
