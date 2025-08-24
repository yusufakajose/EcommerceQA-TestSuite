/**
 * Visual Regression Test Suite
 * Screenshot comparison tests to detect visual changes across browsers and devices
 */
const { test, expect } = require('@playwright/test');
const ProductCatalogPage = require('./pages/ProductCatalogPage');
const ShoppingCartPage = require('./pages/ShoppingCartPage');
const CheckoutPage = require('./pages/CheckoutPage');
const LoginPage = require('./pages/LoginPage');
const TestDataHelper = require('../../test-data/TestDataHelper');
let testDataHelper;
// Visual testing configuration
const visualConfig = {
    threshold: 0.2, // 20% difference threshold
    animations: 'disabled', // Disable animations for consistent screenshots
    clip: null // Full page screenshots by default
};
test.describe('Visual Regression Tests', () => {
    test.beforeAll(async () => {
        testDataHelper = new TestDataHelper('development');
        await testDataHelper.initializeTestSuite('VisualRegression');
    });
    test.afterAll(async () => {
        testDataHelper.cleanupTestSuite();
    });
    test.afterEach(async ({ page }, testInfo) => {
        testDataHelper.cleanupTestData(testInfo.title);
    });
    test.describe('Homepage Visual Tests', () => {
        test('should match homepage layout across browsers', async ({ page, browserName }) => {
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            // Wait for page to fully load
            await catalogPage.waitForPageLoad();
            // Hide dynamic content that might change
            await page.addStyleTag({
                content: `
          .timestamp, .current-time, .live-chat, .notification-badge {
            visibility: hidden !important;
          }
          * {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
            });
            // Take full page screenshot
            await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
                fullPage: true,
                threshold: visualConfig.threshold,
                animations: visualConfig.animations
            });
        });
        test('should match homepage header across viewports', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            await catalogPage.waitForPageLoad();
            // Test different viewport sizes
            const viewports = [
                { width: 1920, height: 1080, name: 'desktop-xl' },
                { width: 1366, height: 768, name: 'desktop' },
                { width: 768, height: 1024, name: 'tablet' },
                { width: 375, height: 667, name: 'mobile' }
            ];
            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                // Wait for responsive layout to settle
                await page.waitForTimeout(500);
                // Screenshot just the header
                const header = catalogPage.getHeader();
                await expect(header).toHaveScreenshot(`header-${viewport.name}.png`, {
                    threshold: visualConfig.threshold
                });
            }
        });
        test('should match navigation menu states', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            await catalogPage.waitForPageLoad();
            // Screenshot default navigation
            const navigation = catalogPage.getNavigation();
            await expect(navigation).toHaveScreenshot('navigation-default.png', {
                threshold: visualConfig.threshold
            });
            // Test mobile menu if available
            await page.setViewportSize({ width: 375, height: 667 });
            await page.waitForTimeout(500);
            const mobileMenuButton = catalogPage.getMobileMenuButton();
            const isMobileMenuVisible = await mobileMenuButton.isVisible().catch(() => false);
            if (isMobileMenuVisible) {
                // Screenshot mobile menu button
                await expect(mobileMenuButton).toHaveScreenshot('mobile-menu-button.png', {
                    threshold: visualConfig.threshold
                });
                // Open mobile menu and screenshot
                await mobileMenuButton.click();
                await page.waitForTimeout(500);
                const mobileMenu = catalogPage.getMobileMenu();
                await expect(mobileMenu).toHaveScreenshot('mobile-menu-open.png', {
                    threshold: visualConfig.threshold
                });
            }
        });
    });
    test.describe('Product Catalog Visual Tests', () => {
        test('should match product grid layout', async ({ page, browserName }) => {
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            await catalogPage.waitForPageLoad();
            // Wait for products to load
            await expect(catalogPage.getAllProducts().first()).toBeVisible();
            // Hide dynamic elements
            await page.addStyleTag({
                content: `
          .price-change, .stock-indicator, .rating-count {
            visibility: hidden !important;
          }
        `
            });
            // Screenshot product grid
            const productGrid = catalogPage.getProductGrid();
            await expect(productGrid).toHaveScreenshot(`product-grid-${browserName}.png`, {
                threshold: visualConfig.threshold
            });
        });
        test('should match individual product cards', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            await catalogPage.waitForPageLoad();
            const products = catalogPage.getAllProducts();
            const productCount = await products.count();
            // Screenshot first few product cards
            for (let i = 0; i < Math.min(3, productCount); i++) {
                const product = products.nth(i);
                await expect(product).toHaveScreenshot(`product-card-${i}.png`, {
                    threshold: visualConfig.threshold
                });
            }
        });
        test('should match search results layout', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            await catalogPage.searchProducts('headphones');
            // Wait for search results
            await page.waitForTimeout(2000);
            // Screenshot search results
            const searchResults = catalogPage.getSearchResultsContainer();
            await expect(searchResults).toHaveScreenshot('search-results.png', {
                threshold: visualConfig.threshold
            });
            // Test no results state
            await catalogPage.searchProducts('nonexistentproduct12345');
            await page.waitForTimeout(2000);
            const noResultsMessage = catalogPage.getNoResultsMessage();
            const isNoResultsVisible = await noResultsMessage.isVisible().catch(() => false);
            if (isNoResultsVisible) {
                await expect(noResultsMessage).toHaveScreenshot('no-search-results.png', {
                    threshold: visualConfig.threshold
                });
            }
        });
        test('should match filter sidebar', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            await catalogPage.waitForPageLoad();
            // Screenshot filter sidebar
            const filterSidebar = catalogPage.getFilterSidebar();
            const isFilterVisible = await filterSidebar.isVisible().catch(() => false);
            if (isFilterVisible) {
                await expect(filterSidebar).toHaveScreenshot('filter-sidebar.png', {
                    threshold: visualConfig.threshold
                });
                // Test with active filters
                await catalogPage.filterByCategory('Electronics');
                await page.waitForTimeout(1000);
                await expect(filterSidebar).toHaveScreenshot('filter-sidebar-active.png', {
                    threshold: visualConfig.threshold
                });
            }
        });
    });
    test.describe('Shopping Cart Visual Tests', () => {
        test('should match empty cart state', async ({ page, browserName }) => {
            const cartPage = new ShoppingCartPage(page);
            await cartPage.navigate();
            // Screenshot empty cart
            await expect(page).toHaveScreenshot(`empty-cart-${browserName}.png`, {
                fullPage: true,
                threshold: visualConfig.threshold
            });
        });
        test('should match cart with items', async ({ page, browserName }) => {
            const catalogPage = new ProductCatalogPage(page);
            const cartPage = new ShoppingCartPage(page);
            // Add items to cart
            await catalogPage.navigate();
            await catalogPage.addProductToCart('prod001');
            await catalogPage.addProductToCart('prod002');
            await cartPage.navigate();
            // Wait for cart items to load
            await expect(cartPage.getCartItems().first()).toBeVisible();
            // Hide dynamic pricing that might change
            await page.addStyleTag({
                content: `
          .dynamic-price, .price-update, .timestamp {
            visibility: hidden !important;
          }
        `
            });
            // Screenshot cart with items
            await expect(page).toHaveScreenshot(`cart-with-items-${browserName}.png`, {
                fullPage: true,
                threshold: visualConfig.threshold
            });
        });
        test('should match cart item components', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            const cartPage = new ShoppingCartPage(page);
            await catalogPage.navigate();
            await catalogPage.addProductToCart('prod001');
            await cartPage.navigate();
            // Screenshot individual cart item
            const cartItem = cartPage.getCartItems().first();
            await expect(cartItem).toHaveScreenshot('cart-item.png', {
                threshold: visualConfig.threshold
            });
            // Screenshot cart summary
            const cartSummary = cartPage.getCartSummary();
            await expect(cartSummary).toHaveScreenshot('cart-summary.png', {
                threshold: visualConfig.threshold
            });
        });
    });
    test.describe('Checkout Process Visual Tests', () => {
        test('should match checkout form layout', async ({ page, browserName }) => {
            const catalogPage = new ProductCatalogPage(page);
            const cartPage = new ShoppingCartPage(page);
            const checkoutPage = new CheckoutPage(page);
            // Add item and go to checkout
            await catalogPage.navigate();
            await catalogPage.addProductToCart('prod001');
            await cartPage.navigate();
            await cartPage.proceedToCheckout();
            // Wait for checkout form to load
            await expect(checkoutPage.getCheckoutForm()).toBeVisible();
            // Screenshot checkout form
            await expect(page).toHaveScreenshot(`checkout-form-${browserName}.png`, {
                fullPage: true,
                threshold: visualConfig.threshold
            });
        });
        test('should match form validation states', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            const cartPage = new ShoppingCartPage(page);
            const checkoutPage = new CheckoutPage(page);
            await catalogPage.navigate();
            await catalogPage.addProductToCart('prod001');
            await cartPage.navigate();
            await cartPage.proceedToCheckout();
            // Try to submit empty form to trigger validation
            await checkoutPage.submitForm();
            // Wait for validation errors
            await page.waitForTimeout(1000);
            // Screenshot form with validation errors
            const checkoutForm = checkoutPage.getCheckoutForm();
            await expect(checkoutForm).toHaveScreenshot('checkout-form-validation.png', {
                threshold: visualConfig.threshold
            });
        });
        test('should match payment form', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            const cartPage = new ShoppingCartPage(page);
            const checkoutPage = new CheckoutPage(page);
            await catalogPage.navigate();
            await catalogPage.addProductToCart('prod001');
            await cartPage.navigate();
            await cartPage.proceedToCheckout();
            // Fill shipping info to get to payment section
            await checkoutPage.fillShippingAddress({
                firstName: 'Visual',
                lastName: 'Test',
                street: '123 Test St',
                city: 'Test City',
                state: 'CA',
                zipCode: '12345',
                phone: '555-0123'
            });
            // Screenshot payment form
            const paymentForm = checkoutPage.getPaymentForm();
            const isPaymentVisible = await paymentForm.isVisible().catch(() => false);
            if (isPaymentVisible) {
                await expect(paymentForm).toHaveScreenshot('payment-form.png', {
                    threshold: visualConfig.threshold
                });
            }
        });
    });
    test.describe('Form Elements Visual Tests', () => {
        test('should match login form', async ({ page, browserName }) => {
            const loginPage = new LoginPage(page);
            await loginPage.navigate();
            // Screenshot login form
            const loginForm = loginPage.getLoginForm();
            await expect(loginForm).toHaveScreenshot(`login-form-${browserName}.png`, {
                threshold: visualConfig.threshold
            });
        });
        test('should match form input states', async ({ page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.navigate();
            const emailInput = loginPage.getEmailField();
            const passwordInput = loginPage.getPasswordField();
            // Screenshot empty inputs
            await expect(emailInput).toHaveScreenshot('input-empty.png', {
                threshold: visualConfig.threshold
            });
            // Screenshot focused input
            await emailInput.focus();
            await expect(emailInput).toHaveScreenshot('input-focused.png', {
                threshold: visualConfig.threshold
            });
            // Screenshot filled input
            await emailInput.fill('test@example.com');
            await expect(emailInput).toHaveScreenshot('input-filled.png', {
                threshold: visualConfig.threshold
            });
            // Screenshot error state
            await emailInput.fill('invalid-email');
            await passwordInput.focus(); // Trigger validation
            await page.waitForTimeout(500);
            await expect(emailInput).toHaveScreenshot('input-error.png', {
                threshold: visualConfig.threshold
            });
        });
        test('should match button states', async ({ page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.navigate();
            const submitButton = loginPage.getSubmitButton();
            // Screenshot default button
            await expect(submitButton).toHaveScreenshot('button-default.png', {
                threshold: visualConfig.threshold
            });
            // Screenshot hovered button (desktop only)
            if (page.viewportSize().width > 768) {
                await submitButton.hover();
                await expect(submitButton).toHaveScreenshot('button-hover.png', {
                    threshold: visualConfig.threshold
                });
            }
            // Screenshot disabled button
            await page.addStyleTag({
                content: `
          .submit-button, button[type="submit"] {
            opacity: 0.5;
            pointer-events: none;
          }
        `
            });
            await expect(submitButton).toHaveScreenshot('button-disabled.png', {
                threshold: visualConfig.threshold
            });
        });
    });
    test.describe('Responsive Visual Tests', () => {
        const responsiveViewports = [
            { width: 1920, height: 1080, name: 'desktop-xl' },
            { width: 1366, height: 768, name: 'desktop' },
            { width: 1024, height: 768, name: 'tablet-landscape' },
            { width: 768, height: 1024, name: 'tablet-portrait' },
            { width: 414, height: 896, name: 'mobile-large' },
            { width: 375, height: 667, name: 'mobile-medium' },
            { width: 320, height: 568, name: 'mobile-small' }
        ];
        responsiveViewports.forEach(viewport => {
            test(`should match layout on ${viewport.name}`, async ({ page }) => {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                const catalogPage = new ProductCatalogPage(page);
                await catalogPage.navigate();
                await catalogPage.waitForPageLoad();
                // Wait for responsive layout to settle
                await page.waitForTimeout(500);
                // Hide dynamic content
                await page.addStyleTag({
                    content: `
            .timestamp, .live-data, .notification {
              visibility: hidden !important;
            }
            * {
              animation: none !important;
              transition: none !important;
            }
          `
                });
                // Screenshot full page
                await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, {
                    fullPage: true,
                    threshold: visualConfig.threshold
                });
            });
        });
        test('should match mobile navigation menu', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            const catalogPage = new ProductCatalogPage(page);
            await catalogPage.navigate();
            const mobileMenuButton = catalogPage.getMobileMenuButton();
            const isMobileMenuVisible = await mobileMenuButton.isVisible().catch(() => false);
            if (isMobileMenuVisible) {
                // Open mobile menu
                await mobileMenuButton.click();
                await page.waitForTimeout(500);
                // Screenshot mobile menu
                await expect(page).toHaveScreenshot('mobile-menu-full.png', {
                    fullPage: true,
                    threshold: visualConfig.threshold
                });
            }
        });
    });
    test.describe('Error State Visual Tests', () => {
        test('should match 404 error page', async ({ page }) => {
            // Navigate to non-existent page
            await page.goto('/non-existent-page');
            // Wait for error page to load
            await page.waitForTimeout(2000);
            // Screenshot error page
            await expect(page).toHaveScreenshot('404-error-page.png', {
                fullPage: true,
                threshold: visualConfig.threshold
            });
        });
        test('should match network error states', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            // Block network requests to simulate error
            await page.route('**/api/**', route => route.abort());
            await catalogPage.navigate();
            // Try to search (should fail)
            await catalogPage.searchProducts('test');
            await page.waitForTimeout(3000);
            // Screenshot error state
            const errorMessage = catalogPage.getErrorMessage();
            const isErrorVisible = await errorMessage.isVisible().catch(() => false);
            if (isErrorVisible) {
                await expect(errorMessage).toHaveScreenshot('network-error.png', {
                    threshold: visualConfig.threshold
                });
            }
            // Clear route override
            await page.unroute('**/api/**');
        });
    });
    test.describe('Loading State Visual Tests', () => {
        test('should match loading indicators', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            // Slow down network to capture loading states
            await page.route('**/*', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await route.continue();
            });
            const navigationPromise = catalogPage.navigate();
            // Try to capture loading state
            await page.waitForTimeout(500);
            const loadingIndicator = catalogPage.getLoadingIndicator();
            const isLoadingVisible = await loadingIndicator.isVisible().catch(() => false);
            if (isLoadingVisible) {
                await expect(loadingIndicator).toHaveScreenshot('loading-indicator.png', {
                    threshold: visualConfig.threshold
                });
            }
            await navigationPromise;
            // Clear route override
            await page.unroute('**/*');
        });
        test('should match skeleton loading states', async ({ page }) => {
            const catalogPage = new ProductCatalogPage(page);
            // Block product API to show skeleton
            await page.route('**/api/products**', route => {
                // Delay response to capture skeleton state
                setTimeout(() => route.continue(), 2000);
            });
            const navigationPromise = catalogPage.navigate();
            // Wait for skeleton to appear
            await page.waitForTimeout(1000);
            const skeletonLoader = catalogPage.getSkeletonLoader();
            const isSkeletonVisible = await skeletonLoader.isVisible().catch(() => false);
            if (isSkeletonVisible) {
                await expect(skeletonLoader).toHaveScreenshot('skeleton-loader.png', {
                    threshold: visualConfig.threshold
                });
            }
            await navigationPromise;
            // Clear route override
            await page.unroute('**/api/products**');
        });
    });
});
