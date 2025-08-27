/**
 * Checkout Page Object
 * Handles checkout process including shipping, billing, and payment
 */

const { BasePage } = require('./BasePage');
const { FormComponent } = require('../components/FormComponent');

class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.form = new FormComponent(page);

    // Page URL
    this.url = '/checkout';

    // Page selectors
    this.selectors = {
      // Page elements
      pageTitle: '[data-testid="checkout-title"]',
      checkoutContainer: '[data-testid="checkout-container"]',

      // Steps/Progress
      checkoutSteps: '[data-testid="checkout-steps"]',
      currentStep: '[data-testid="current-step"]',
      stepIndicator: '[data-testid="step-indicator"]',

      // Shipping Information
      shippingSection: '[data-testid="shipping-section"]',
      shippingFirstName: '[data-testid="shipping-first-name"]',
      shippingLastName: '[data-testid="shipping-last-name"]',
      shippingAddress: '[data-testid="shipping-address"]',
      shippingAddress2: '[data-testid="shipping-address-2"]',
      shippingCity: '[data-testid="shipping-city"]',
      shippingState: '[data-testid="shipping-state"]',
      shippingZip: '[data-testid="shipping-zip"]',
      shippingCountry: '[data-testid="shipping-country"]',
      shippingPhone: '[data-testid="shipping-phone"]',

      // Billing Information
      billingSection: '[data-testid="billing-section"]',
      sameAsShippingCheckbox: '[data-testid="same-as-shipping"]',
      billingFirstName: '[data-testid="billing-first-name"]',
      billingLastName: '[data-testid="billing-last-name"]',
      billingAddress: '[data-testid="billing-address"]',
      billingAddress2: '[data-testid="billing-address-2"]',
      billingCity: '[data-testid="billing-city"]',
      billingState: '[data-testid="billing-state"]',
      billingZip: '[data-testid="billing-zip"]',
      billingCountry: '[data-testid="billing-country"]',

      // Shipping Options
      shippingOptionsSection: '[data-testid="shipping-options-section"]',
      shippingOption: '[data-testid="shipping-option"]',
      standardShipping: '[data-testid="standard-shipping"]',
      expressShipping: '[data-testid="express-shipping"]',
      overnightShipping: '[data-testid="overnight-shipping"]',

      // Payment Information
      paymentSection: '[data-testid="payment-section"]',
      paymentMethod: '[data-testid="payment-method"]',
      creditCardOption: '[data-testid="credit-card-option"]',
      paypalOption: '[data-testid="paypal-option"]',

      // Credit Card Fields
      cardNumber: '[data-testid="card-number"]',
      expiryMonth: '[data-testid="expiry-month"]',
      expiryYear: '[data-testid="expiry-year"]',
      cvv: '[data-testid="cvv"]',
      cardholderName: '[data-testid="cardholder-name"]',

      // Order Summary
      orderSummary: '[data-testid="order-summary"]',
      orderItems: '[data-testid="order-items"]',
      orderItem: '[data-testid="order-item"]',
      itemName: '[data-testid="item-name"]',
      itemQuantity: '[data-testid="item-quantity"]',
      itemPrice: '[data-testid="item-price"]',

      // Order Totals
      subtotalAmount: '[data-testid="subtotal-amount"]',
      shippingAmount: '[data-testid="shipping-amount"]',
      taxAmount: '[data-testid="tax-amount"]',
      discountAmount: '[data-testid="discount-amount"]',
      totalAmount: '[data-testid="total-amount"]',

      // Promo Code
      promoCodeInput: '[data-testid="promo-code-input"]',
      applyPromoButton: '[data-testid="apply-promo-button"]',

      // Navigation Buttons
      continueButton: '[data-testid="continue-button"]',
      backButton: '[data-testid="back-button"]',
      placeOrderButton: '[data-testid="place-order-button"]',

      // Guest Checkout
      guestCheckoutOption: '[data-testid="guest-checkout"]',
      createAccountOption: '[data-testid="create-account"]',

      // Messages
      errorMessage: '[data-testid="error-message"]',
      successMessage: '[data-testid="success-message"]',
      validationError: '[data-testid="validation-error"]',

      // Loading states
      loadingSpinner: '[data-testid="loading-spinner"]',
      processingPayment: '[data-testid="processing-payment"]',

      // Order Confirmation
      orderConfirmation: '[data-testid="order-confirmation"]',
      orderNumber: '[data-testid="order-number"]',
      confirmationMessage: '[data-testid="confirmation-message"]',
    };
  }

  /**
   * Navigate to checkout page
   */
  async navigateToCheckout() {
    await this.navigateTo(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Fill shipping information
   * @param {object} shippingData - Shipping address data
   */
  async fillShippingInformation(shippingData) {
    await this.fillInput(this.selectors.shippingFirstName, shippingData.firstName);
    await this.fillInput(this.selectors.shippingLastName, shippingData.lastName);
    await this.fillInput(this.selectors.shippingAddress, shippingData.street);

    if (shippingData.address2) {
      await this.fillInput(this.selectors.shippingAddress2, shippingData.address2);
    }

    await this.fillInput(this.selectors.shippingCity, shippingData.city);
    await this.selectOption(this.selectors.shippingState, shippingData.state);
    await this.fillInput(this.selectors.shippingZip, shippingData.zipCode);
    await this.selectOption(this.selectors.shippingCountry, shippingData.country);

    if (shippingData.phone) {
      await this.fillInput(this.selectors.shippingPhone, shippingData.phone);
    }
  }

  /**
   * Fill billing information
   * @param {object} billingData - Billing address data
   * @param {boolean} sameAsShipping - Whether billing is same as shipping
   */
  async fillBillingInformation(billingData, sameAsShipping = false) {
    if (sameAsShipping) {
      await this.form.setCheckbox(this.selectors.sameAsShippingCheckbox, true);
    } else {
      await this.form.setCheckbox(this.selectors.sameAsShippingCheckbox, false);

      await this.fillInput(this.selectors.billingFirstName, billingData.firstName);
      await this.fillInput(this.selectors.billingLastName, billingData.lastName);
      await this.fillInput(this.selectors.billingAddress, billingData.street);

      if (billingData.address2) {
        await this.fillInput(this.selectors.billingAddress2, billingData.address2);
      }

      await this.fillInput(this.selectors.billingCity, billingData.city);
      await this.selectOption(this.selectors.billingState, billingData.state);
      await this.fillInput(this.selectors.billingZip, billingData.zipCode);
      await this.selectOption(this.selectors.billingCountry, billingData.country);
    }
  }

  /**
   * Select shipping option
   * @param {string} shippingType - 'standard', 'express', or 'overnight'
   */
  async selectShippingOption(shippingType) {
    let selector;
    switch (shippingType.toLowerCase()) {
      case 'standard':
        selector = this.selectors.standardShipping;
        break;
      case 'express':
        selector = this.selectors.expressShipping;
        break;
      case 'overnight':
        selector = this.selectors.overnightShipping;
        break;
      default:
        selector = `${this.selectors.shippingOption}[value="${shippingType}"]`;
    }

    await this.clickElement(selector);
    await this.waitForNetworkIdle();
  }

  /**
   * Select payment method
   * @param {string} paymentMethod - 'credit-card' or 'paypal'
   */
  async selectPaymentMethod(paymentMethod) {
    if (paymentMethod === 'credit-card') {
      await this.clickElement(this.selectors.creditCardOption);
    } else if (paymentMethod === 'paypal') {
      await this.clickElement(this.selectors.paypalOption);
    }

    await this.page.waitForTimeout(500); // Wait for payment form to appear
  }

  /**
   * Fill credit card information
   * @param {object} cardData - Credit card data
   */
  async fillCreditCardInformation(cardData) {
    await this.fillInput(this.selectors.cardNumber, cardData.cardNumber);
    await this.selectOption(this.selectors.expiryMonth, cardData.expiryMonth);
    await this.selectOption(this.selectors.expiryYear, cardData.expiryYear);
    await this.fillInput(this.selectors.cvv, cardData.cvv);
    await this.fillInput(this.selectors.cardholderName, cardData.cardholderName);
  }

  /**
   * Apply promo code
   * @param {string} promoCode - Promo code to apply
   */
  async applyPromoCode(promoCode) {
    await this.fillInput(this.selectors.promoCodeInput, promoCode);
    await this.clickElement(this.selectors.applyPromoButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Continue to next step
   */
  async continueToNextStep() {
    await this.clickElement(this.selectors.continueButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Go back to previous step
   */
  async goBackToPreviousStep() {
    await this.clickElement(this.selectors.backButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Place order
   */
  async placeOrder() {
    await this.clickElement(this.selectors.placeOrderButton);

    // Wait for order processing
    if (await this.isElementVisible(this.selectors.processingPayment)) {
      await this.waitForElementToDisappear(this.selectors.processingPayment);
    }

    await this.waitForNetworkIdle();
  }

  /**
   * Complete checkout process with all information
   * @param {object} checkoutData - Complete checkout data
   */
  async completeCheckout(checkoutData) {
    // Fill shipping information
    await this.fillShippingInformation(checkoutData.shippingAddress);
    await this.continueToNextStep();

    // Fill billing information
    await this.fillBillingInformation(
      checkoutData.billingAddress || checkoutData.shippingAddress,
      !checkoutData.billingAddress
    );
    await this.continueToNextStep();

    // Select shipping option
    if (checkoutData.shippingOption) {
      await this.selectShippingOption(checkoutData.shippingOption);
      await this.continueToNextStep();
    }

    // Fill payment information
    await this.selectPaymentMethod('credit-card');
    await this.fillCreditCardInformation(checkoutData.paymentInfo);

    // Apply promo code if provided
    if (checkoutData.promoCode) {
      await this.applyPromoCode(checkoutData.promoCode);
    }

    // Place order
    await this.placeOrder();
  }

  /**
   * Select guest checkout
   */
  async selectGuestCheckout() {
    if (await this.isElementVisible(this.selectors.guestCheckoutOption)) {
      await this.clickElement(this.selectors.guestCheckoutOption);
      await this.waitForPageLoad();
    }
  }

  /**
   * Get current step
   */
  async getCurrentStep() {
    if (await this.isElementVisible(this.selectors.currentStep)) {
      return await this.getTextContent(this.selectors.currentStep);
    }
    return null;
  }

  /**
   * Get order summary
   */
  async getOrderSummary() {
    return {
      subtotal: await this.getTextContent(this.selectors.subtotalAmount),
      shipping: await this.getTextContent(this.selectors.shippingAmount),
      tax: await this.getTextContent(this.selectors.taxAmount),
      discount: (await this.isElementVisible(this.selectors.discountAmount))
        ? await this.getTextContent(this.selectors.discountAmount)
        : '0.00',
      total: await this.getTextContent(this.selectors.totalAmount),
    };
  }

  /**
   * Get order items
   */
  async getOrderItems() {
    const items = [];
    const orderItems = await this.page.locator(this.selectors.orderItem).all();

    for (const item of orderItems) {
      items.push({
        name: await item.locator(this.selectors.itemName).textContent(),
        quantity: await item.locator(this.selectors.itemQuantity).textContent(),
        price: await item.locator(this.selectors.itemPrice).textContent(),
      });
    }

    return items;
  }

  /**
   * Get order confirmation number
   */
  async getOrderConfirmationNumber() {
    if (await this.isElementVisible(this.selectors.orderNumber)) {
      return await this.getTextContent(this.selectors.orderNumber);
    }
    return null;
  }

  /**
   * Get error message
   */
  async getErrorMessage() {
    if (await this.isElementVisible(this.selectors.errorMessage)) {
      return await this.getTextContent(this.selectors.errorMessage);
    }
    return null;
  }

  /**
   * Validate checkout page is loaded
   */
  async validateCheckoutPageLoaded() {
    await this.validateElementVisible(this.selectors.pageTitle);
    await this.validateElementVisible(this.selectors.checkoutContainer);
  }

  /**
   * Validate shipping information step
   */
  async validateShippingInformationStep() {
    await this.validateElementVisible(this.selectors.shippingSection);
    await this.validateElementVisible(this.selectors.shippingFirstName);
    await this.validateElementVisible(this.selectors.shippingLastName);
    await this.validateElementVisible(this.selectors.shippingAddress);
  }

  /**
   * Validate billing information step
   */
  async validateBillingInformationStep() {
    await this.validateElementVisible(this.selectors.billingSection);
    await this.validateElementVisible(this.selectors.sameAsShippingCheckbox);
  }

  /**
   * Validate payment information step
   */
  async validatePaymentInformationStep() {
    await this.validateElementVisible(this.selectors.paymentSection);
    await this.validateElementVisible(this.selectors.creditCardOption);
  }

  /**
   * Validate order confirmation
   */
  async validateOrderConfirmation() {
    await this.validateElementVisible(this.selectors.orderConfirmation);
    await this.validateElementVisible(this.selectors.orderNumber);
    await this.validateElementVisible(this.selectors.confirmationMessage);
  }

  /**
   * Validate checkout error
   * @param {string} expectedError - Expected error message
   */
  async validateCheckoutError(expectedError) {
    await this.validateElementVisible(this.selectors.errorMessage);
    const actualError = await this.getErrorMessage();

    if (expectedError) {
      expect(actualError).toContain(expectedError);
    }
  }

  /**
   * Validate required field validation
   * @param {string} fieldName - Field name
   */
  async validateRequiredFieldError(fieldName) {
    const errorSelector = `[data-testid="${fieldName}-error"]`;
    await this.validateElementVisible(errorSelector);
  }

  /**
   * Validate order total calculation
   */
  async validateOrderTotalCalculation() {
    const summary = await this.getOrderSummary();

    const subtotal = parseFloat(summary.subtotal.replace(/[^0-9.]/g, ''));
    const shipping = parseFloat(summary.shipping.replace(/[^0-9.]/g, ''));
    const tax = parseFloat(summary.tax.replace(/[^0-9.]/g, ''));
    const discount = parseFloat(summary.discount.replace(/[^0-9.]/g, ''));
    const total = parseFloat(summary.total.replace(/[^0-9.]/g, ''));

    const expectedTotal = subtotal + shipping + tax - discount;
    expect(Math.abs(total - expectedTotal)).toBeLessThan(0.01);
  }

  /**
   * Validate credit card number format
   */
  async validateCreditCardFormat() {
    // This would typically validate the card number format in real implementation
    const cardNumber = await this.page.inputValue(this.selectors.cardNumber);
    expect(cardNumber).toMatch(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/);
  }

  /**
   * Wait for checkout step to load
   */
  async waitForCheckoutStepToLoad() {
    if (await this.isElementVisible(this.selectors.loadingSpinner)) {
      await this.waitForElementToDisappear(this.selectors.loadingSpinner);
    }
    await this.waitForNetworkIdle();
  }
}

module.exports = { CheckoutPage };
