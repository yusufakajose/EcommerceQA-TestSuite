#!/usr/bin/env node

/**
 * Test Environment Setup Script
 * Prepares the testing environment and validates configuration
 */

const fs = require('fs');
const path = require('path');

console.log('Setting up test environment...\n');

// Required directories
const requiredDirectories = [
  'test-results',
  'reports/test-execution',
  'reports/test-execution/development',
  'reports/test-execution/staging',
  'reports/test-execution/production',
  'automated-tests/ui-tests/screenshots',
  'automated-tests/ui-tests/videos',
  'test-data/fixtures',
  'test-data/datasets',
];

// Create required directories
console.log('Creating required directories...');
requiredDirectories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ Created: ${dir}`);
  } else {
    console.log(`   ✓ Exists: ${dir}`);
  }
});

// Validate configuration files
console.log('\nValidating configuration files...');
const configFiles = [
  'config/playwright.config.js',
  'config/environments/development.json',
  'config/environments/staging.json',
  'config/environments/production.json',
];

configFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ Found: ${file}`);
  } else {
    console.log(`   ❌ Missing: ${file}`);
  }
});

// Validate test data fixtures
console.log('\nValidating test data fixtures...');
const fixtureFiles = [
  'test-data/fixtures/users.json',
  'test-data/fixtures/products.json',
  'test-data/fixtures/orders.json',
];

fixtureFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      console.log(`   ✅ Valid JSON: ${file}`);
    } catch (error) {
      console.log(`   ❌ Invalid JSON: ${file} - ${error.message}`);
    }
  } else {
    console.log(`   ❌ Missing: ${file}`);
  }
});

// Check for Playwright installation
console.log('\nChecking Playwright installation...');
try {
  const { execSync } = require('child_process');
  execSync('npx playwright --version', { stdio: 'pipe' });
  console.log('   ✅ Playwright is installed');

  // Check if browsers are installed
  try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    console.log('   ✅ Playwright browsers are installed');
  } catch (error) {
    console.log('   Playwright browsers may need installation');
    console.log('   Run: npm run install:browsers');
  }
} catch (error) {
  console.log('   Playwright not found');
  console.log('   Run: npm install');
}

// Generate environment info
console.log('\nEnvironment Information:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);
console.log(`   Working Directory: ${process.cwd()}`);

// Create .env.example file
const envExample = `# Test Environment Configuration
# Copy this file to .env and update values as needed

# Test Environment (development, staging, production)
TEST_ENV=development

# Base URLs
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001/api

# Debug Options
DEBUG_REQUESTS=false
DEBUG_RESPONSES=false
DEBUG_CONSOLE=true

# Test Execution Options
HEADLESS=true
SLOW_MO=0
RETRIES=0
WORKERS=4

# Reporting Options
ARCHIVE_RESULTS=false
OPEN_REPORT=true

# CI/CD Options
CI=false
`;

if (!fs.existsSync('.env.example')) {
  fs.writeFileSync('.env.example', envExample);
  console.log('\nCreated .env.example file');
}

// Create README for test setup
const testReadme = `# Test Environment Setup

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Install Playwright browsers:
   \`\`\`bash
   npm run install:browsers
   \`\`\`

3. Set up test environment:
   \`\`\`bash
   npm run setup:test-env
   \`\`\`

4. Run tests:
   \`\`\`bash
   npm run test:ui:dev
   \`\`\`

## Environment-Specific Testing

- Development: \`npm run test:ui:dev\`
- Staging: \`npm run test:ui:staging\`
- Production: \`npm run test:ui:prod\`

## Browser-Specific Testing

- Chrome: \`npm run test:ui:chrome\`
- Firefox: \`npm run test:ui:firefox\`
- Safari: \`npm run test:ui:safari\`

## Device-Specific Testing

- Mobile: \`npm run test:ui:mobile\`
- Desktop: \`npm run test:ui:desktop\`

## Reports

- Open latest report: \`npm run report:open\`
- Open development report: \`npm run report:open:dev\`
- Open staging report: \`npm run report:open:staging\`

## Cleanup

- Clean reports: \`npm run clean:reports\`
- Clean screenshots: \`npm run clean:screenshots\`
`;

if (!fs.existsSync('automated-tests/README.md')) {
  fs.writeFileSync('automated-tests/README.md', testReadme);
  console.log('Created automated-tests/README.md');
}

console.log('\nTest environment setup completed!');
console.log('\nNext steps:');
console.log('   1. Run: npm run install:browsers');
console.log('   2. Run: npm run test:ui:dev');
console.log('   3. Run: npm run report:open');
console.log('\nFor more information, see automated-tests/README.md');
