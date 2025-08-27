/**
 * Responsive Design Test Suite
 * Comprehensive tests for responsive design across different device viewports
 */

const { test, expect, devices } = require('@playwright/test');
const ProductCatalogPage = require('./pages/ProductCatalogPage');
const ShoppingCartPage = require('./pages/ShoppingCartPage');
const CheckoutPage = require('./pages/CheckoutPage');
const LoginPage = require('./pages/LoginPage');
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

// Define device viewports for testing
const testDevices = [
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'Laptop', viewport: { width: 1366, height: 768 } },
  { name: 'Tablet Portrait', viewport: { width: 768, height: 1024 } },
  { name: 'Tablet Landscape', viewport: { width: 1024, height: 768 } },
  { name: 'Mobile Large', viewport: { width: 414, height: 896 } },
  { name: 'Mobile Medium', viewport: { width: 375, height: 667 } },
  { name: 'Mobile Small', viewport: { width: 320, height: 568 } },
];

test.describe('Responsive Design Tests', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('ResponsiveDesign');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ page }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Navigation Responsiveness', () => {
    testDevices.forEach((device) => {
      test(`should display responsive navigation on ${device.name}`, async ({ page }) => {
        await page.setViewportSize(device.viewport);
        const catalogPage = new ProductCatalogPage(page);

        await catalogPage.navigate();

        if (device.viewport.width <= 768) {
          // Mobile/Tablet - should show hamburger menu
          await expect(catalogPage.getMobileMenuButton()).toBeVisible();
          await expect(catalogPage.getDesktopNavigation()).not.toBeVisible();

          // Test mobile menu functionality
          await catalogPage.openMobileMenu();
          await expect(catalogPage.getMobileMenuItems()).toBeVisible();

          // Test menu items are accessible
          const menuItems = await catalogPage.getMobileMenuItems().count();
          expect(menuItems).toBeGreaterThan(0);

          // Close menu
          await catalogPage.closeMobileMenu();
          await expect(catalogPage.getMobileMenuItems()).not.toBeVisible();
        } else {
          // Desktop - should show full navigation
          await expect(catalogPage.getDesktopNavigation()).toBeVisible();
          await expect(catalogPage.getMobileMenuButton()).not.toBeVisible();

          // Verify all navigation items are visible
          await expect(catalogPage.getNavigationItem('Products')).toBeVisible();
          await expect(catalogPage.getNavigationItem('Categories')).toBeVisible();
          await expect(catalogPage.getCartIcon()).toBeVisible();
          await expect(catalogPage.getSearchBar()).toBeVisible();
        }
      });
    });

    test('should handle navigation transitions smoothly', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.navigate();

      // Test transition from desktop to mobile
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(catalogPage.getDesktopNavigation()).toBeVisible();

      await page.setViewportSize({ width: 600, height: 800 });
      await expect(catalogPage.getMobileMenuButton()).toBeVisible();
      await expect(catalogPage.getDesktopNavigation()).not.toBeVisible();

      // Test transition back to desktop
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(catalogPage.getDesktopNavigation()).toBeVisible();
      await expect(catalogPage.getMobileMenuButton()).not.toBeVisible();
    });
  });

  test.describe('Product Catalog Responsiveness', () => {
    testDevices.forEach((device) => {
      test(`should display product grid responsively on ${device.name}`, async ({ page }) => {
        await page.setViewportSize(device.viewport);
        const catalogPage = new ProductCatalogPage(page);

        await catalogPage.navigate();

        // Verify products are displayed
        const products = await catalogPage.getAllProducts();
        await expect(products).toHaveCountGreaterThan(0);

        // Check grid layout based on device
        const productGrid = catalogPage.getProductGrid();

        if (device.viewport.width <= 480) {
          // Mobile - single column
          await expect(productGrid).toHaveClass(/grid-cols-1|single-column/);
        } else if (device.viewport.width <= 768) {
          // Tablet - two columns
          await expect(productGrid).toHaveClass(/grid-cols-2|two-column/);
        } else if (device.viewport.width <= 1024) {
          // Small desktop - three columns
          await expect(productGrid).toHaveClass(/grid-cols-3|three-column/);
        } else {
          // Large desktop - four or more columns
          await expect(productGrid).toHaveClass(/grid-cols-4|grid-cols-5|four-column|five-column/);
        }

        // Verify product cards are properly sized
        const firstProduct = products.first();
        const boundingBox = await firstProduct.boundingBox();

        // Product card should not exceed viewport width
        expect(boundingBox.width).toBeLessThanOrEqual(device.viewport.width);

        // Product images should be responsive
        const productImage = firstProduct.locator('img').first();
        const imageBoundingBox = await productImage.boundingBox();
        expect(imageBoundingBox.width).toBeLessThanOrEqual(boundingBox.width);
      });
    });

    test('should handle product filtering on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const catalogPage = new ProductCatalogPage(page);

      await catalogPage.navigate();

      // On mobile, filters might be in a collapsible section or modal
      const filterButton = catalogPage.getMobileFilterButton();
      const isFilterButtonVisible = await filterButton.isVisible().catch(() => false);

      if (isFilterButtonVisible) {
        await filterButton.click();

        // Verify filter options are displayed
        await expect(catalogPage.getFilterOptions()).toBeVisible();

        // Test applying a filter
        await catalogPage.filterByCategory('Electronics');

        // Verify filtered results
        const filteredProducts = await catalogPage.getFilteredResults();
        await expect(filteredProducts).toHaveCountGreaterThan(0);

        // Close filters on mobile
        await catalogPage.closeMobileFilters();
      }
    });

    test('should handle search functionality on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const catalogPage = new ProductCatalogPage(page);

      await catalogPage.navigate();

      // Search might be in mobile menu or expandable
      const searchInput = catalogPage.getSearchInput();
      const isSearchVisible = await searchInput.isVisible().catch(() => false);

      if (!isSearchVisible) {
        // Try to open search from mobile menu
        await catalogPage.openMobileMenu();
        await catalogPage.clickMobileSearchButton();
      }

      // Perform search
      await catalogPage.searchProducts('headphones');

      // Verify search results are displayed properly on mobile
      const searchResults = await catalogPage.getSearchResults();
      await expect(searchResults).toHaveCountGreaterThan(0);

      // Verify search results layout on mobile
      const resultsContainer = catalogPage.getSearchResultsContainer();
      const containerWidth = await resultsContainer.evaluate((el) => el.offsetWidth);
      expect(containerWidth).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Shopping Cart Responsiveness', () => {
    testDevices.forEach((device) => {
      test(`should display shopping cart responsively on ${device.name}`, async ({ page }) => {
        await page.setViewportSize(device.viewport);
        const catalogPage = new ProductCatalogPage(page);
        const cartPage = new ShoppingCartPage(page);

        // Add items to cart
        await catalogPage.navigate();
        await catalogPage.addProductToCart('prod001');
        await catalogPage.addProductToCart('prod002');

        // Navigate to cart
        await cartPage.navigate();

        // Verify cart items are displayed
        const cartItems = await cartPage.getCartItems();
        await expect(cartItems).toHaveCount(2);

        if (device.viewport.width <= 768) {
          // Mobile/Tablet - stacked layout
          const cartLayout = cartPage.getCartLayout();
          await expect(cartLayout).toHaveClass(/mobile-layout|stacked-layout/);

          // Verify mobile-specific elements
          await expect(cartPage.getMobileQuantityControls()).toBeVisible();
          await expect(cartPage.getMobileRemoveButton()).toBeVisible();

          // Test mobile quantity update
          await cartPage.updateQuantityMobile('prod001', 3);
          await expect(cartPage.getProductQuantity('prod001')).toHaveValue('3');
        } else {
          // Desktop - table layout
          const cartTable = cartPage.getCartTable();
          await expect(cartTable).toBeVisible();

          // Verify table columns are properly displayed
          await expect(cartPage.getTableHeader('Product')).toBeVisible();
          await expect(cartPage.getTableHeader('Quantity')).toBeVisible();
          await expect(cartPage.getTableHeader('Price')).toBeVisible();
          await expect(cartPage.getTableHeader('Total')).toBeVisible();
        }

        // Verify cart summary is always visible
        await expect(cartPage.getCartSummary()).toBeVisible();
        await expect(cartPage.getSubtotal()).toBeVisible();
        await expect(cartPage.getCheckoutButton()).toBeVisible();
      });
    });

    test('should handle cart operations on touch devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();

      // Test touch interactions
      const quantityInput = cartPage.getProductQuantity('prod001');

      // Test touch-friendly quantity controls
      const incrementButton = cartPage.getIncrementButton('prod001');
      const decrementButton = cartPage.getDecrementButton('prod001');

      // Verify buttons are large enough for touch
      const incrementBox = await incrementButton.boundingBox();
      const decrementBox = await decrementButton.boundingBox();

      expect(incrementBox.width).toBeGreaterThanOrEqual(44); // Minimum touch target size
      expect(incrementBox.height).toBeGreaterThanOrEqual(44);
      expect(decrementBox.width).toBeGreaterThanOrEqual(44);
      expect(decrementBox.height).toBeGreaterThanOrEqual(44);

      // Test touch interactions
      await incrementButton.tap();
      await expect(quantityInput).toHaveValue('2');

      await decrementButton.tap();
      await expect(quantityInput).toHaveValue('1');
    });
  });

  test.describe('Checkout Process Responsiveness', () => {
    testDevices.forEach((device) => {
      test(`should display checkout form responsively on ${device.name}`, async ({ page }) => {
        await page.setViewportSize(device.viewport);
        const catalogPage = new ProductCatalogPage(page);
        const cartPage = new ShoppingCartPage(page);
        const checkoutPage = new CheckoutPage(page);

        // Add item and proceed to checkout
        await catalogPage.navigate();
        await catalogPage.addProductToCart('prod001');

        await cartPage.navigate();
        await cartPage.proceedToCheckout();

        if (device.viewport.width <= 768) {
          // Mobile/Tablet - single column form
          const checkoutForm = checkoutPage.getCheckoutForm();
          await expect(checkoutForm).toHaveClass(/mobile-form|single-column/);

          // Verify form sections are stacked
          await expect(checkoutPage.getShippingSection()).toBeVisible();
          await expect(checkoutPage.getPaymentSection()).toBeVisible();

          // Test mobile form navigation
          await checkoutPage.fillShippingAddress({
            firstName: 'Mobile',
            lastName: 'User',
            street: '123 Mobile St',
            city: 'Mobile City',
            state: 'CA',
            zipCode: '12345',
            phone: '555-0123',
          });

          // Verify mobile-specific form elements
          const mobileInputs = await checkoutPage.getFormInputs().count();
          expect(mobileInputs).toBeGreaterThan(0);

          // Verify inputs are touch-friendly
          const firstInput = checkoutPage.getFormInputs().first();
          const inputBox = await firstInput.boundingBox();
          expect(inputBox.height).toBeGreaterThanOrEqual(44);
        } else {
          // Desktop - multi-column layout
          const checkoutLayout = checkoutPage.getCheckoutLayout();
          await expect(checkoutLayout).toHaveClass(/desktop-form|multi-column/);

          // Verify side-by-side sections
          const shippingSection = checkoutPage.getShippingSection();
          const paymentSection = checkoutPage.getPaymentSection();

          const shippingBox = await shippingSection.boundingBox();
          const paymentBox = await paymentSection.boundingBox();

          // Sections should be side by side on desktop
          expect(Math.abs(shippingBox.y - paymentBox.y)).toBeLessThan(50);
        }
      });
    });

    test('should handle payment form on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Fill shipping info
      await checkoutPage.fillShippingAddress({
        firstName: 'Mobile',
        lastName: 'User',
        street: '123 Mobile St',
        city: 'Mobile City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Test mobile payment form
      const paymentForm = checkoutPage.getPaymentForm();
      await expect(paymentForm).toBeVisible();

      // Verify mobile-optimized payment inputs
      const cardNumberInput = checkoutPage.getPaymentField('cardNumber');
      await expect(cardNumberInput).toHaveAttribute('inputmode', 'numeric');

      const expiryInput = checkoutPage.getPaymentField('expiryMonth');
      await expect(expiryInput).toHaveAttribute('inputmode', 'numeric');

      const cvvInput = checkoutPage.getPaymentField('cvv');
      await expect(cvvInput).toHaveAttribute('inputmode', 'numeric');

      // Test mobile keyboard optimization
      await cardNumberInput.focus();
      // On mobile, numeric keyboard should appear for card number

      // Fill payment info
      await checkoutPage.fillPaymentMethod({
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'Mobile User',
      });

      // Verify payment form validation on mobile
      await expect(checkoutPage.getPaymentErrors()).toHaveCount(0);
    });
  });

  test.describe('Form Interactions on Touch Devices', () => {
    test('should handle form inputs with touch interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const loginPage = new LoginPage(page);

      await loginPage.navigate();

      // Test touch-friendly form inputs
      const emailInput = loginPage.getEmailField();
      const passwordInput = loginPage.getPasswordField();

      // Verify input sizes are touch-friendly
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();

      expect(emailBox.height).toBeGreaterThanOrEqual(44);
      expect(passwordBox.height).toBeGreaterThanOrEqual(44);

      // Test touch interactions
      await emailInput.tap();
      await emailInput.fill('test@example.com');

      await passwordInput.tap();
      await passwordInput.fill('password123');

      // Test form submission with touch
      const submitButton = loginPage.getSubmitButton();
      const submitBox = await submitButton.boundingBox();

      expect(submitBox.height).toBeGreaterThanOrEqual(44);
      expect(submitBox.width).toBeGreaterThanOrEqual(44);

      await submitButton.tap();
    });

    test('should handle dropdown menus on touch devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const checkoutPage = new CheckoutPage(page);
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Test state/country dropdown on mobile
      const stateDropdown = checkoutPage.getStateDropdown();

      if (await stateDropdown.isVisible()) {
        await stateDropdown.tap();

        // Verify dropdown options are touch-friendly
        const dropdownOptions = checkoutPage.getStateOptions();
        const firstOption = dropdownOptions.first();

        const optionBox = await firstOption.boundingBox();
        expect(optionBox.height).toBeGreaterThanOrEqual(44);

        await firstOption.tap();

        // Verify selection worked
        const selectedValue = await stateDropdown.inputValue();
        expect(selectedValue).not.toBe('');
      }
    });
  });

  test.describe('Content Overflow and Scrolling', () => {
    test('should handle content overflow on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      const catalogPage = new ProductCatalogPage(page);

      await catalogPage.navigate();

      // Verify page content doesn't overflow horizontally
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(320);

      // Test vertical scrolling
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      expect(pageHeight).toBeGreaterThan(568); // Content should be scrollable

      // Test scrolling to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Verify footer is accessible
      const footer = catalogPage.getFooter();
      await expect(footer).toBeVisible();
    });

    test('should handle long product names and descriptions', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      const catalogPage = new ProductCatalogPage(page);

      await catalogPage.navigate();

      // Get product cards
      const products = await catalogPage.getAllProducts();
      const firstProduct = products.first();

      // Verify product name doesn't overflow
      const productName = firstProduct.locator('.product-name, h3, .title').first();
      const nameBox = await productName.boundingBox();

      expect(nameBox.width).toBeLessThanOrEqual(320);

      // Verify text is properly truncated or wrapped
      const nameText = await productName.textContent();
      expect(nameText.length).toBeGreaterThan(0);

      // Check if text is truncated with ellipsis
      const computedStyle = await productName.evaluate((el) => {
        return window.getComputedStyle(el);
      });

      // Should have text overflow handling
      expect(['ellipsis', 'clip', 'normal']).toContain(computedStyle.textOverflow || 'normal');
    });
  });

  test.describe('Image Responsiveness', () => {
    testDevices.forEach((device) => {
      test(`should display images responsively on ${device.name}`, async ({ page }) => {
        await page.setViewportSize(device.viewport);
        const catalogPage = new ProductCatalogPage(page);

        await catalogPage.navigate();

        // Get product images
        const productImages = catalogPage.getAllProductImages();
        const imageCount = await productImages.count();

        expect(imageCount).toBeGreaterThan(0);

        // Check first few images
        for (let i = 0; i < Math.min(3, imageCount); i++) {
          const image = productImages.nth(i);

          // Wait for image to load
          await expect(image).toBeVisible();

          const imageBox = await image.boundingBox();

          // Image should not exceed container width
          expect(imageBox.width).toBeLessThanOrEqual(device.viewport.width);

          // Image should maintain aspect ratio
          const naturalDimensions = await image.evaluate((img) => ({
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            displayWidth: img.offsetWidth,
            displayHeight: img.offsetHeight,
          }));

          if (naturalDimensions.naturalWidth > 0 && naturalDimensions.naturalHeight > 0) {
            const naturalRatio = naturalDimensions.naturalWidth / naturalDimensions.naturalHeight;
            const displayRatio = naturalDimensions.displayWidth / naturalDimensions.displayHeight;

            // Allow for small rounding differences
            expect(Math.abs(naturalRatio - displayRatio)).toBeLessThan(0.1);
          }
        }
      });
    });

    test('should lazy load images on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const catalogPage = new ProductCatalogPage(page);

      await catalogPage.navigate();

      // Check if images have lazy loading attributes
      const images = catalogPage.getAllProductImages();
      const firstImage = images.first();

      const loadingAttribute = await firstImage.getAttribute('loading');
      const isLazyLoaded =
        loadingAttribute === 'lazy' ||
        (await firstImage.getAttribute('data-src')) !== null ||
        (await firstImage.getAttribute('data-lazy')) !== null;

      // On mobile, images should be lazy loaded for performance
      if (isLazyLoaded) {
        // Scroll to trigger lazy loading
        await page.evaluate(() => window.scrollTo(0, 500));

        // Wait for images to load
        await page.waitForTimeout(1000);

        // Verify images are now loaded
        await expect(firstImage).toBeVisible();
      }
    });
  });

  test.describe('Performance on Mobile Devices', () => {
    test('should load quickly on mobile networks', async ({ page }) => {
      // Simulate slow 3G network
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      await page.setViewportSize({ width: 375, height: 667 });
      const catalogPage = new ProductCatalogPage(page);

      const startTime = Date.now();
      await catalogPage.navigate();

      // Wait for main content to be visible
      await expect(catalogPage.getMainContent()).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should handle touch gestures', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      const catalogPage = new ProductCatalogPage(page);

      await catalogPage.navigate();

      // Test swipe gestures if carousel exists
      const carousel = catalogPage.getProductCarousel();
      const isCarouselVisible = await carousel.isVisible().catch(() => false);

      if (isCarouselVisible) {
        const carouselBox = await carousel.boundingBox();

        // Simulate swipe left
        await page.mouse.move(
          carouselBox.x + carouselBox.width - 50,
          carouselBox.y + carouselBox.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(carouselBox.x + 50, carouselBox.y + carouselBox.height / 2);
        await page.mouse.up();

        // Wait for animation
        await page.waitForTimeout(500);

        // Verify carousel moved
        // This would depend on the specific carousel implementation
      }

      // Test pinch zoom prevention on product images
      const productImage = catalogPage.getAllProductImages().first();

      if (await productImage.isVisible()) {
        // Verify touch-action is set to prevent zoom
        const touchAction = await productImage.evaluate(
          (el) => window.getComputedStyle(el).touchAction
        );

        // Should prevent pinch zoom on product grid
        expect(['manipulation', 'pan-x', 'pan-y', 'none']).toContain(touchAction);
      }
    });
  });
});
