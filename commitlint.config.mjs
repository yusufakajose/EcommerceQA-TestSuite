export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep headers readable
    'header-max-length': [2, 'always', 100],
  },
};
