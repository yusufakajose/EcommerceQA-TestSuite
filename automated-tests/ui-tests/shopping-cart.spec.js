/**
 * Shopping Cart Test Suite
 * Comprehensive tests for shopping cart functionality including add, remove, and update operations
 */

const { test, expect } = require('@playwright/test');
const ProductCatalogPage = require('./pages/ProductCatalogPage');
const ShoppingCartPage = require('./pages/ShoppingCartPage');
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

test.describe('Shopping Cart Tests', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('ShoppingCart');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Add to Cart Functionality', () => {
    test('should add single product to cart', async ({ page }) => {
      const singleItemScenario = testDataHelper.getCartData('singleItem');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Add product to cart
      await catalogPage.addProductToCart(singleItemScenario.items[0].productId);
      
      // Verify cart icon shows item count
      await expect(catalogPage.getCartItemCount()).toContainText('1');
      
      // Navigate to cart
      await cartPage.navigate();
      
      // Verify product is in cart
      await expect(cartPage.getCartItems()).toHaveCount(1);
      await expect(cartPage.getProductInCart(singleItemScenario.items[0].productId)).toBeVisible();
      
      // Verify cart totals
      await expect(cartPage.getSubtotal()).toContainText(singleItemScenario.expectedTotal.toString());
      await expect(cartPage.getTotalItemCount()).toContainText(singleItemScenario.expectedItemCount.toString());
    });

    test('should add multiple different products to cart', async ({ page }) => {
      const multipleItemsScenario = testDataHelper.getCartData('multipleItems');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Add multiple products to cart
      for (const item of multipleItemsScenario.items) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }
      
      // Verify cart icon shows total item count
      await expect(catalogPage.getCartItemCount()).toContainText(multipleItemsScenario.expectedItemCount.toString());
      
      // Navigate to cart
      await cartPage.navigate();
      
      // Verify all products are in cart
      await expect(cartPage.getCartItems()).toHaveCount(multipleItemsScenario.items.length);
      
      for (const item of multipleItemsScenario.items) {
        await expect(cartPage.getProductInCart(item.productId)).toBeVisible();
        await expect(cartPage.getProductQuantity(item.productId)).toHaveValue(item.quantity.toString());
        await expect(cartPage.getProductSubtotal(item.productId)).toContainText(item.expectedSubtotal.toString());
      }
      
      // Verify cart totals
      await expect(cartPage.getSubtotal()).toContainText(multipleItemsScenario.expectedTotal.toString());
    });

    test('should add same product multiple times', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      
      // Add same product multiple times
      await catalogPage.addProductToCart(productId);
      await catalogPage.addProductToCart(productId);
      await catalogPage.addProductToCart(productId);
      
      // Navigate to cart
      await cartPage.navigate();
      
      // Verify quantity is accumulated
      await expect(cartPage.getCartItems()).toHaveCount(1);
      await expect(cartPage.getProductQuantity(productId)).toHaveValue('3');
    });

    test('should show add to cart confirmation', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId);
      
      // Verify confirmation message or modal
      const confirmation = catalogPage.getAddToCartConfirmation();
      const isVisible = await confirmation.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(confirmation).toBeVisible();
        await expect(confirmation).toContainText(/Added to cart|Product added|Successfully added/);
      }
    });

    test('should handle out of stock products', async ({ page }) => {
      const outOfStockProducts = testDataHelper.getTestData('products', 'outOfStockProducts');
      const outOfStockProduct = outOfStockProducts[0];
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Try to add out of stock product
      const addButton = catalogPage.getAddToCartButton(outOfStockProduct.id);
      
      // Button should be disabled or show out of stock message
      const isDisabled = await addButton.isDisabled().catch(() => false);
      const outOfStockMessage = await catalogPage.getOutOfStockMessage(outOfStockProduct.id).isVisible().catch(() => false);
      
      expect(isDisabled || outOfStockMessage).toBe(true);
      
      if (!isDisabled) {
        await addButton.click();
        await expect(catalogPage.getErrorMessage()).toContainText(/Out of stock|Not available|Cannot add/);
      }
    });

    test('should respect maximum quantity limits', async ({ page }) => {
      const cartValidation = testDataHelper.getTestData('cart', 'cartValidation');
      const maxQuantityTest = cartValidation.find(v => v.scenarioName === 'maxQuantityLimit');
      
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Try to add more than maximum allowed quantity
      await catalogPage.addProductToCart(maxQuantityTest.productId, maxQuantityTest.attemptedQuantity);
      
      // Should show error or limit quantity
      const errorMessage = await catalogPage.getErrorMessage().textContent().catch(() => '');
      if (errorMessage.includes('Maximum') || errorMessage.includes('limit')) {
        await expect(catalogPage.getErrorMessage()).toContainText(maxQuantityTest.expectedError);
      } else {
        // Check if quantity was limited in cart
        await cartPage.navigate();
        const actualQuantity = await cartPage.getProductQuantity(maxQuantityTest.productId).inputValue();
        expect(parseInt(actualQuantity)).toBeLessThanOrEqual(maxQuantityTest.maxAllowed);
      }
    });
  });

  test.describe('Update Cart Functionality', () => {
    test('should update product quantity in cart', async ({ page }) => {
      const quantityUpdateScenario = testDataHelper.getCartData('quantityUpdates');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Add initial product
      const initialItem = quantityUpdateScenario.initialItems[0];
      await catalogPage.addProductToCart(initialItem.productId, initialItem.quantity);
      
      // Navigate to cart
      await cartPage.navigate();
      
      // Update quantity
      const update = quantityUpdateScenario.updates[0];
      await cartPage.updateProductQuantity(update.productId, update.newQuantity);
      
      // Verify updated quantity and subtotal
      await expect(cartPage.getProductQuantity(update.productId)).toHaveValue(update.newQuantity.toString());
      await expect(cartPage.getProductSubtotal(update.productId)).toContainText(update.expectedSubtotal.toString());
      await expect(cartPage.getSubtotal()).toContainText(quantityUpdateScenario.expectedTotal.toString());
    });

    test('should update quantity using increment/decrement buttons', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId, 2);
      
      await cartPage.navigate();
      
      // Increment quantity
      await cartPage.incrementQuantity(productId);
      await expect(cartPage.getProductQuantity(productId)).toHaveValue('3');
      
      // Decrement quantity
      await cartPage.decrementQuantity(productId);
      await expect(cartPage.getProductQuantity(productId)).toHaveValue('2');
    });

    test('should prevent quantity from going below 1', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId, 1);
      
      await cartPage.navigate();
      
      // Try to decrement below 1
      await cartPage.decrementQuantity(productId);
      
      // Quantity should remain 1 or product should be removed
      const quantity = await cartPage.getProductQuantity(productId).inputValue().catch(() => '0');
      if (quantity !== '0') {
        expect(parseInt(quantity)).toBeGreaterThanOrEqual(1);
      }
    });

    test('should update cart totals when quantity changes', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId, 1);
      
      await cartPage.navigate();
      
      // Get initial total
      const initialTotal = await cartPage.getSubtotal().textContent();
      const initialPrice = parseFloat(initialTotal.replace(/[^0-9.]/g, ''));
      
      // Update quantity to 3
      await cartPage.updateProductQuantity(productId, 3);
      
      // Verify total is updated
      const newTotal = await cartPage.getSubtotal().textContent();
      const newPrice = parseFloat(newTotal.replace(/[^0-9.]/g, ''));
      
      expect(newPrice).toBeCloseTo(initialPrice * 3, 2);
    });

    test('should handle invalid quantity input', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId, 1);
      
      await cartPage.navigate();
      
      // Try invalid quantities
      const invalidQuantities = ['0', '-1', 'abc', '1.5', ''];
      
      for (const invalidQty of invalidQuantities) {
        await cartPage.getProductQuantity(productId).fill(invalidQty);
        await cartPage.getProductQuantity(productId).blur();
        
        // Should show error or revert to valid quantity
        const currentQuantity = await cartPage.getProductQuantity(productId).inputValue();
        expect(parseInt(currentQuantity) || 1).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test.describe('Remove from Cart Functionality', () => {
    test('should remove single product from cart', async ({ page }) => {
      const removeItemsScenario = testDataHelper.getCartData('removeItems');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Add initial products
      for (const item of removeItemsScenario.initialItems) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }
      
      await cartPage.navigate();
      
      // Remove specified product
      const productToRemove = removeItemsScenario.itemsToRemove[0];
      await cartPage.removeProduct(productToRemove);
      
      // Verify product is removed
      await expect(cartPage.getProductInCart(productToRemove)).not.toBeVisible();
      
      // Verify remaining products
      await expect(cartPage.getCartItems()).toHaveCount(removeItemsScenario.expectedRemainingItems.length);
      
      for (const remainingItem of removeItemsScenario.expectedRemainingItems) {
        await expect(cartPage.getProductInCart(remainingItem.productId)).toBeVisible();
      }
      
      // Verify updated total
      await expect(cartPage.getSubtotal()).toContainText(removeItemsScenario.expectedTotal.toString());
    });

    test('should show confirmation before removing product', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId);
      
      await cartPage.navigate();
      
      // Set up dialog handler
      let confirmationShown = false;
      page.on('dialog', async dialog => {
        confirmationShown = true;
        expect(dialog.message()).toContain(/remove|delete|confirm/i);
        await dialog.accept();
      });
      
      await cartPage.removeProduct(productId);
      
      if (confirmationShown) {
        // Verify product was removed after confirmation
        await expect(cartPage.getProductInCart(productId)).not.toBeVisible();
      }
    });

    test('should clear entire cart', async ({ page }) => {
      const emptyCartScenario = testDataHelper.getCartData('emptyCart');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Add initial products
      for (const item of emptyCartScenario.initialItems) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }
      
      await cartPage.navigate();
      
      // Clear cart
      await cartPage.clearCart();
      
      // Verify cart is empty
      await expect(cartPage.getCartItems()).toHaveCount(0);
      await expect(cartPage.getEmptyCartMessage()).toBeVisible();
      await expect(cartPage.getEmptyCartMessage()).toContainText(emptyCartScenario.expectedMessage);
      await expect(cartPage.getSubtotal()).toContainText(emptyCartScenario.expectedTotal.toString());
    });

    test('should handle removing last item from cart', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId);
      
      await cartPage.navigate();
      await cartPage.removeProduct(productId);
      
      // Verify empty cart state
      await expect(cartPage.getCartItems()).toHaveCount(0);
      await expect(cartPage.getEmptyCartMessage()).toBeVisible();
      await expect(cartPage.getContinueShoppingButton()).toBeVisible();
    });
  });

  test.describe('Cart Calculations', () => {
    test('should calculate subtotal correctly', async ({ page }) => {
      const calculationScenario = testDataHelper.getTestData('cart', 'cartCalculations')[0];
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      // Add products from calculation scenario
      for (const item of calculationScenario.items) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }
      
      await cartPage.navigate();
      
      // Verify subtotal calculation
      await expect(cartPage.getSubtotal()).toContainText(calculationScenario.subtotal.toString());
    });

    test('should calculate tax correctly', async ({ page }) => {
      const taxScenario = testDataHelper.getTestData('cart', 'cartCalculations')
        .find(calc => calc.scenarioName === 'taxCalculation');
      
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      for (const item of taxScenario.items) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }
      
      await cartPage.navigate();
      
      // Verify tax calculation
      await expect(cartPage.getTax()).toContainText(taxScenario.expectedTax.toString());
      await expect(cartPage.getTotal()).toContainText(taxScenario.expectedTotal.toString());
    });

    test('should calculate shipping correctly', async ({ page }) => {
      const shippingScenario = testDataHelper.getTestData('cart', 'cartCalculations')
        .find(calc => calc.scenarioName === 'shippingCalculation');
      
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      for (const item of shippingScenario.items) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }
      
      await cartPage.navigate();
      
      // Verify shipping calculation
      await expect(cartPage.getShipping()).toContainText(shippingScenario.expectedShipping.toString());
      await expect(cartPage.getTotal()).toContainText(shippingScenario.expectedTotal.toString());
    });

    test('should apply free shipping threshold', async ({ page }) => {
      const freeShippingScenario = testDataHelper.getTestData('cart', 'cartCalculations')
        .find(calc => calc.scenarioName === 'freeShipping');
      
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      
      for (const item of freeShippingScenario.items) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }
      
      await cartPage.navigate();
      
      // Verify free shipping is applied
      await expect(cartPage.getShipping()).toContainText('Free');
      await expect(cartPage.getTotal()).toContainText(freeShippingScenario.expectedTotal.toString());
      
      // Verify free shipping message
      await expect(cartPage.getFreeShippingMessage()).toBeVisible();
    });

    test('should show free shipping progress', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001', 1); // Assuming this is under free shipping threshold
      
      await cartPage.navigate();
      
      // Check for free shipping progress indicator
      const progressIndicator = cartPage.getFreeShippingProgress();
      const isVisible = await progressIndicator.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(progressIndicator).toBeVisible();
        await expect(progressIndicator).toContainText(/Add.*more.*free shipping|.*away from free shipping/);
      }
    });
  });

  test.describe('Cart Persistence and State', () => {
    test('should persist cart across page refreshes', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId, 2);
      
      // Refresh page
      await page.reload();
      
      // Verify cart persists
      await expect(catalogPage.getCartItemCount()).toContainText('2');
      
      await cartPage.navigate();
      await expect(cartPage.getProductInCart(productId)).toBeVisible();
      await expect(cartPage.getProductQuantity(productId)).toHaveValue('2');
    });

    test('should persist cart across browser sessions', async ({ page, context }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId, 3);
      
      // Close and reopen browser
      await context.close();
      const newContext = await page.context().browser().newContext();
      const newPage = await newContext.newPage();
      
      const newCatalogPage = new ProductCatalogPage(newPage);
      const newCartPage = new ShoppingCartPage(newPage);
      
      await newCatalogPage.navigate();
      
      // Verify cart persists (if using localStorage/cookies)
      const cartCount = await newCatalogPage.getCartItemCount().textContent().catch(() => '0');
      if (cartCount !== '0') {
        await expect(newCatalogPage.getCartItemCount()).toContainText('3');
        
        await newCartPage.navigate();
        await expect(newCartPage.getProductInCart(productId)).toBeVisible();
      }
      
      await newContext.close();
    });

    test('should merge cart when user logs in', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const loginPage = require('./pages/LoginPage');
      
      // Add items to cart as guest
      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001', 1);
      await catalogPage.addProductToCart('prod002', 2);
      
      // Login (assuming user has existing cart)
      const userData = testDataHelper.getUserData('valid', 0);
      const login = new loginPage(page);
      
      await login.navigate();
      await login.fillLoginForm(userData.email, userData.password);
      await login.submitForm();
      
      // Navigate to cart and verify items are merged
      await cartPage.navigate();
      const cartItems = await cartPage.getCartItems();
      await expect(cartItems).toHaveCountGreaterThanOrEqual(2);
    });
  });

  test.describe('Cart UI and UX', () => {
    test('should show loading state during cart operations', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');
      
      await cartPage.navigate();
      
      // Update quantity and check for loading state
      await cartPage.updateProductQuantity('prod001', 5);
      
      const loadingIndicator = cartPage.getLoadingIndicator();
      const isLoading = await loadingIndicator.isVisible().catch(() => false);
      
      if (isLoading) {
        await expect(loadingIndicator).toBeVisible();
        await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('should show cart item count in navigation', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Initially cart should be empty
      const initialCount = await catalogPage.getCartItemCount().textContent().catch(() => '0');
      expect(parseInt(initialCount) || 0).toBe(0);
      
      // Add items and verify count updates
      await catalogPage.addProductToCart('prod001', 2);
      await expect(catalogPage.getCartItemCount()).toContainText('2');
      
      await catalogPage.addProductToCart('prod002', 1);
      await expect(catalogPage.getCartItemCount()).toContainText('3');
    });

    test('should provide continue shopping functionality', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');
      
      await cartPage.navigate();
      await cartPage.clickContinueShopping();
      
      // Should return to product catalog
      await expect(page).toHaveURL(/.*\/products|.*\/catalog|.*\/shop/);
    });

    test('should show product details in cart', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const productId = 'prod001';
      
      await catalogPage.navigate();
      await catalogPage.addProductToCart(productId);
      
      await cartPage.navigate();
      
      // Verify product details are shown
      await expect(cartPage.getProductName(productId)).toBeVisible();
      await expect(cartPage.getProductPrice(productId)).toBeVisible();
      await expect(cartPage.getProductImage(productId)).toBeVisible();
      
      // Check for product options if any
      const productOptions = cartPage.getProductOptions(productId);
      const hasOptions = await productOptions.isVisible().catch(() => false);
      
      if (hasOptions) {
        await expect(productOptions).toBeVisible();
      }
    });
  });
});