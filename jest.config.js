module.exports = {
  testEnvironment: 'node',
  // Include both contract tests and internal unit tests (e.g., JMeter JTL parser)
  testMatch: [
    '**/contract-tests/**/*.spec.js',
    '**/scripts/load-testing/**/__tests__/**/*.spec.js',
  ],
};
