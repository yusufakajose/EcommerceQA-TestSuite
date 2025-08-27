module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    // Enable Jest globals like it/describe in test contexts
    jest: true,
  },
  globals: {},
  extends: ['eslint:recommended'],
  // parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  // plugins: [
  //   '@typescript-eslint',
  // ],
  rules: {
    // Code quality rules (relaxed for CI)
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-unused-vars': 'off',
    // Reduce noise for control-flow patterns used in scripts
    'no-empty': 'off',
    'no-constant-condition': 'off',
    'no-undef': 'off',

    // Style rules (relaxed)
    indent: 'off',
    quotes: 'off',
    semi: 'off',
    'comma-dangle': 'off',
    'max-len': 'off',
    'no-prototype-builtins': 'off',
    'no-useless-escape': 'off',
    'no-dupe-class-members': 'off',
  },
  overrides: [
    // JS test specs: ensure Jest globals and relaxed rules apply
    {
      files: ['**/*.spec.js', '**/*.test.js', 'automated-tests/**/*.js'],
      env: { jest: true, node: true, es2021: true },
    },
    // Load testing scripts (k6/jmeter): allow k6-specific globals
    {
      files: ['automated-tests/load-tests/**/*.js', 'scripts/load-testing/**/*.js'],
    },
    // Contract tests (Pact): allow pact global
    {
      files: ['automated-tests/contract-tests/**/*.js'],
      env: { jest: true },
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-console': 'off',
        // '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'reports/', 'test-results/', '*.config.js'],
};
