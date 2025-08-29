const { test } = require('../fixtures');

test.describe('UI Seed: Cart', () => {
  test('add items and clear cart', async ({ testSetup }) => {
    // Ensure starting from empty cart
    await testSetup.ensureCartEmpty();

    // Determine product IDs from env or fixture fallbacks
    const idsEnv = process.env.SEED_PRODUCT_IDS || '1,2';
    const ids = idsEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await testSetup.addItemsToCartByIds(ids);

    // Leave system clean
    await testSetup.ensureCartEmpty();
  });
});
