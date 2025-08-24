/**
 * Login Page Object
 * Handles login functionality and validation
 */

const { BasePage } = require('./BasePage');
const { FormComponent } = require('../components/FormComponent');
const { NavigationComponent } = require('../components/NavigationComponent');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.form = new FormComponent(page);
    this.navigation = new NavigationComponent(page);
    
    // Page URL - Magento login page
    this.url = '/customer/account/login';
    
    // Page selectors - Magento actual elements
    this.selectors = {
      // Form elements
      emailInput: '#email',
      passwordInput: '#pass',
      loginButton: '#send2',
      rememberMeCheckbox: '#remember_me',
      
      // Links
      forgotPasswordLink: '.action.remind',
      registerLink: '.action.create.primary',
      
      // Messages
      loginError: '.message-error',
      loginSuccess: '.message-success',
      
      // Social login (if available)
      googleLoginButton: '[data-testid="google-login"]',
      facebookLoginButton: '[data-testid="facebook-login"]',
      
      // Page elements
      pageTitle: '.page-title',
      loginForm: '#login-form'
    };
  }

  /**
   * Navigate to login page
   */
  async navigateToLoginPage() {
    await this.navigateTo(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Whether to check remember me
   */
  async login(email, password, rememberMe = false) {
    await this.fillInput(this.selectors.emailInput, email);
    await this.fillInput(this.selectors.passwordInput, password);
    
    if (rememberMe) {
      await this.form.setCheckbox(this.selectors.rememberMeCheckbox, true);
    }
    
    await this.clickElement(this.selectors.loginButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Login with valid credentials
   * @param {object} userData - User data from fixtures
   */
  async loginWithValidCredentials(userData) {
    const user = userData.validUsers?.[0] || {
      email: 'test@example.com',
      password: 'password123'
    };
    
    await this.login(user.email, user.password);
  }

  /**
   * Login with invalid credentials
   * @param {string} email - Invalid email
   * @param {string} password - Invalid password
   */
  async loginWithInvalidCredentials(email = 'invalid@example.com', password = 'wrongpassword') {
    await this.login(email, password);
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.clickElement(this.selectors.forgotPasswordLink);
    await this.waitForPageLoad();
  }

  /**
   * Click register link
   */
  async clickRegisterLink() {
    await this.clickElement(this.selectors.registerLink);
    await this.waitForPageLoad();
  }

  /**
   * Login with Google
   */
  async loginWithGoogle() {
    await this.clickElement(this.selectors.googleLoginButton);
    // Note: In real tests, you'd handle OAuth flow
    await this.waitForNetworkIdle();
  }

  /**
   * Login with Facebook
   */
  async loginWithFacebook() {
    await this.clickElement(this.selectors.facebookLoginButton);
    // Note: In real tests, you'd handle OAuth flow
    await this.waitForNetworkIdle();
  }

  /**
   * Get login error message
   */
  async getLoginError() {
    if (await this.isElementVisible(this.selectors.loginError)) {
      return await this.getTextContent(this.selectors.loginError);
    }
    return null;
  }

  /**
   * Get login success message
   */
  async getLoginSuccess() {
    if (await this.isElementVisible(this.selectors.loginSuccess)) {
      return await this.getTextContent(this.selectors.loginSuccess);
    }
    return null;
  }

  /**
   * Validate login page is loaded
   */
  async validateLoginPageLoaded() {
    await this.validateElementVisible(this.selectors.pageTitle);
    await this.validateElementVisible(this.selectors.loginForm);
    await this.validateElementVisible(this.selectors.emailInput);
    await this.validateElementVisible(this.selectors.passwordInput);
    await this.validateElementVisible(this.selectors.loginButton);
  }

  /**
   * Validate successful login
   */
  async validateSuccessfulLogin() {
    // Check if redirected to dashboard/home page
    const currentUrl = await this.getCurrentUrl();
    expect(currentUrl).not.toContain('/login');
    
    // Validate user is logged in via navigation
    await this.navigation.validateUserLoggedIn();
  }

  /**
   * Validate login failure
   * @param {string} expectedError - Expected error message
   */
  async validateLoginFailure(expectedError) {
    await this.waitForElement(this.selectors.loginError);
    const actualError = await this.getLoginError();
    
    if (expectedError) {
      expect(actualError).toContain(expectedError);
    }
    
    // Validate still on login page
    const currentUrl = await this.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  }

  /**
   * Validate empty email error
   */
  async validateEmptyEmailError() {
    await this.form.validateFieldError('email', 'Email is required');
  }

  /**
   * Validate empty password error
   */
  async validateEmptyPasswordError() {
    await this.form.validateFieldError('password', 'Password is required');
  }

  /**
   * Validate invalid email format error
   */
  async validateInvalidEmailFormatError() {
    await this.form.validateFieldError('email', 'Invalid email format');
  }

  /**
   * Test login with empty fields
   */
  async testEmptyFieldsValidation() {
    await this.clickElement(this.selectors.loginButton);
    
    // Validate both email and password errors appear
    await this.validateEmptyEmailError();
    await this.validateEmptyPasswordError();
  }

  /**
   * Test login with invalid email format
   */
  async testInvalidEmailFormat() {
    await this.fillInput(this.selectors.emailInput, 'invalid-email');
    await this.fillInput(this.selectors.passwordInput, 'password123');
    await this.clickElement(this.selectors.loginButton);
    
    await this.validateInvalidEmailFormatError();
  }

  /**
   * Test remember me functionality
   */
  async testRememberMeFunctionality() {
    await this.form.setCheckbox(this.selectors.rememberMeCheckbox, true);
    
    // Validate checkbox is checked
    const isChecked = await this.page.isChecked(this.selectors.rememberMeCheckbox);
    expect(isChecked).toBe(true);
  }

  /**
   * Validate social login buttons are present
   */
  async validateSocialLoginOptions() {
    await this.validateElementVisible(this.selectors.googleLoginButton);
    await this.validateElementVisible(this.selectors.facebookLoginButton);
  }

  /**
   * Validate forgot password link is present
   */
  async validateForgotPasswordLink() {
    await this.validateElementVisible(this.selectors.forgotPasswordLink);
  }

  /**
   * Validate register link is present
   */
  async validateRegisterLink() {
    await this.validateElementVisible(this.selectors.registerLink);
  }

  /**
   * Clear login form
   */
  async clearLoginForm() {
    await this.fillInput(this.selectors.emailInput, '');
    await this.fillInput(this.selectors.passwordInput, '');
    await this.form.setCheckbox(this.selectors.rememberMeCheckbox, false);
  }

  /**
   * Get current form values
   */
  async getLoginFormValues() {
    return {
      email: await this.page.inputValue(this.selectors.emailInput),
      password: await this.page.inputValue(this.selectors.passwordInput),
      rememberMe: await this.page.isChecked(this.selectors.rememberMeCheckbox)
    };
  }

  /**
   * Validate login form accessibility
   */
  async validateLoginFormAccessibility() {
    // Check for proper labels and ARIA attributes
    const emailInput = this.page.locator(this.selectors.emailInput);
    const passwordInput = this.page.locator(this.selectors.passwordInput);
    
    // Validate inputs have labels or aria-label
    const emailLabel = await emailInput.getAttribute('aria-label') || 
                      await this.page.locator(`label[for="${await emailInput.getAttribute('id')}"]`).textContent();
    const passwordLabel = await passwordInput.getAttribute('aria-label') || 
                         await this.page.locator(`label[for="${await passwordInput.getAttribute('id')}"]`).textContent();
    
    expect(emailLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();
  }
}

module.exports = { LoginPage };