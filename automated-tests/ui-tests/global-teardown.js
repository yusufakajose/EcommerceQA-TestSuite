/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */

const fs = require('fs');
const path = require('path');

async function globalTeardown() {
  console.log('Starting global teardown...');

  try {
    // Generate test execution summary
    const testResultsPath = 'reports/test-execution/test-results.json';

    if (fs.existsSync(testResultsPath)) {
      const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));

      const summary = {
        timestamp: new Date().toISOString(),
        totalTests:
          testResults.suites?.reduce((total, suite) => {
            return total + (suite.specs?.length || 0);
          }, 0) || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: testResults.stats?.duration || 0,
      };

      // Calculate test statistics
      if (testResults.suites) {
        testResults.suites.forEach((suite) => {
          if (suite.specs) {
            suite.specs.forEach((spec) => {
              if (spec.tests) {
                spec.tests.forEach((test) => {
                  if (test.results) {
                    test.results.forEach((result) => {
                      switch (result.status) {
                        case 'passed':
                          summary.passed++;
                          break;
                        case 'failed':
                          summary.failed++;
                          break;
                        case 'skipped':
                          summary.skipped++;
                          break;
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }

      // Save summary
      fs.writeFileSync(
        'reports/test-execution/test-summary.json',
        JSON.stringify(summary, null, 2)
      );

      console.log('Test Execution Summary:');
      console.log(`   Total Tests: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   ❌ Failed: ${summary.failed}`);
      console.log(`   ⏭️  Skipped: ${summary.skipped}`);
      console.log(`   ⏱️  Duration: ${Math.round(summary.duration / 1000)}s`);
    }

    // Archive test artifacts if needed
    const archiveOldResults = process.env.ARCHIVE_RESULTS === 'true';
    if (archiveOldResults) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveDir = `reports/archived/${timestamp}`;

      if (!fs.existsSync('reports/archived')) {
        fs.mkdirSync('reports/archived', { recursive: true });
      }

      // Move current results to archive
      if (fs.existsSync('reports/test-execution')) {
        fs.renameSync('reports/test-execution', archiveDir);
        console.log(`Test results archived to: ${archiveDir}`);
      }
    }

    console.log('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Error during global teardown:', error.message);
  }
}

module.exports = globalTeardown;
