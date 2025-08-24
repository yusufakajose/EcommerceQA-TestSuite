/**
 * Example Playwright test demonstrating the testing framework
 * This test showcases the custom fixtures and setup utilities
 */
const { test, expect } = require('./fixtures');
test.describe('E-commerce Application - Framework Demo', () => {
    test('should demonstrate basic test setup and navigation', async ({ testSetup }) => {
        // Load test data
        const testData = await testSetup.loadTestData('users');
        // Navigate to the application
        await testSetup.navigateToApp('/');
        // Take a screenshot for documentation
        await testSetup.takeScreenshot('homepage-loaded');
        // Verify page title or main heading
        await expect(testSetup.page).toHaveTitle(/E-commerce|Shop|Store/i);
        // Wait for page to be fully loaded
        await testSetup.waitForPageLoad();
        console.log('✅ Basic navigation test completed');
    });
    test('should demonstrate mobile responsive testing', async ({ mobileDevice }) => {
        const { page, testSetup } = mobileDevice;
        // Navigate to homepage on mobile
        await testSetup.navigateToApp('/');
        // Verify mobile viewport
        const viewport = page.viewportSize();
        expect(viewport.width).toBeLessThanOrEqual(414); // iPhone 12 width
        // Take mobile screenshot
        await testSetup.takeScreenshot('mobile-homepage');
        // Test mobile navigation menu (if exists)
        try {
            await testSetup.clickElement('[data-testid="mobile-menu-button"]');
            await testSetup.takeScreenshot('mobile-menu-open');
        }
        catch (error) {
            console.log('Mobile menu not found - this is expected for demo');
        }
        console.log('✅ Mobile responsive test completed');
    });
    test('should demonstrate API integration testing', async ({ testSetup, apiContext }) => {
        // Test API endpoint
        const response = await apiContext.get('/health');
        if (response.ok()) {
            const healthData = await response.json();
            expect(healthData).toHaveProperty('status');
            console.log('✅ API health check passed');
        }
        else {
            console.log('⚠️  API not available - this is expected for demo');
        }
        // Navigate to application
        await testSetup.navigateToApp('/');
        // Demonstrate hybrid UI + API testing
        await testSetup.takeScreenshot('api-integration-demo');
        console.log('✅ API integration test completed');
    });
    test('should demonstrate error handling and recovery', async ({ testSetup }) => {
        // Navigate to a non-existent page to test error handling
        try {
            await testSetup.navigateToApp('/non-existent-page');
        }
        catch (error) {
            console.log('Expected navigation error for demo purposes');
        }
        // Take screenshot of error state
        await testSetup.takeScreenshot('error-page-demo');
        // Navigate back to valid page
        await testSetup.navigateToApp('/');
        // Verify recovery
        await testSetup.waitForPageLoad();
        await expect(testSetup.page).toHaveURL(/localhost:3000/);
        console.log('✅ Error handling and recovery test completed');
    });
    test('should demonstrate test data management', async ({ testSetup }) => {
        // Load different types of test data
        const userData = await testSetup.loadTestData('users');
        const productData = await testSetup.loadTestData('products');
        // Navigate to application
        await testSetup.navigateToApp('/');
        // Log test data for demonstration
        console.log('User test data loaded:', Object.keys(userData));
        console.log('Product test data loaded:', Object.keys(productData));
        // Take screenshot showing data-driven testing setup
        await testSetup.takeScreenshot('test-data-demo');
        console.log('✅ Test data management demo completed');
    });
    test.skip('should demonstrate authenticated user fixture', async ({ authenticatedUser }) => {
        const { testSetup, user } = authenticatedUser;
        // This test will be skipped since we don't have a real login system
        // but demonstrates how the authenticated user fixture would work
        console.log(`Authenticated as: ${user.email}`);
        await testSetup.takeScreenshot('authenticated-user-demo');
        console.log('✅ Authenticated user test completed');
    });
    test.skip('should demonstrate shopping cart fixture', async ({ cartWithItems }) => {
        const { testSetup, cartItems } = cartWithItems;
        // This test will be skipped since we don't have a real shopping system
        // but demonstrates how the cart fixture would work
        console.log(`Cart contains ${cartItems.length} items`);
        await testSetup.takeScreenshot('cart-with-items-demo');
        console.log('✅ Shopping cart test completed');
    });
});
