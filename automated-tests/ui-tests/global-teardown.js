// Global teardown for Playwright tests
// This file runs once after all tests

async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  // Add any global cleanup logic here:
  // - Database cleanup
  // - Test data removal
  // - Resource cleanup
  
  console.log('✅ Global test teardown completed');
}

module.exports = globalTeardown;