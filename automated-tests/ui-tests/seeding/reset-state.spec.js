const { test } = require('../fixtures');

test.describe('UI Seed: Reset State', () => {
  test('clear session and cart', async ({ testSetup }) => {
    await testSetup.clearBrowserData();
    await testSetup.ensureCartEmpty();
  });
});
