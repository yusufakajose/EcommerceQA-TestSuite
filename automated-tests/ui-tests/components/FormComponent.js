/**
 * Form Component
 * Handles common form elements and validation
 */

const { BasePage } = require('../pages/BasePage');
const { expect } = require('@playwright/test');

class FormComponent extends BasePage {
  constructor(page) {
    super(page);

    // Common form selectors
    this.selectors = {
      // Form elements
      form: '[data-testid="form"]',
      submitButton: '[data-testid="submit-button"]',
      cancelButton: '[data-testid="cancel-button"]',
      resetButton: '[data-testid="reset-button"]',

      // Input fields
      textInput: 'input[type="text"]',
      emailInput: 'input[type="email"]',
      passwordInput: 'input[type="password"]',
      numberInput: 'input[type="number"]',
      dateInput: 'input[type="date"]',
      textArea: 'textarea',
      selectDropdown: 'select',
      checkbox: 'input[type="checkbox"]',
      radioButton: 'input[type="radio"]',
      fileInput: 'input[type="file"]',

      // Validation messages
      errorMessage: '[data-testid="error-message"]',
      successMessage: '[data-testid="success-message"]',
      fieldError: '[data-testid="field-error"]',
      requiredIndicator: '[data-testid="required"]',

      // Loading states
      loadingSpinner: '[data-testid="loading-spinner"]',
      submitSpinner: '[data-testid="submit-spinner"]',
    };
  }

  /**
   * Fill form with data object
   * @param {object} formData - Object containing field names and values
   */
  async fillForm(formData) {
    for (const [fieldName, value] of Object.entries(formData)) {
      const selector = `[data-testid="${fieldName}"], [name="${fieldName}"], #${fieldName}`;

      if (await this.isElementPresent(selector)) {
        const element = this.page.locator(selector);
        const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
        const inputType = await element.evaluate((el) => el.type || '');

        switch (tagName) {
          case 'input':
            await this.fillInputByType(selector, value, inputType);
            break;
          case 'textarea':
            await this.fillInput(selector, value);
            break;
          case 'select':
            await this.selectOption(selector, value);
            break;
          default:
            await this.fillInput(selector, value);
        }
      }
    }
  }

  /**
   * Fill input based on type
   * @param {string} selector - Input selector
   * @param {any} value - Value to fill
   * @param {string} inputType - Input type
   */
  async fillInputByType(selector, value, inputType) {
    switch (inputType) {
      case 'checkbox':
        await this.setCheckbox(selector, value);
        break;
      case 'radio':
        if (value) {
          await this.clickElement(selector);
        }
        break;
      case 'file':
        await this.uploadFile(selector, value);
        break;
      default:
        await this.fillInput(selector, value);
    }
  }

  /**
   * Set checkbox state
   * @param {string} selector - Checkbox selector
   * @param {boolean} checked - Whether to check or uncheck
   */
  async setCheckbox(selector, checked) {
    const isChecked = await this.page.isChecked(selector);

    if (checked && !isChecked) {
      await this.clickElement(selector);
    } else if (!checked && isChecked) {
      await this.clickElement(selector);
    }
  }

  /**
   * Select radio button by value
   * @param {string} name - Radio button group name
   * @param {string} value - Value to select
   */
  async selectRadioButton(name, value) {
    const selector = `input[type="radio"][name="${name}"][value="${value}"]`;
    await this.clickElement(selector);
  }

  /**
   * Submit form
   * @param {boolean} waitForResponse - Whether to wait for response
   */
  async submitForm(waitForResponse = true) {
    await this.clickElement(this.selectors.submitButton);

    if (waitForResponse) {
      // Wait for either success message, error message, or page navigation
      await Promise.race([
        this.waitForElement(this.selectors.successMessage, { timeout: 10000 }),
        this.waitForElement(this.selectors.errorMessage, { timeout: 10000 }),
        this.waitForNetworkIdle(),
      ]);
    }
  }

  /**
   * Cancel form
   */
  async cancelForm() {
    await this.clickElement(this.selectors.cancelButton);
    await this.waitForPageLoad();
  }

  /**
   * Reset form
   */
  async resetForm() {
    await this.clickElement(this.selectors.resetButton);
    await this.page.waitForTimeout(500); // Wait for form reset
  }

  /**
   * Get form validation errors
   */
  async getValidationErrors() {
    const errors = [];
    const errorElements = await this.page.locator(this.selectors.fieldError).all();

    for (const element of errorElements) {
      const errorText = await element.textContent();
      if (errorText && errorText.trim()) {
        errors.push(errorText.trim());
      }
    }

    return errors;
  }

  /**
   * Get general error message
   */
  async getErrorMessage() {
    if (await this.isElementVisible(this.selectors.errorMessage)) {
      return await this.getTextContent(this.selectors.errorMessage);
    }
    return null;
  }

