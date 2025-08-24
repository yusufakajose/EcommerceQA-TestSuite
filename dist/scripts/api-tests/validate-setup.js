#!/usr/bin/env node
/**
 * API Test Setup Validator
 * Validates that all required files and configurations are in place for API testing
 */
const fs = require('fs');
const path = require('path');
class APITestValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.configPath = path.join(process.cwd(), 'config/postman/newman.config.json');
    }
    /**
     * Run all validation checks
     */
    async validate() {
        console.log('🔍 Validating API test setup...\n');
        this.validateDirectoryStructure();
        this.validateConfigFiles();
        this.validateCollections();
        this.validateEnvironments();
        this.validateDataFiles();
        this.validateDependencies();
        this.validateScripts();
        this.printResults();
        return this.errors.length === 0;
    }
    /**
     * Validate directory structure
     */
    validateDirectoryStructure() {
        console.log('📁 Checking directory structure...');
        const requiredDirs = [
            'config/postman',
            'config/postman/collections',
            'config/postman/environments',
            'config/postman/data',
            'scripts/api-tests',
            'reports',
            'test-results'
        ];
        requiredDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                this.errors.push(`Missing directory: ${dir}`);
            }
            else {
                console.log(`  ✅ ${dir}`);
            }
        });
    }
    /**
     * Validate configuration files
     */
    validateConfigFiles() {
        console.log('\n⚙️  Checking configuration files...');
        // Check Newman config
        if (!fs.existsSync(this.configPath)) {
            this.errors.push(`Missing Newman config: ${this.configPath}`);
            return;
        }
        try {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            console.log('  ✅ Newman configuration loaded');
            // Validate config structure
            if (!config.environments) {
                this.errors.push('Newman config missing environments section');
            }
            if (!config.collections) {
                this.errors.push('Newman config missing collections section');
            }
            if (!config.data) {
                this.warnings.push('Newman config missing data section (optional)');
            }
        }
        catch (error) {
            this.errors.push(`Invalid Newman config JSON: ${error.message}`);
        }
        // Check package.json
        const packagePath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packagePath)) {
            this.errors.push('Missing package.json');
        }
        else {
            try {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                // Check for Newman dependency
                const hasNewman = pkg.devDependencies?.newman || pkg.dependencies?.newman;
                if (!hasNewman) {
                    this.errors.push('Newman dependency not found in package.json');
                }
                else {
                    console.log('  ✅ Newman dependency found');
                }
                // Check for HTML reporter
                const hasHtmlReporter = pkg.devDependencies?.['newman-reporter-htmlextra'] ||
                    pkg.dependencies?.['newman-reporter-htmlextra'];
                if (!hasHtmlReporter) {
                    this.warnings.push('newman-reporter-htmlextra not found (recommended for better reports)');
                }
                else {
                    console.log('  ✅ HTML reporter dependency found');
                }
            }
            catch (error) {
                this.errors.push(`Invalid package.json: ${error.message}`);
            }
        }
    }
    /**
     * Validate Postman collections
     */
    validateCollections() {
        console.log('\n📚 Checking Postman collections...');
        const config = this.loadConfig();
        if (!config || !config.collections)
            return;
        Object.entries(config.collections).forEach(([name, filePath]) => {
            const fullPath = path.resolve(filePath);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`Collection file not found: ${filePath}`);
                return;
            }
            try {
                const collection = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                // Basic validation
                if (!collection.info || !collection.info.name) {
                    this.errors.push(`Invalid collection structure: ${filePath}`);
                    return;
                }
                // Check for requests
                const requestCount = this.countRequests(collection);
                if (requestCount === 0) {
                    this.warnings.push(`Collection '${name}' has no requests`);
                }
                else {
                    console.log(`  ✅ ${name} (${requestCount} requests)`);
                }
            }
            catch (error) {
                this.errors.push(`Invalid collection JSON '${name}': ${error.message}`);
            }
        });
    }
    /**
     * Validate environment files
     */
    validateEnvironments() {
        console.log('\n🌍 Checking environment files...');
        const config = this.loadConfig();
        if (!config || !config.environments)
            return;
        Object.entries(config.environments).forEach(([name, filePath]) => {
            const fullPath = path.resolve(filePath);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`Environment file not found: ${filePath}`);
                return;
            }
            try {
                const environment = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                // Basic validation
                if (!environment.name || !environment.values) {
                    this.errors.push(`Invalid environment structure: ${filePath}`);
                    return;
                }
                // Check for base URL
                const hasBaseUrl = environment.values.some(v => v.key && (v.key.toLowerCase().includes('url') || v.key.toLowerCase().includes('host')));
                if (!hasBaseUrl) {
                    this.warnings.push(`Environment '${name}' may be missing base URL variable`);
                }
                console.log(`  ✅ ${name} (${environment.values.length} variables)`);
            }
            catch (error) {
                this.errors.push(`Invalid environment JSON '${name}': ${error.message}`);
            }
        });
    }
    /**
     * Validate data files
     */
    validateDataFiles() {
        console.log('\n📊 Checking data files...');
        const config = this.loadConfig();
        if (!config || !config.data) {
            console.log('  ⚠️  No data files configured (optional)');
            return;
        }
        Object.entries(config.data).forEach(([name, filePath]) => {
            const fullPath = path.resolve(filePath);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`Data file not found: ${filePath}`);
                return;
            }
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    this.warnings.push(`Data file '${name}' appears to be empty or has no data rows`);
                }
                else {
                    console.log(`  ✅ ${name} (${lines.length - 1} data rows)`);
                }
            }
            catch (error) {
                this.errors.push(`Cannot read data file '${name}': ${error.message}`);
            }
        });
    }
    /**
     * Validate dependencies
     */
    validateDependencies() {
        console.log('\n📦 Checking dependencies...');
        try {
            require('newman');
            console.log('  ✅ Newman module available');
        }
        catch (error) {
            this.errors.push('Newman module not installed. Run: npm install newman');
        }
        try {
            require('newman-reporter-htmlextra');
            console.log('  ✅ HTML reporter module available');
        }
        catch (error) {
            this.warnings.push('HTML reporter not installed. Run: npm install newman-reporter-htmlextra');
        }
    }
    /**
     * Validate npm scripts
     */
    validateScripts() {
        console.log('\n📜 Checking npm scripts...');
        const packagePath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packagePath))
            return;
        try {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            const scripts = pkg.scripts || {};
            const expectedScripts = [
                'test:api',
                'test:api:dev',
                'test:api:staging',
                'test:api:users',
                'test:api:products',
                'test:api:orders'
            ];
            expectedScripts.forEach(script => {
                if (scripts[script]) {
                    console.log(`  ✅ ${script}`);
                }
                else {
                    this.warnings.push(`Missing npm script: ${script}`);
                }
            });
        }
        catch (error) {
            this.errors.push(`Cannot validate npm scripts: ${error.message}`);
        }
    }
    /**
     * Load configuration
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            }
        }
        catch (error) {
            // Already handled in validateConfigFiles
        }
        return null;
    }
    /**
     * Count requests in a collection
     */
    countRequests(collection, count = 0) {
        if (collection.item) {
            collection.item.forEach(item => {
                if (item.request) {
                    count++;
                }
                else if (item.item) {
                    count = this.countRequests(item, count);
                }
            });
        }
        return count;
    }
    /**
     * Print validation results
     */
    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 VALIDATION RESULTS');
        console.log('='.repeat(50));
        if (this.errors.length === 0) {
            console.log('✅ All critical validations passed!');
        }
        else {
            console.log(`❌ Found ${this.errors.length} error(s):`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Found ${this.warnings.length} warning(s):`);
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        console.log('\n' + '='.repeat(50));
        if (this.errors.length === 0) {
            console.log('🎉 Your API test setup is ready!');
            console.log('\nNext steps:');
            console.log('  • Run: npm run test:api');
            console.log('  • Check reports in the reports/ directory');
            console.log('  • Customize collections and environments as needed');
        }
        else {
            console.log('🔧 Please fix the errors above before running API tests.');
        }
    }
}
// CLI Interface
if (require.main === module) {
    const validator = new APITestValidator();
    validator.validate().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}
module.exports = APITestValidator;
