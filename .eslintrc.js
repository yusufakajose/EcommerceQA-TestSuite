module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  globals: {
    expect: 'readonly',
    test: 'readonly',
    describe: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
  },
  extends: [
    'eslint:recommended',
  ],
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
    
    // Style rules (relaxed)
    'indent': 'off',
    'quotes': 'off',
    'semi': 'off',
    'comma-dangle': 'off',
    'max-len': 'off',
    'no-prototype-builtins': 'off',
    'no-useless-escape': 'off',
    'no-dupe-class-members': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-console': 'off',
        // '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'reports/',
    'test-results/',
    '*.config.js',
  ],
};