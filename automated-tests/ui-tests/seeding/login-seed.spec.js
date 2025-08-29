const { test } = require('../fixtures');

test.describe('UI Seed: Login', () => {
  test('seed login flow and logout', async ({ testSetup }) => {
    // Load user data or fallback to env/defaults
    const data = await testSetup.loadTestData('users');
    const envEmail = process.env.SEED_USER_EMAIL || process.env.USER_EMAIL;
    const envPass = process.env.SEED_USER_PASSWORD || process.env.USER_PASSWORD;
    const validUser = data.validUsers?.[0] || {
      email: envEmail || 'test@example.com',
      password: envPass || 'password123',
    };

    await testSetup.loginViaUI(validUser.email, validUser.password);
    // Immediately logout to leave clean session
    await testSetup.logoutViaUI();
  });
});
