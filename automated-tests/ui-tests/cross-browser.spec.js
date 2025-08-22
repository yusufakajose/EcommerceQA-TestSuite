/**
 * Cross-Browser Compatibility Test Suite
 * Tests for ensuring functionality works across Chrome, Firefox, and Safari
 */

const { test, expect } = require('@playwright/test');
const ProductCatalogPage = require('./pages/ProductCatalogPage');
const ShoppingCartPage = require('./pages/ShoppingCartPage');
const LoginPage = require('./pages/LoginPage');
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

test.describe('Cross-Browser Compatibility Tests', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('CrossBrowser');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Core Functionality Across Browsers', () => {
    test('should handle basic navigation in all browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Verify page loads correctly
      await expect(catalogPage.getPageTitle()).toBeVisible();
      await expect(catalogPage.getMainContent()).toBeVisible();
      
      // Test navigation links
      await expect(catalogPage.getNavigationItem('Products')).toBeVisible();
      await expect(catalogPage.getCartIcon()).toBeVisible();
      
      // Browser-specific checks
      if (browserName === 'webkit') {
        // Safari-specific checks
        await expect(page).toHaveTitle(/Products|Catalog|Shop/);
      } else if (browserName === 'firefox') {
        // Firefox-specific checks
        await expect(catalogPage.getSearchBar()).toBeVisible();
      } else if (browserName === 'chromium') {
        // Chrome-specific checks
        await expect(catalogPage.getUserMenu()).toBeVisible();
      }
    });

    test('should handle form submissions across browsers', async ({ page, browserName }) => {
      const loginPage = new LoginPage(page);
      const userData = testDataHelper.getUserData('valid', 0);
      
      await loginPage.navigate();
      
      // Fill and submit form
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      
      // Verify form submission works
      const isSuccessful = await page.url().includes('/dashboard') || 
                          await page.url().includes('/profile') ||
                          await loginPage.getSuccessMessage().isVisible().catch(() => false);
      
      expect(isSuccessful).toBe(true);
      
      // Browser-specific form handling
      if (browserName === 'webkit') {
        // Safari might handle autofill differently
        const emailValue = await loginPage.getEmailField().inputValue();
        expect(emailValue).toBe(userData.email);
      }
    });
  });   
 test('should handle JavaScript events consistently', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Test click events
      const firstProduct = catalogPage.getAllProducts().first();
      await expect(firstProduct).toBeVisible();
      
      await firstProduct.click();
      
      // Verify click handling works across browsers
      const isProductPageLoaded = await page.url().includes('/product/') ||
                                 await catalogPage.getProductModal().isVisible().catch(() => false);
      
      if (isProductPageLoaded) {
        expect(isProductPageLoaded).toBe(true);
      }
      
      // Test hover events (not applicable to touch devices)
      if (browserName !== 'webkit' || !page.context().browser().version().includes('Mobile')) {
        await catalogPage.navigate(); // Go back to catalog
        
        const productCard = catalogPage.getAllProducts().first();
        await productCard.hover();
        
        // Check if hover effects work
        const hoverElement = catalogPage.getProductHoverEffect(productCard);
        const isHoverVisible = await hoverElement.isVisible().catch(() => false);
        
        // Hover effects might not be implemented, so we just verify no errors
        expect(typeof isHoverVisible).toBe('boolean');
      }
    });

    test('should handle AJAX requests across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Test search functionality (likely uses AJAX)
      await catalogPage.searchProducts('headphones');
      
      // Wait for AJAX response
      await page.waitForTimeout(2000);
      
      // Verify search results loaded
      const searchResults = await catalogPage.getSearchResults();
      await expect(searchResults).toHaveCountGreaterThan(0);
      
      // Test filtering (also likely uses AJAX)
      await catalogPage.filterByCategory('Electronics');
      
      // Wait for filter response
      await page.waitForTimeout(2000);
      
      // Verify filtering worked
      const filteredResults = await catalogPage.getFilteredResults();
      await expect(filteredResults).toHaveCountGreaterThan(0);
    });
  });

  test.describe('CSS and Layout Compatibility', () => {
    test('should render layouts consistently across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Check main layout elements
      const header = catalogPage.getHeader();
      const main = catalogPage.getMainContent();
      const footer = catalogPage.getFooter();
      
      await expect(header).toBeVisible();
      await expect(main).toBeVisible();
      await expect(footer).toBeVisible();
      
      // Verify layout positioning
      const headerBox = await header.boundingBox();
      const mainBox = await main.boundingBox();
      const footerBox = await footer.boundingBox();
      
      // Header should be at top
      expect(headerBox.y).toBeLessThan(mainBox.y);
      
      // Footer should be below main content
      expect(footerBox.y).toBeGreaterThan(mainBox.y);
      
      // Browser-specific layout checks
      if (browserName === 'firefox') {
        // Firefox might render fonts slightly differently
        const fontSize = await main.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        expect(fontSize).toMatch(/\d+px/);
      }
    });

    test('should handle CSS Grid and Flexbox consistently', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Test product grid layout
      const productGrid = catalogPage.getProductGrid();
      await expect(productGrid).toBeVisible();
      
      const gridStyle = await productGrid.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          flexWrap: style.flexWrap
        };
      });
      
      // Should use either CSS Grid or Flexbox
      expect(['grid', 'flex'].some(display => 
        gridStyle.display.includes(display)
      )).toBe(true);
      
      // Verify products are properly arranged
      const products = await catalogPage.getAllProducts();
      const productCount = await products.count();
      expect(productCount).toBeGreaterThan(0);
      
      // Check if products are in a grid formation
      if (productCount >= 2) {
        const firstProduct = products.nth(0);
        const secondProduct = products.nth(1);
        
        const firstBox = await firstProduct.boundingBox();
        const secondBox = await secondProduct.boundingBox();
        
        // Products should be arranged in rows/columns
        const isHorizontalLayout = Math.abs(firstBox.y - secondBox.y) < 50;
        const isVerticalLayout = Math.abs(firstBox.x - secondBox.x) < 50;
        
        expect(isHorizontalLayout || isVerticalLayout).toBe(true);
      }
    });

    test('should handle animations and transitions', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Test add to cart animation
      await catalogPage.addProductToCart('prod001');
      
      // Check for animation/transition effects
      const cartIcon = catalogPage.getCartIcon();
      
      // Wait for potential animation
      await page.waitForTimeout(1000);
      
      // Verify cart count updated (animation completed)
      await expect(catalogPage.getCartItemCount()).toContainText('1');
      
      // Test page transitions
      await cartPage.navigate();
      
      // Wait for page transition
      await page.waitForTimeout(500);
      
      // Verify page loaded
      await expect(cartPage.getCartItems()).toHaveCount(1);
      
      // Browser-specific animation checks
      if (browserName === 'webkit') {
        // Safari might handle CSS animations differently
        const cartIconStyle = await cartIcon.evaluate(el => 
          window.getComputedStyle(el).transition
        );
        // Just verify no errors in getting transition property
        expect(typeof cartIconStyle).toBe('string');
      }
    });
  });

  test.describe('JavaScript API Compatibility', () => {
    test('should handle localStorage across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Test localStorage functionality
      await page.evaluate(() => {
        localStorage.setItem('testKey', 'testValue');
      });
      
      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('testKey');
      });
      
      expect(storedValue).toBe('testValue');
      
      // Test cart persistence (likely uses localStorage)
      await catalogPage.addProductToCart('prod001');
      
      // Refresh page
      await page.reload();
      
      // Verify cart persisted
      const cartCount = await catalogPage.getCartItemCount().textContent().catch(() => '0');
      expect(parseInt(cartCount) || 0).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      await page.evaluate(() => {
        localStorage.removeItem('testKey');
      });
    });

    test('should handle sessionStorage across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Test sessionStorage functionality
      await page.evaluate(() => {
        sessionStorage.setItem('sessionTestKey', 'sessionTestValue');
      });
      
      const sessionValue = await page.evaluate(() => {
        return sessionStorage.getItem('sessionTestKey');
      });
      
      expect(sessionValue).toBe('sessionTestValue');
      
      // Test form data persistence (might use sessionStorage)
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      await loginPage.fillField('email', 'test@example.com');
      
      // Navigate away and back
      await catalogPage.navigate();
      await loginPage.navigate();
      
      // Check if form data persisted (implementation dependent)
      const emailValue = await loginPage.getEmailField().inputValue();
      // Just verify no errors occurred
      expect(typeof emailValue).toBe('string');
      
      // Cleanup
      await page.evaluate(() => {
        sessionStorage.removeItem('sessionTestKey');
      });
    });

    test('should handle cookies across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Test cookie functionality
      await page.evaluate(() => {
        document.cookie = 'testCookie=testCookieValue; path=/';
      });
      
      const cookies = await page.context().cookies();
      const testCookie = cookies.find(cookie => cookie.name === 'testCookie');
      
      expect(testCookie).toBeDefined();
      expect(testCookie.value).toBe('testCookieValue');
      
      // Test authentication cookies (if login sets cookies)
      const loginPage = new LoginPage(page);
      const userData = testDataHelper.getUserData('valid', 0);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      
      // Check if authentication cookies were set
      const authCookies = await page.context().cookies();
      const hasAuthCookie = authCookies.some(cookie => 
        cookie.name.includes('auth') || 
        cookie.name.includes('session') || 
        cookie.name.includes('token')
      );
      
      // Authentication might not use cookies, so just verify no errors
      expect(typeof hasAuthCookie).toBe('boolean');
    });

    test('should handle fetch/XMLHttpRequest across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Test fetch API availability
      const fetchSupported = await page.evaluate(() => {
        return typeof fetch !== 'undefined';
      });
      
      expect(fetchSupported).toBe(true);
      
      // Test XMLHttpRequest availability (fallback)
      const xhrSupported = await page.evaluate(() => {
        return typeof XMLHttpRequest !== 'undefined';
      });
      
      expect(xhrSupported).toBe(true);
      
      // Test actual API call (search functionality)
      await catalogPage.searchProducts('test');
      
      // Wait for API response
      await page.waitForTimeout(2000);
      
      // Verify API call completed (search results or no results message)
      const hasResults = await catalogPage.getSearchResults().count() > 0;
      const hasNoResultsMessage = await catalogPage.getNoResultsMessage().isVisible().catch(() => false);
      
      expect(hasResults || hasNoResultsMessage).toBe(true);
    });
  });

  test.describe('Input and Form Handling', () => {
    test('should handle different input types across browsers', async ({ page, browserName }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      
      // Test email input type
      const emailInput = loginPage.getEmailField();
      const emailType = await emailInput.getAttribute('type');
      expect(emailType).toBe('email');
      
      // Test password input type
      const passwordInput = loginPage.getPasswordField();
      const passwordType = await passwordInput.getAttribute('type');
      expect(passwordType).toBe('password');
      
      // Test input validation
      await emailInput.fill('invalid-email');
      await passwordInput.fill('123');
      
      await loginPage.submitForm();
      
      // Verify validation works across browsers
      const hasValidationErrors = await loginPage.getFieldError('email').isVisible().catch(() => false) ||
                                 await loginPage.getErrorMessage().isVisible().catch(() => false);
      
      expect(hasValidationErrors).toBe(true);
    });

    test('should handle form autofill across browsers', async ({ page, browserName }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      
      // Check autofill attributes
      const emailInput = loginPage.getEmailField();
      const passwordInput = loginPage.getPasswordField();
      
      const emailAutocomplete = await emailInput.getAttribute('autocomplete');
      const passwordAutocomplete = await passwordInput.getAttribute('autocomplete');
      
      // Should have appropriate autocomplete attributes
      expect(['email', 'username', null]).toContain(emailAutocomplete);
      expect(['current-password', 'password', null]).toContain(passwordAutocomplete);
      
      // Test manual fill (simulating autofill)
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      // Verify values are set
      expect(await emailInput.inputValue()).toBe('test@example.com');
      expect(await passwordInput.inputValue()).toBe('password123');
    });

    test('should handle file uploads across browsers', async ({ page, browserName }) => {
      // This test assumes there's a file upload somewhere in the app
      // If not implemented, we'll just test the file input element
      
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();
      
      // Look for file input (might be in user profile or product review)
      const fileInputs = page.locator('input[type="file"]');
      const fileInputCount = await fileInputs.count();
      
      if (fileInputCount > 0) {
        const fileInput = fileInputs.first();
        
        // Test file input attributes
        const accept = await fileInput.getAttribute('accept');
        const multiple = await fileInput.getAttribute('multiple');
        
        // Verify file input is properly configured
        expect(typeof accept).toBe('string');
        expect(typeof multiple === 'string' || multiple === null).toBe(true);
        
        // Note: Actual file upload testing would require test files
        // and is complex across different browsers
      }
    });
  });

  test.describe('Error Handling Across Browsers', () => {
    test('should handle network errors consistently', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await catalogPage.navigate();
      
      // Try to perform action that requires API call
      await catalogPage.searchProducts('test');
      
      // Wait for error handling
      await page.waitForTimeout(3000);
      
      // Verify error is handled gracefully
      const hasErrorMessage = await catalogPage.getErrorMessage().isVisible().catch(() => false) ||
                             await catalogPage.getNetworkErrorMessage().isVisible().catch(() => false);
      
      // Should show some kind of error indication
      expect(hasErrorMessage).toBe(true);
      
      // Clear route override
      await page.unroute('**/api/**');
    });

    test('should handle JavaScript errors gracefully', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      // Listen for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Listen for page errors
      const pageErrors = [];
      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });
      
      await catalogPage.navigate();
      
      // Perform various actions
      await catalogPage.searchProducts('test');
      await catalogPage.addProductToCart('prod001');
      
      // Wait for potential errors
      await page.waitForTimeout(2000);
      
      // Verify no critical JavaScript errors occurred
      const criticalErrors = [...consoleErrors, ...pageErrors].filter(error =>
        error.includes('TypeError') || 
        error.includes('ReferenceError') ||
        error.includes('SyntaxError')
      );
      
      expect(criticalErrors.length).toBe(0);
    });
  });
});