  /**
   * Get success message
   */
  async getSuccessMessage() {
    if (await this.isElementVisible(this.selectors.successMessage)) {
      return await this.getTextContent(this.selectors.successMessage);
    }
    return null;
  }

  /**
   * Validate form submission success
   * @param {string} expectedMessage - Expected success message
   */
  async validateFormSubmissionSuccess(expectedMessage) {
    await this.waitForElement(this.selectors.successMessage);
    const actualMessage = await this.getSuccessMessage();

    if (expectedMessage) {
      expect(actualMessage).toContain(expectedMessage);
    }
  }

  /**
   * Validate form submission error
   * @param {string} expectedError - Expected error message
   */
  async validateFormSubmissionError(expectedError) {
    await this.waitForElement(this.selectors.errorMessage);
    const actualError = await this.getErrorMessage();

    if (expectedError) {
      expect(actualError).toContain(expectedError);
    }
  }

  /**
   * Validate field validation error
   * @param {string} fieldName - Field name
   * @param {string} expectedError - Expected error message
   */
  async validateFieldError(fieldName, expectedError) {
    const errorSelector = `[data-testid="${fieldName}-error"]`;
    await this.waitForElement(errorSelector);
    const actualError = await this.getTextContent(errorSelector);
    expect(actualError).toContain(expectedError);
  }

  /**
   * Validate required fields are marked
   * @param {string[]} requiredFields - Array of required field names
   */
  async validateRequiredFields(requiredFields) {
    for (const fieldName of requiredFields) {
      const requiredSelector = `[data-testid="${fieldName}"] ${this.selectors.requiredIndicator}`;
      await this.validateElementVisible(requiredSelector);
    }
  }

  /**
   * Check if form is in loading state
   */
  async isFormLoading() {
    return (
      (await this.isElementVisible(this.selectors.loadingSpinner)) ||
      (await this.isElementVisible(this.selectors.submitSpinner))
    );
  }

  /**
   * Wait for form to finish loading
   */
  async waitForFormToLoad() {
    // Wait for loading spinner to disappear
    if (await this.isElementVisible(this.selectors.loadingSpinner)) {
      await this.waitForElementToDisappear(this.selectors.loadingSpinner);
    }

    if (await this.isElementVisible(this.selectors.submitSpinner)) {
      await this.waitForElementToDisappear(this.selectors.submitSpinner);
    }
  }

  /**
   * Get all form field values
   */
  async getFormValues() {
    const formValues = {};

    // Get all input elements
    const inputs = await this.page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const name = (await input.getAttribute('name')) || (await input.getAttribute('data-testid'));
      const type = (await input.getAttribute('type')) || 'text';

      if (name) {
        switch (type) {
          case 'checkbox':
            formValues[name] = await input.isChecked();
            break;
          case 'radio':
            if (await input.isChecked()) {
              formValues[name] = await input.getAttribute('value');
            }
            break;
          case 'select-one':
            formValues[name] = await input.inputValue();
            break;
          default:
            formValues[name] = await input.inputValue();
        }
      }
    }

    return formValues;
  }

  /**
   * Clear all form fields
   */
  async clearForm() {
    const inputs = await this.page
      .locator('input[type="text"], input[type="email"], input[type="password"], textarea')
      .all();

    for (const input of inputs) {
      await input.fill('');
    }

    // Uncheck all checkboxes
    const checkboxes = await this.page.locator('input[type="checkbox"]:checked').all();
    for (const checkbox of checkboxes) {
      await checkbox.uncheck();
    }
  }

  /**
   * Validate form field is enabled
   * @param {string} fieldName - Field name
   */
  async validateFieldEnabled(fieldName) {
    const selector = `[data-testid="${fieldName}"], [name="${fieldName}"]`;
    const isDisabled = await this.page.locator(selector).isDisabled();
    expect(isDisabled).toBe(false);
  }

  /**
   * Validate form field is disabled
   * @param {string} fieldName - Field name
   */
  async validateFieldDisabled(fieldName) {
    const selector = `[data-testid="${fieldName}"], [name="${fieldName}"]`;
    const isDisabled = await this.page.locator(selector).isDisabled();
    expect(isDisabled).toBe(true);
  }

  /**
   * Validate form field has specific value
   * @param {string} fieldName - Field name
   * @param {string} expectedValue - Expected value
   */
  async validateFieldValue(fieldName, expectedValue) {
    const selector = `[data-testid="${fieldName}"], [name="${fieldName}"]`;
    const actualValue = await this.page.locator(selector).inputValue();
    expect(actualValue).toBe(expectedValue);
  }
}

module.exports = { FormComponent };
