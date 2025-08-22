/**
 * Registration Page Object
 * Handles user registration functionality and validation
 */

const { BasePage } = require('./BasePage');
const { FormComponent } = require('../components/FormComponent');
const { NavigationComponent } = require('../components/NavigationComponent');

class RegistrationPage extends BasePage {
  constructor(page) {
    super(page);
    this.form = new FormComponent(page);
    this.navigation = new NavigationComponent(page);
    
    // Page URL
    this.url = '/register';
    
    // Page selectors
    this.selectors = {
      // Form elements
      firstNameInput: '[data-testid="first-name-input"]',
      lastNameInput: '[data-testid="last-name-input"]',
      emailInput: '[data-testid="email-input"]',
      passwordInput: '[data-testid="password-input"]',
      confirmPasswordInput: '[data-testid="confirm-password-input"]',
      phoneInput: '[data-testid="phone-input"]',
      dateOfBirthInput: '[data-testid="date-of-birth-input"]',
      
      // Checkboxes
      termsCheckbox: '[data-testid="terms-checkbox"]',
      newsletterCheckbox: '[data-testid="newsletter-checkbox"]',
      
      // Buttons
      registerButton: '[data-testid="register-button"]',
      cancelButton: '[data-testid="cancel-button"]',
      
      // Links
      loginLink: '[data-testid="login-link"]',
      termsLink: '[data-testid="terms-link"]',
      privacyLink: '[data-testid="privacy-link"]',
      
      // Messages
      registrationError: '[data-testid="registration-error"]',
      registrationSuccess: '[data-testid="registration-success"]',
      
      // Validation messages
      firstNameError: '[data-testid="first-name-error"]',
      lastNameError: '[data-testid="last-name-error"]',
      emailError: '[data-testid="email-error"]',
      passwordError: '[data-testid="password-error"]',
      confirmPasswordError: '[data-testid="confirm-password-error"]',
      phoneError: '[data-testid="phone-error"]',
      termsError: '[data-testid="terms-error"]',
      
      // Page elements
      pageTitle: '[data-testid="registration-title"]',
      registrationForm: '[data-testid="registration-form"]',
      
      // Password strength indicator
      passwordStrength: '[data-testid="password-strength"]',
      passwordRequirements: '[data-testid="password-requirements"]'
    };
  }

