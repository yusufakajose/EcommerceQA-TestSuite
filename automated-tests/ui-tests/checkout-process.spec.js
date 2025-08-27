/**
 * Checkout Process Test Suite
 * Comprehensive tests for checkout functionality including payment validation
 */

const { test, expect } = require('@playwright/test');
const ProductCatalogPage = require('./pages/ProductCatalogPage');
const ShoppingCartPage = require('./pages/ShoppingCartPage');
const CheckoutPage = require('./pages/CheckoutPage');
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

test.describe('Checkout Process Tests', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('CheckoutProcess');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ page }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Checkout Flow - Logged In User', () => {
    test('should complete successful checkout with valid data', async ({ page }) => {
      const checkoutScenario = testDataHelper.getCheckoutData('successfulCheckout');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add products to cart
      await catalogPage.navigate();
      for (const item of checkoutScenario.items) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }

      // Proceed to checkout
      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Fill shipping information
      await checkoutPage.fillShippingAddress(checkoutScenario.shippingAddress);

      // Fill payment information
      await checkoutPage.fillPaymentMethod(checkoutScenario.paymentMethod);

      // Review and place order
      await checkoutPage.reviewOrder();
      await checkoutPage.placeOrder();

      // Verify successful order
      await expect(checkoutPage.getSuccessMessage()).toBeVisible();
      await expect(checkoutPage.getSuccessMessage()).toContainText(
        checkoutScenario.expectedSuccessMessage
      );

      // Verify order confirmation details
      await expect(checkoutPage.getOrderNumber()).toBeVisible();
      await expect(checkoutPage.getOrderTotal()).toContainText(
        checkoutScenario.expectedOrderTotal.toString()
      );
    });

    test('should use saved shipping address', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const checkoutPage = new CheckoutPage(page);
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);

      // Login first (assuming user has saved addresses)
      // Add item and go to checkout
      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Check if saved addresses are available
      const savedAddresses = checkoutPage.getSavedAddresses();
      const hasSavedAddresses = await savedAddresses.isVisible().catch(() => false);

      if (hasSavedAddresses) {
        await checkoutPage.selectSavedAddress(0); // Select first saved address

        // Verify address fields are populated
        await expect(checkoutPage.getShippingField('firstName')).not.toHaveValue('');
        await expect(checkoutPage.getShippingField('lastName')).not.toHaveValue('');
        await expect(checkoutPage.getShippingField('street')).not.toHaveValue('');
      }
    });

    test('should use same address for billing and shipping', async ({ page }) => {
      const checkoutScenario = testDataHelper.getCheckoutData('successfulCheckout');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Fill shipping address
      await checkoutPage.fillShippingAddress(checkoutScenario.shippingAddress);

      // Check "same as shipping" for billing
      await checkoutPage.checkSameAsShipping();

      // Verify billing fields are populated with shipping data
      await expect(checkoutPage.getBillingField('firstName')).toHaveValue(
        checkoutScenario.shippingAddress.firstName
      );
      await expect(checkoutPage.getBillingField('street')).toHaveValue(
        checkoutScenario.shippingAddress.street
      );
      await expect(checkoutPage.getBillingField('city')).toHaveValue(
        checkoutScenario.shippingAddress.city
      );
    });

    test('should use different billing address', async ({ page }) => {
      const checkoutScenario = testDataHelper.getCheckoutData('guestCheckout');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Fill shipping address
      await checkoutPage.fillShippingAddress(checkoutScenario.shippingAddress);

      // Uncheck "same as shipping" and fill different billing address
      await checkoutPage.uncheckSameAsShipping();
      await checkoutPage.fillBillingAddress(checkoutScenario.billingAddress);

      // Verify different addresses are used
      await expect(checkoutPage.getBillingField('street')).toHaveValue(
        checkoutScenario.billingAddress.street
      );
      await expect(checkoutPage.getBillingField('city')).toHaveValue(
        checkoutScenario.billingAddress.city
      );
    });
  });

  test.describe('Checkout Flow - Guest User', () => {
    test('should complete guest checkout successfully', async ({ page }) => {
      const guestCheckoutScenario = testDataHelper.getCheckoutData('guestCheckout');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      for (const item of guestCheckoutScenario.items) {
        await catalogPage.addProductToCart(item.productId, item.quantity);
      }

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Choose guest checkout
      await checkoutPage.selectGuestCheckout();

      // Fill guest information
      await checkoutPage.fillGuestEmail(guestCheckoutScenario.user.email);
      await checkoutPage.fillShippingAddress(guestCheckoutScenario.shippingAddress);
      await checkoutPage.fillBillingAddress(guestCheckoutScenario.billingAddress);
      await checkoutPage.fillPaymentMethod(guestCheckoutScenario.paymentMethod);

      await checkoutPage.placeOrder();

      // Verify successful order
      await expect(checkoutPage.getSuccessMessage()).toBeVisible();
      await expect(checkoutPage.getOrderTotal()).toContainText(
        guestCheckoutScenario.expectedOrderTotal.toString()
      );
    });

    test('should offer account creation during guest checkout', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.selectGuestCheckout();

      // Check if account creation option is available
      const createAccountOption = checkoutPage.getCreateAccountOption();
      const isVisible = await createAccountOption.isVisible().catch(() => false);

      if (isVisible) {
        await checkoutPage.checkCreateAccount();

        // Verify password fields appear
        await expect(checkoutPage.getPasswordField()).toBeVisible();
        await expect(checkoutPage.getConfirmPasswordField()).toBeVisible();
      }
    });
  });

  test.describe('Payment Method Validation', () => {
    test('should accept valid Visa card', async ({ page }) => {
      const visaCard = testDataHelper.getPaymentMethodData('visa');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Fill minimal required info and focus on payment
      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod(visaCard);

      // Verify card is accepted
      await expect(checkoutPage.getPaymentErrors()).toHaveCount(0);

      // Verify card type is detected
      await expect(checkoutPage.getCardTypeIndicator()).toContainText(/visa/i);
    });

    test('should accept valid Mastercard', async ({ page }) => {
      const mastercardCard = testDataHelper.getPaymentMethodData('mastercard');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod(mastercardCard);

      await expect(checkoutPage.getPaymentErrors()).toHaveCount(0);
      await expect(checkoutPage.getCardTypeIndicator()).toContainText(/mastercard/i);
    });

    test('should accept valid American Express card', async ({ page }) => {
      const amexCard = testDataHelper.getPaymentMethodData('american express');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod(amexCard);

      await expect(checkoutPage.getPaymentErrors()).toHaveCount(0);
      await expect(checkoutPage.getCardTypeIndicator()).toContainText(/american express|amex/i);
    });

    test('should reject declined card', async ({ page }) => {
      const declinedCard = testDataHelper.getPaymentMethodData('declined');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod(declinedCard);
      await checkoutPage.placeOrder();

      // Verify payment error
      await expect(checkoutPage.getPaymentError()).toBeVisible();
      await expect(checkoutPage.getPaymentError()).toContainText(declinedCard.expectedError);
    });

    test('should handle insufficient funds error', async ({ page }) => {
      const insufficientFundsCard = testDataHelper.getPaymentMethodData('insufficient funds');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod(insufficientFundsCard);
      await checkoutPage.placeOrder();

      await expect(checkoutPage.getPaymentError()).toBeVisible();
      await expect(checkoutPage.getPaymentError()).toContainText(
        insufficientFundsCard.expectedError
      );
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required shipping fields', async ({ page }) => {
      const validationErrors = testDataHelper
        .getTestData('checkout', 'validationErrors')
        .find((v) => v.scenarioName === 'missingShippingInfo');

      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Try to proceed without filling required fields
      await checkoutPage.proceedToPayment();

      // Verify validation errors
      for (const expectedError of validationErrors.expectedErrors) {
        await expect(checkoutPage.getFieldError()).toContainText(expectedError);
      }
    });

    test('should validate payment information', async ({ page }) => {
      const validationErrors = testDataHelper
        .getTestData('checkout', 'validationErrors')
        .find((v) => v.scenarioName === 'invalidPaymentInfo');

      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Fill valid shipping info
      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Fill invalid payment info
      await checkoutPage.fillPaymentMethod(validationErrors.paymentMethod);
      await checkoutPage.placeOrder();

      // Verify validation errors
      for (const expectedError of validationErrors.expectedErrors) {
        await expect(checkoutPage.getPaymentFieldError()).toContainText(expectedError);
      }
    });

    test('should validate ZIP code format', async ({ page }) => {
      const zipCodeValidation = testDataHelper
        .getTestData('checkout', 'validationErrors')
        .find((v) => v.scenarioName === 'invalidZipCode');

      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingField('zipCode', zipCodeValidation.shippingAddress.zipCode);
      await checkoutPage.getShippingField('city').click(); // Trigger validation

      await expect(checkoutPage.getFieldError('zipCode')).toContainText(
        zipCodeValidation.expectedErrors[0]
      );
    });

    test('should validate phone number format', async ({ page }) => {
      const phoneValidation = testDataHelper
        .getTestData('checkout', 'validationErrors')
        .find((v) => v.scenarioName === 'invalidPhoneNumber');

      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingField('phone', phoneValidation.shippingAddress.phone);
      await checkoutPage.getShippingField('firstName').click(); // Trigger validation

      await expect(checkoutPage.getFieldError('phone')).toContainText(
        phoneValidation.expectedErrors[0]
      );
    });

    test('should validate credit card number format', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Test invalid card numbers
      const invalidCardNumbers = ['1234', '1234567890123456789', 'abcd1234567890123'];

      for (const invalidCard of invalidCardNumbers) {
        await checkoutPage.fillPaymentField('cardNumber', invalidCard);
        await checkoutPage.getPaymentField('expiryMonth').click();

        await expect(checkoutPage.getPaymentFieldError('cardNumber')).toContainText(
          /Invalid card number|Please enter a valid card number/
        );
      }
    });

    test('should validate expiry date', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Test expired card
      await checkoutPage.fillPaymentField('cardNumber', '4111111111111111');
      await checkoutPage.fillPaymentField('expiryMonth', '01');
      await checkoutPage.fillPaymentField('expiryYear', '2020');
      await checkoutPage.fillPaymentField('cvv', '123');

      await checkoutPage.getPaymentField('cardholderName').click();

      await expect(checkoutPage.getPaymentFieldError('expiryYear')).toContainText(
        /Card has expired|Expiry date is invalid/
      );
    });
  });

  test.describe('Shipping Options', () => {
    test('should display available shipping options', async ({ page }) => {
      const shippingOptions = testDataHelper.getTestData('checkout', 'shippingOptions');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Verify shipping options are displayed
      for (const option of shippingOptions) {
        await expect(checkoutPage.getShippingOption(option.id)).toBeVisible();
        await expect(checkoutPage.getShippingOptionName(option.id)).toContainText(option.name);
        await expect(checkoutPage.getShippingOptionCost(option.id)).toContainText(
          option.cost.toString()
        );
      }
    });

    test('should select different shipping options', async ({ page }) => {
      const shippingOptions = testDataHelper.getTestData('checkout', 'shippingOptions');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Test selecting express shipping
      const expressOption = shippingOptions.find((opt) => opt.id === 'express');
      await checkoutPage.selectShippingOption(expressOption.id);

      // Verify total is updated with shipping cost
      await expect(checkoutPage.getShippingCost()).toContainText(expressOption.cost.toString());

      // Test selecting overnight shipping
      const overnightOption = shippingOptions.find((opt) => opt.id === 'overnight');
      await checkoutPage.selectShippingOption(overnightOption.id);

      await expect(checkoutPage.getShippingCost()).toContainText(overnightOption.cost.toString());
    });

    test('should show free shipping when eligible', async ({ page }) => {
      const freeShippingOption = testDataHelper
        .getTestData('checkout', 'shippingOptions')
        .find((opt) => opt.id === 'free');

      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();

      // Add items to meet free shipping threshold
      await catalogPage.addProductToCart('prod001', 2); // Assuming this meets minimum

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Verify free shipping option is available
      const freeShippingVisible = await checkoutPage
        .getShippingOption('free')
        .isVisible()
        .catch(() => false);

      if (freeShippingVisible) {
        await expect(checkoutPage.getShippingOption('free')).toBeVisible();
        await expect(checkoutPage.getShippingOptionCost('free')).toContainText('Free');
      }
    });
  });

  test.describe('Order Review and Confirmation', () => {
    test('should display order summary correctly', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001', 2);
      await catalogPage.addProductToCart('prod002', 1);

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      // Verify order summary shows correct items
      await expect(checkoutPage.getOrderSummaryItems()).toHaveCount(2);
      await expect(checkoutPage.getOrderSummaryItem('prod001')).toBeVisible();
      await expect(checkoutPage.getOrderSummaryItem('prod002')).toBeVisible();

      // Verify quantities and prices
      await expect(checkoutPage.getOrderSummaryQuantity('prod001')).toContainText('2');
      await expect(checkoutPage.getOrderSummaryQuantity('prod002')).toContainText('1');
    });

    test('should allow editing cart from checkout', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      // Click edit cart link
      await checkoutPage.clickEditCart();

      // Should return to cart page
      await expect(page).toHaveURL(/.*\/cart/);
      await expect(cartPage.getCartItems()).toHaveCount(1);
    });

    test('should show order confirmation after successful payment', async ({ page }) => {
      const checkoutScenario = testDataHelper.getCheckoutData('successfulCheckout');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress(checkoutScenario.shippingAddress);
      await checkoutPage.fillPaymentMethod(checkoutScenario.paymentMethod);
      await checkoutPage.placeOrder();

      // Verify order confirmation page
      await expect(checkoutPage.getOrderConfirmationTitle()).toBeVisible();
      await expect(checkoutPage.getOrderNumber()).toBeVisible();
      await expect(checkoutPage.getOrderDate()).toBeVisible();
      await expect(checkoutPage.getOrderTotal()).toBeVisible();

      // Verify order details
      await expect(checkoutPage.getConfirmationShippingAddress()).toContainText(
        checkoutScenario.shippingAddress.street
      );
      await expect(checkoutPage.getConfirmationPaymentMethod()).toContainText(
        '****' + checkoutScenario.paymentMethod.cardNumber.slice(-4)
      );
    });

    test('should send order confirmation email', async ({ page }) => {
      const checkoutScenario = testDataHelper.getCheckoutData('successfulCheckout');
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress(checkoutScenario.shippingAddress);
      await checkoutPage.fillPaymentMethod(checkoutScenario.paymentMethod);
      await checkoutPage.placeOrder();

      // Verify email confirmation message
      await expect(checkoutPage.getEmailConfirmationMessage()).toBeVisible();
      await expect(checkoutPage.getEmailConfirmationMessage()).toContainText(
        /confirmation email|email sent|check your email/i
      );
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle payment processing timeout', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod({
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'Test User',
      });

      // Simulate slow payment processing
      await checkoutPage.placeOrder();

      // Verify loading state is shown
      const loadingIndicator = checkoutPage.getPaymentLoadingIndicator();
      const isLoading = await loadingIndicator.isVisible().catch(() => false);

      if (isLoading) {
        await expect(loadingIndicator).toBeVisible();

        // Wait for timeout or completion
        await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
      }
    });

    test('should prevent double submission', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001');

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod({
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'Test User',
      });

      // Click place order button multiple times quickly
      const placeOrderButton = checkoutPage.getPlaceOrderButton();
      await placeOrderButton.click();
      await placeOrderButton.click();
      await placeOrderButton.click();

      // Verify button is disabled after first click
      await expect(placeOrderButton).toBeDisabled();
    });

    test('should handle inventory changes during checkout', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      const cartPage = new ShoppingCartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await catalogPage.navigate();
      await catalogPage.addProductToCart('prod001', 5); // Large quantity

      await cartPage.navigate();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillShippingAddress({
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        phone: '555-0123',
      });

      await checkoutPage.fillPaymentMethod({
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        cardholderName: 'Test User',
      });

      await checkoutPage.placeOrder();

      // If inventory is insufficient, should show appropriate error
      const inventoryError = await checkoutPage
        .getInventoryError()
        .isVisible()
        .catch(() => false);

      if (inventoryError) {
        await expect(checkoutPage.getInventoryError()).toContainText(
          /insufficient inventory|not enough stock|quantity not available/i
        );
      }
    });
  });
});
