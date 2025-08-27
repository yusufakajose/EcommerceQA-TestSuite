/**
 * User Registration Test Suite
 * Comprehensive tests for user registration functionality including positive and negative scenarios
 */

const { test, expect } = require('@playwright/test');
const RegistrationPage = require('./pages/RegistrationPage');
const LoginPage = require('./pages/LoginPage');
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

test.describe('User Registration Tests', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('UserRegistration');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ page }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Positive Registration Scenarios', () => {
    test('should successfully register a new user with valid data', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();

      // Verify successful registration
      await expect(registrationPage.getSuccessMessage()).toBeVisible();
      await expect(registrationPage.getSuccessMessage()).toContainText('Registration successful');

      // Verify user is redirected to appropriate page
      await expect(page).toHaveURL(/.*\/dashboard|.*\/profile|.*\/welcome/);
    });

    test('should register user with minimal required fields only', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user', {
        // Only include required fields
        firstName: 'MinimalUser',
        lastName: 'Test',
        email: testDataHelper.dataGenerator.generateUniqueEmail(),
        password: 'MinimalPass123!',
        phone: testDataHelper.dataGenerator.generatePhoneNumber(),
      });

      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRequiredFields(userData);
      await registrationPage.submitForm();

      await expect(registrationPage.getSuccessMessage()).toBeVisible();
    });

    test('should register user with all optional fields filled', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user', {
        preferences: {
          newsletter: true,
          notifications: true,
        },
      });

      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.fillOptionalFields(userData);
      await registrationPage.submitForm();

      await expect(registrationPage.getSuccessMessage()).toBeVisible();
    });

    test('should handle special characters in name fields', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user', {
        firstName: 'Jean-Pierre',
        lastName: "O'Connor-Smith",
      });

      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();

      await expect(registrationPage.getSuccessMessage()).toBeVisible();
    });

    test('should register user with international phone number', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user', {
        phone: '+44 20 7946 0958', // UK phone number
      });

      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();

      await expect(registrationPage.getSuccessMessage()).toBeVisible();
    });
  });

  test.describe('Negative Registration Scenarios', () => {
    test('should show validation errors for empty required fields', async ({ page }) => {
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.submitForm();

      // Verify validation errors are displayed
      await expect(registrationPage.getFieldError('firstName')).toBeVisible();
      await expect(registrationPage.getFieldError('firstName')).toContainText(
        'First name is required'
      );

      await expect(registrationPage.getFieldError('lastName')).toBeVisible();
      await expect(registrationPage.getFieldError('lastName')).toContainText(
        'Last name is required'
      );

      await expect(registrationPage.getFieldError('email')).toBeVisible();
      await expect(registrationPage.getFieldError('email')).toContainText('Email is required');

      await expect(registrationPage.getFieldError('password')).toBeVisible();
      await expect(registrationPage.getFieldError('password')).toContainText(
        'Password is required'
      );
    });

    test('should show error for invalid email format', async ({ page }) => {
      const invalidUser = testDataHelper.getUserData('invalid', 0);
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillField('email', invalidUser.email);
      await registrationPage.submitForm();

      await expect(registrationPage.getFieldError('email')).toBeVisible();
      await expect(registrationPage.getFieldError('email')).toContainText(
        'Please enter a valid email address'
      );
    });

    test('should show error for weak password', async ({ page }) => {
      const invalidUser = testDataHelper.getUserData('invalid', 0);
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillField('password', invalidUser.password);
      await registrationPage.submitForm();

      await expect(registrationPage.getFieldError('password')).toBeVisible();
      await expect(registrationPage.getFieldError('password')).toContainText(
        /Password must be at least 8 characters|Password is too weak/
      );
    });

    test('should show error for mismatched password confirmation', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user');
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.fillField('confirmPassword', 'DifferentPassword123!');
      await registrationPage.submitForm();

      await expect(registrationPage.getFieldError('confirmPassword')).toBeVisible();
      await expect(registrationPage.getFieldError('confirmPassword')).toContainText(
        'Passwords do not match'
      );
    });

    test('should show error for existing email address', async ({ page }) => {
      const existingUser = testDataHelper.getUserData('existing', 0);
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(existingUser);
      await registrationPage.submitForm();

      await expect(registrationPage.getErrorMessage()).toBeVisible();
      await expect(registrationPage.getErrorMessage()).toContainText(
        'Email address already exists'
      );
    });

    test('should show error for invalid phone number format', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user', {
        phone: '123', // Invalid phone number
      });
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();

      await expect(registrationPage.getFieldError('phone')).toBeVisible();
      await expect(registrationPage.getFieldError('phone')).toContainText(
        'Please enter a valid phone number'
      );
    });

    test('should show error for names that are too long', async ({ page }) => {
      const invalidUser = testDataHelper.getUserData('invalid', 2); // Long names user
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillField('firstName', invalidUser.firstName);
      await registrationPage.fillField('lastName', invalidUser.lastName);
      await registrationPage.submitForm();

      await expect(registrationPage.getFieldError('firstName')).toBeVisible();
      await expect(registrationPage.getFieldError('firstName')).toContainText(
        /too long|maximum length/
      );

      await expect(registrationPage.getFieldError('lastName')).toBeVisible();
      await expect(registrationPage.getFieldError('lastName')).toContainText(
        /too long|maximum length/
      );
    });

    test('should prevent registration with malicious input (XSS)', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user', {
        firstName: '<script>alert("XSS")</script>',
        lastName: '<img src="x" onerror="alert(1)">',
      });
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();

      // Should either show validation error or sanitize input
      const hasError = await registrationPage
        .getFieldError('firstName')
        .isVisible()
        .catch(() => false);
      if (!hasError) {
        // If no error, verify the script tags are not executed
        const alertDialogs = [];
        page.on('dialog', (dialog) => {
          alertDialogs.push(dialog);
          dialog.dismiss();
        });

        // Wait a moment to see if any alerts fire
        await page.waitForTimeout(1000);
        expect(alertDialogs).toHaveLength(0);
      }
    });
  });

  test.describe('Registration Form Validation', () => {
    test('should show real-time validation for email field', async ({ page }) => {
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();

      // Type invalid email
      await registrationPage.fillField('email', 'invalid-email');
      await registrationPage.getField('firstName').click(); // Trigger blur event

      await expect(registrationPage.getFieldError('email')).toBeVisible();

      // Correct the email
      await registrationPage.fillField('email', 'valid@example.com');
      await registrationPage.getField('firstName').click();

      await expect(registrationPage.getFieldError('email')).not.toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();

      // Test weak password
      await registrationPage.fillField('password', '123');
      await expect(registrationPage.getPasswordStrengthIndicator()).toContainText(/weak/i);

      // Test medium password
      await registrationPage.fillField('password', 'Password123');
      await expect(registrationPage.getPasswordStrengthIndicator()).toContainText(/medium/i);

      // Test strong password
      await registrationPage.fillField('password', 'StrongPassword123!');
      await expect(registrationPage.getPasswordStrengthIndicator()).toContainText(/strong/i);
    });

    test('should toggle password visibility', async ({ page }) => {
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillField('password', 'TestPassword123!');

      // Initially password should be hidden
      await expect(registrationPage.getField('password')).toHaveAttribute('type', 'password');

      // Click toggle to show password
      await registrationPage.togglePasswordVisibility();
      await expect(registrationPage.getField('password')).toHaveAttribute('type', 'text');

      // Click toggle to hide password again
      await registrationPage.togglePasswordVisibility();
      await expect(registrationPage.getField('password')).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Registration Flow Integration', () => {
    test('should redirect to login page after successful registration', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user');
      const registrationPage = new RegistrationPage(page);

      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();

      // Wait for success message
      await expect(registrationPage.getSuccessMessage()).toBeVisible();

      // Click continue or wait for auto-redirect
      const continueButton = registrationPage.getContinueButton();
      if (await continueButton.isVisible()) {
        await continueButton.click();
      }

      // Should be redirected to login or dashboard
      await expect(page).toHaveURL(/.*\/login|.*\/dashboard/);
    });

    test('should allow user to login immediately after registration', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user');
      const registrationPage = new RegistrationPage(page);
      const loginPage = new LoginPage(page);

      // Register new user
      await registrationPage.navigate();
      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();
      await expect(registrationPage.getSuccessMessage()).toBeVisible();

      // Navigate to login page
      await loginPage.navigate();

      // Login with the same credentials
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();

      // Should be successfully logged in
      await expect(page).toHaveURL(/.*\/dashboard|.*\/profile/);
    });

    test('should handle registration during checkout flow', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user');
      const registrationPage = new RegistrationPage(page);

      // Simulate coming from checkout
      await page.goto('/checkout');
      await page.click('text=Create Account'); // Assuming there's a create account option

      await registrationPage.fillRegistrationForm(userData);
      await registrationPage.submitForm();

      // Should return to checkout after registration
      await expect(page).toHaveURL(/.*\/checkout/);
    });
  });
});
