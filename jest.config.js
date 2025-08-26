module.exports = {
  testEnvironment: "node",
  testMatch: ["**/contract-tests/**/*.spec.js"],
  setupFilesAfterEnv: ["./automated-tests/contract-tests/consumer/pact-setup.js"],
};
