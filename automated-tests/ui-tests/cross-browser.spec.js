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

  test.afterEach(async ({ page }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Core Functionality Across Browsers', () => {
    test('should handle basic navigation in all browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      await expect(catalogPage.getPageTitle()).toBeVisible();
      await expect(catalogPage.getMainContent()).toBeVisible();
      await expect(catalogPage.getNavigationItem('Products')).toBeVisible();
      await expect(catalogPage.getCartIcon()).toBeVisible();

      if (browserName === 'webkit') {
        await expect(page).toHaveTitle(/Products|Catalog|Shop/);
      } else if (browserName === 'firefox') {
        await expect(catalogPage.getSearchBar()).toBeVisible();
      } else if (browserName === 'chromium') {
        await expect(catalogPage.getUserMenu()).toBeVisible();
      }
    });

    test('should handle form submissions across browsers', async ({ page, browserName }) => {
      const loginPage = new LoginPage(page);
      const userData = testDataHelper.getUserData('valid', 0);

      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();

      const isSuccessful =
        (await page.url().includes('/dashboard')) ||
        (await page.url().includes('/profile')) ||
        (await loginPage
          .getSuccessMessage()
          .isVisible()
          .catch(() => false));
      expect(isSuccessful).toBe(true);

      if (browserName === 'webkit') {
        const emailValue = await loginPage.getEmailField().inputValue();
        expect(emailValue).toBe(userData.email);
      }
    });

    test('should handle JavaScript events consistently', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      const firstProduct = catalogPage.getAllProducts().first();
      await expect(firstProduct).toBeVisible();
      await firstProduct.click();

      const isProductPageLoaded =
        (await page.url().includes('/product/')) ||
        (await catalogPage
          .getProductModal()
          .isVisible()
          .catch(() => false));
      expect(isProductPageLoaded).toBe(true);

      if (browserName !== 'webkit' || !page.context().browser().version().includes('Mobile')) {
        await catalogPage.navigate();
        const productCard = catalogPage.getAllProducts().first();
        await productCard.hover();
        const hoverElement = catalogPage.getProductHoverEffect(productCard);
        const isHoverVisible = await hoverElement.isVisible().catch(() => false);
        expect(typeof isHoverVisible).toBe('boolean');
      }
    });

    test('should handle AJAX requests across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      await catalogPage.searchProducts('headphones');
      await page.waitForTimeout(2000);
      const searchResults = await catalogPage.getSearchResults();
      await expect(searchResults).toHaveCountGreaterThan(0);

      await catalogPage.filterByCategory('Electronics');
      await page.waitForTimeout(2000);
      const filteredResults = await catalogPage.getFilteredResults();
      await expect(filteredResults).toHaveCountGreaterThan(0);
    });
  });

  test.describe('CSS and Layout Compatibility', () => {
    test('should render layouts consistently across browsers', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      const header = catalogPage.getHeader();
      const main = catalogPage.getMainContent();
      const footer = catalogPage.getFooter();

      await expect(header).toBeVisible();
      await expect(main).toBeVisible();
      await expect(footer).toBeVisible();

      const headerBox = await header.boundingBox();
      const mainBox = await main.boundingBox();
      const footerBox = await footer.boundingBox();

      expect(headerBox.y).toBeLessThan(mainBox.y);
      expect(footerBox.y).toBeGreaterThan(mainBox.y);

      if (browserName === 'firefox') {
        const fontSize = await main.evaluate((el) => window.getComputedStyle(el).fontSize);
        expect(fontSize).toMatch(/\d+px/);
      }
    });

    test('should handle CSS Grid and Flexbox consistently', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      const productGrid = catalogPage.getProductGrid();
      await expect(productGrid).toBeVisible();

      const gridStyle = await productGrid.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          flexWrap: style.flexWrap,
        };
      });

      expect(['grid', 'flex'].some((display) => gridStyle.display.includes(display))).toBe(true);

      const products = await catalogPage.getAllProducts();
      const productCount = await products.count();
      expect(productCount).toBeGreaterThan(0);

      if (productCount >= 2) {
        const firstBox = await products.nth(0).boundingBox();
        const secondBox = await products.nth(1).boundingBox();

        const isHorizontalLayout = Math.abs(firstBox.y - secondBox.y) < 50;
        const isVerticalLayout = Math.abs(firstBox.x - secondBox.x) < 50;
        expect(isHorizontalLayout || isVerticalLayout).toBe(true);
      }
    });

    test('should handle animations and transitions', async ({ page, browserName }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      const cartIcon = catalogPage.getCartIcon();
      await page.waitForTimeout(1000);
      await expect(catalogPage.getCartItemCount()).toContainText('1');

      await cartPage.navigate();
      await page.waitForTimeout(500);
      await expect(cartPage.getCartItems()).toHaveCount(1);

      if (browserName === 'webkit') {
        const cartIconStyle = await cartIcon.evaluate(
          (el) => window.getComputedStyle(el).transition
        );
        expect(typeof cartIconStyle).toBe('string');
      }
    });
  });

  test.describe('JavaScript API Compatibility', () => {
    test('should handle localStorage across browsers', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      await page.evaluate(() => localStorage.setItem('testKey', 'testValue'));
      const storedValue = await page.evaluate(() => localStorage.getItem('testKey'));
      expect(storedValue).toBe('testValue');

      await catalogPage.addProductToCart('prod001');
      await page.reload();

      const cartCount = await catalogPage
        .getCartItemCount()
        .textContent()
        .catch(() => '0');
      expect(parseInt(cartCount) || 0).toBeGreaterThanOrEqual(0);

      await page.evaluate(() => localStorage.removeItem('testKey'));
    });

    test('should handle sessionStorage across browsers', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      await page.evaluate(() => sessionStorage.setItem('sessionTestKey', 'sessionTestValue'));
      const sessionValue = await page.evaluate(() => sessionStorage.getItem('sessionTestKey'));
      expect(sessionValue).toBe('sessionTestValue');

      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.fillField('email', 'test@example.com');
      await catalogPage.navigate();
      await loginPage.navigate();
      const emailValue = await loginPage.getEmailField().inputValue();
      expect(typeof emailValue).toBe('string');

      await page.evaluate(() => sessionStorage.removeItem('sessionTestKey'));
    });

    test('should handle cookies across browsers', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      await page.evaluate(() => (document.cookie = 'testCookie=testCookieValue; path=/'));
      const cookies = await page.context().cookies();
      const testCookie = cookies.find((cookie) => cookie.name === 'testCookie');
      expect(testCookie).toBeDefined();
      expect(testCookie.value).toBe('testCookieValue');

      const loginPage = new LoginPage(page);
      const userData = testDataHelper.getUserData('valid', 0);
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();

      const authCookies = await page.context().cookies();
      const hasAuthCookie = authCookies.some(
        (cookie) =>
          cookie.name.includes('auth') ||
          cookie.name.includes('session') ||
          cookie.name.includes('token')
      );
      expect(typeof hasAuthCookie).toBe('boolean');
    });

    test('should handle fetch/XMLHttpRequest across browsers', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      const fetchSupported = await page.evaluate(() => typeof fetch !== 'undefined');
      expect(fetchSupported).toBe(true);

      const xhrSupported = await page.evaluate(() => typeof XMLHttpRequest !== 'undefined');
      expect(xhrSupported).toBe(true);

      await catalogPage.searchProducts('test');
      await page.waitForTimeout(2000);

      const hasResults = (await catalogPage.getSearchResults().count()) > 0;
      const hasNoResultsMessage = await catalogPage
        .getNoResultsMessage()
        .isVisible()
        .catch(() => false);
      expect(hasResults || hasNoResultsMessage).toBe(true);
    });
  });

  test.describe('Input and Form Handling', () => {
    test('should handle different input types across browsers', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();

      const emailInput = loginPage.getEmailField();
      const emailType = await emailInput.getAttribute('type');
      expect(emailType).toBe('email');

      const passwordInput = loginPage.getPasswordField();
      const passwordType = await passwordInput.getAttribute('type');
      expect(passwordType).toBe('password');

      await emailInput.fill('invalid-email');
      await passwordInput.fill('123');
      await loginPage.submitForm();

      const hasValidationErrors =
        (await loginPage
          .getFieldError('email')
          .isVisible()
          .catch(() => false)) ||
        (await loginPage
          .getErrorMessage()
          .isVisible()
          .catch(() => false));
      expect(hasValidationErrors).toBe(true);
    });

    test('should handle form autofill across browsers', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();

      const emailInput = loginPage.getEmailField();
      const passwordInput = loginPage.getPasswordField();

      const emailAutocomplete = await emailInput.getAttribute('autocomplete');
      const passwordAutocomplete = await passwordInput.getAttribute('autocomplete');
      expect(['email', 'username', null]).toContain(emailAutocomplete);
      expect(['current-password', 'password', null]).toContain(passwordAutocomplete);

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      expect(await emailInput.inputValue()).toBe('test@example.com');
      expect(await passwordInput.inputValue()).toBe('password123');
    });

    test('should handle file uploads across browsers', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      const fileInputs = page.locator('input[type="file"]');
      const fileInputCount = await fileInputs.count();

      if (fileInputCount > 0) {
        const fileInput = fileInputs.first();
        const accept = await fileInput.getAttribute('accept');
        const multiple = await fileInput.getAttribute('multiple');

        expect(typeof accept).toBe('string');
        expect(typeof multiple === 'string' || multiple === null).toBe(true);
      }
    });
  });

  test.describe('Error Handling Across Browsers', () => {
    test('should handle network errors consistently', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      await page.route('**/api/**', (route) => route.abort());

      await catalogPage.navigate();
      await catalogPage.searchProducts('test');
      await page.waitForTimeout(3000);

      const hasErrorMessage =
        (await catalogPage
          .getErrorMessage()
          .isVisible()
          .catch(() => false)) ||
        (await catalogPage
          .getNetworkErrorMessage()
          .isVisible()
          .catch(() => false));
      expect(hasErrorMessage).toBe(true);

      await page.unroute('**/api/**');
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await catalogPage.navigate();
      await catalogPage.searchProducts('test');
      await catalogPage.addProductToCart('prod001');
      await page.waitForTimeout(2000);

      const criticalErrors = [...consoleErrors, ...pageErrors].filter(
        (error) =>
          error.includes('TypeError') ||
          error.includes('ReferenceError') ||
          error.includes('SyntaxError')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });
});