  /**
   * Navigate to registration page
   */
  async navigateToRegistrationPage() {
    await this.navigateTo(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Register new user with all required fields
   * @param {object} userData - User registration data
   */
  async registerUser(userData) {
    await this.fillInput(this.selectors.firstNameInput, userData.firstName);
    await this.fillInput(this.selectors.lastNameInput, userData.lastName);
    await this.fillInput(this.selectors.emailInput, userData.email);
    await this.fillInput(this.selectors.passwordInput, userData.password);
    await this.fillInput(this.selectors.confirmPasswordInput, userData.password);
    
    if (userData.phone) {
      await this.fillInput(this.selectors.phoneInput, userData.phone);
    }
    
    if (userData.dateOfBirth) {
      await this.fillInput(this.selectors.dateOfBirthInput, userData.dateOfBirth);
    }
    
    // Accept terms and conditions
    await this.form.setCheckbox(this.selectors.termsCheckbox, true);
    
    // Newsletter subscription (optional)
    if (userData.newsletter !== undefined) {
      await this.form.setCheckbox(this.selectors.newsletterCheckbox, userData.newsletter);
    }
    
    await this.clickElement(this.selectors.registerButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Register with valid user data from fixtures
   * @param {object} testData - Test data containing user information
   */
  async registerWithValidData(testData) {
    const newUser = testData.testScenarios?.registration?.newUser || {
      firstName: 'Test',
      lastName: 'User',
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      phone: '+1-555-0199'
    };
    
    await this.registerUser(newUser);
  }

  /**
   * Register with missing required fields
   */
  async registerWithMissingFields() {
    // Leave required fields empty and try to submit
    await this.clickElement(this.selectors.registerButton);
  }

  /**
   * Register with invalid email format
   */
  async registerWithInvalidEmail() {
    await this.fillInput(this.selectors.firstNameInput, 'Test');
    await this.fillInput(this.selectors.lastNameInput, 'User');
    await this.fillInput(this.selectors.emailInput, 'invalid-email');
    await this.fillInput(this.selectors.passwordInput, 'SecurePass123!');
    await this.fillInput(this.selectors.confirmPasswordInput, 'SecurePass123!');
    await this.form.setCheckbox(this.selectors.termsCheckbox, true);
    
    await this.clickElement(this.selectors.registerButton);
  }

  /**
   * Register with mismatched passwords
   */
  async registerWithMismatchedPasswords() {
    await this.fillInput(this.selectors.firstNameInput, 'Test');
    await this.fillInput(this.selectors.lastNameInput, 'User');
    await this.fillInput(this.selectors.emailInput, 'test@example.com');
    await this.fillInput(this.selectors.passwordInput, 'SecurePass123!');
    await this.fillInput(this.selectors.confirmPasswordInput, 'DifferentPass456!');
    await this.form.setCheckbox(this.selectors.termsCheckbox, true);
    
    await this.clickElement(this.selectors.registerButton);
  }

  /**
   * Register with weak password
   */
  async registerWithWeakPassword() {
    await this.fillInput(this.selectors.firstNameInput, 'Test');
    await this.fillInput(this.selectors.lastNameInput, 'User');
    await this.fillInput(this.selectors.emailInput, 'test@example.com');
    await this.fillInput(this.selectors.passwordInput, '123');
    await this.fillInput(this.selectors.confirmPasswordInput, '123');
    await this.form.setCheckbox(this.selectors.termsCheckbox, true);
    
    await this.clickElement(this.selectors.registerButton);
  }

  /**
   * Register without accepting terms
   */
  async registerWithoutAcceptingTerms() {
    await this.fillInput(this.selectors.firstNameInput, 'Test');
    await this.fillInput(this.selectors.lastNameInput, 'User');
    await this.fillInput(this.selectors.emailInput, 'test@example.com');
    await this.fillInput(this.selectors.passwordInput, 'SecurePass123!');
    await this.fillInput(this.selectors.confirmPasswordInput, 'SecurePass123!');
    
    // Don't check terms checkbox
    await this.clickElement(this.selectors.registerButton);
  }

  /**
   * Click login link
   */
  async clickLoginLink() {
    await this.clickElement(this.selectors.loginLink);
    await this.waitForPageLoad();
  }

  /**
   * Click terms and conditions link
   */
  async clickTermsLink() {
    await this.clickElement(this.selectors.termsLink);
    await this.waitForPageLoad();
  }

  /**
   * Click privacy policy link
   */
  async clickPrivacyLink() {
    await this.clickElement(this.selectors.privacyLink);
    await this.waitForPageLoad();
  }

  /**
   * Get registration error message
   */
  async getRegistrationError() {
    if (await this.isElementVisible(this.selectors.registrationError)) {
      return await this.getTextContent(this.selectors.registrationError);
    }
    return null;
  }

  /**
   * Get registration success message
   */
  async getRegistrationSuccess() {
    if (await this.isElementVisible(this.selectors.registrationSuccess)) {
      return await this.getTextContent(this.selectors.registrationSuccess);
    }
    return null;
  }

  /**
   * Get password strength indicator
   */
  async getPasswordStrength() {
    if (await this.isElementVisible(this.selectors.passwordStrength)) {
      return await this.getTextContent(this.selectors.passwordStrength);
    }
    return null;
  }

  /**
   * Validate registration page is loaded
   */
  async validateRegistrationPageLoaded() {
    await this.validateElementVisible(this.selectors.pageTitle);
    await this.validateElementVisible(this.selectors.registrationForm);
    await this.validateElementVisible(this.selectors.firstNameInput);
    await this.validateElementVisible(this.selectors.lastNameInput);
    await this.validateElementVisible(this.selectors.emailInput);
    await this.validateElementVisible(this.selectors.passwordInput);
    await this.validateElementVisible(this.selectors.confirmPasswordInput);
    await this.validateElementVisible(this.selectors.registerButton);
  }

  /**
   * Validate successful registration
   */
  async validateSuccessfulRegistration() {
    // Check for success message or redirect
    const currentUrl = await this.getCurrentUrl();
    const hasSuccessMessage = await this.isElementVisible(this.selectors.registrationSuccess);
    
    expect(hasSuccessMessage || !currentUrl.includes('/register')).toBe(true);
  }

  /**
   * Validate registration failure
   * @param {string} expectedError - Expected error message
   */
  async validateRegistrationFailure(expectedError) {
    await this.waitForElement(this.selectors.registrationError);
    const actualError = await this.getRegistrationError();
    
    if (expectedError) {
      expect(actualError).toContain(expectedError);
    }
    
    // Validate still on registration page
    const currentUrl = await this.getCurrentUrl();
    expect(currentUrl).toContain('/register');
  }

  /**
   * Validate required field errors
   */
  async validateRequiredFieldErrors() {
    const requiredFields = [
      { selector: this.selectors.firstNameError, message: 'First name is required' },
      { selector: this.selectors.lastNameError, message: 'Last name is required' },
      { selector: this.selectors.emailError, message: 'Email is required' },
      { selector: this.selectors.passwordError, message: 'Password is required' }
    ];
    
    for (const field of requiredFields) {
      if (await this.isElementVisible(field.selector)) {
        const errorText = await this.getTextContent(field.selector);
        expect(errorText).toContain(field.message);
      }
    }
  }

  /**
   * Validate email format error
   */
  async validateEmailFormatError() {
    await this.waitForElement(this.selectors.emailError);
    const errorText = await this.getTextContent(this.selectors.emailError);
    expect(errorText).toContain('Invalid email format');
  }

  /**
   * Validate password mismatch error
   */
  async validatePasswordMismatchError() {
    await this.waitForElement(this.selectors.confirmPasswordError);
    const errorText = await this.getTextContent(this.selectors.confirmPasswordError);
    expect(errorText).toContain('Passwords do not match');
  }

  /**
   * Validate weak password error
   */
  async validateWeakPasswordError() {
    await this.waitForElement(this.selectors.passwordError);
    const errorText = await this.getTextContent(this.selectors.passwordError);
    expect(errorText).toContain('Password is too weak');
  }

  /**
   * Validate terms acceptance error
   */
  async validateTermsAcceptanceError() {
    await this.waitForElement(this.selectors.termsError);
    const errorText = await this.getTextContent(this.selectors.termsError);
    expect(errorText).toContain('You must accept the terms and conditions');
  }

  /**
   * Test password strength indicator
   */
  async testPasswordStrengthIndicator() {
    // Test weak password
    await this.fillInput(this.selectors.passwordInput, '123');
    await this.page.waitForTimeout(500);
    let strength = await this.getPasswordStrength();
    expect(strength).toContain('Weak');
    
    // Test medium password
    await this.fillInput(this.selectors.passwordInput, 'password123');
    await this.page.waitForTimeout(500);
    strength = await this.getPasswordStrength();
    expect(strength).toContain('Medium');
    
    // Test strong password
    await this.fillInput(this.selectors.passwordInput, 'SecurePass123!');
    await this.page.waitForTimeout(500);
    strength = await this.getPasswordStrength();
    expect(strength).toContain('Strong');
  }

  /**
   * Clear registration form
   */
  async clearRegistrationForm() {
    await this.form.clearForm();
  }

  /**
   * Get current form values
   */
  async getRegistrationFormValues() {
    return {
      firstName: await this.page.inputValue(this.selectors.firstNameInput),
      lastName: await this.page.inputValue(this.selectors.lastNameInput),
      email: await this.page.inputValue(this.selectors.emailInput),
      password: await this.page.inputValue(this.selectors.passwordInput),
      confirmPassword: await this.page.inputValue(this.selectors.confirmPasswordInput),
      phone: await this.page.inputValue(this.selectors.phoneInput),
      terms: await this.page.isChecked(this.selectors.termsCheckbox),
      newsletter: await this.page.isChecked(this.selectors.newsletterCheckbox)
    };
  }

  /**
   * Validate form accessibility
   */
  async validateRegistrationFormAccessibility() {
    const requiredInputs = [
      this.selectors.firstNameInput,
      this.selectors.lastNameInput,
      this.selectors.emailInput,
      this.selectors.passwordInput,
      this.selectors.confirmPasswordInput
    ];
    
    for (const inputSelector of requiredInputs) {
      const input = this.page.locator(inputSelector);
      const hasLabel = await input.getAttribute('aria-label') || 
                      await this.page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0;
      expect(hasLabel).toBeTruthy();
    }
  }
}

module.exports = { RegistrationPage };