/**
 * Authentication Test Suite
 * Comprehensive tests for login/logout functionality including edge cases
 */

const { test, expect } = require('@playwright/test');
const LoginPage = require('./pages/LoginPage');
const NavigationComponent = require('./components/NavigationComponent');
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

test.describe('Authentication Tests', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('Authentication');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ page }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Login Functionality', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      const navigation = new NavigationComponent(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      
      // Verify successful login
      await expect(page).toHaveURL(/.*\/dashboard|.*\/profile|.*\/home/);
      await expect(navigation.getUserMenu()).toBeVisible();
      await expect(navigation.getLogoutButton()).toBeVisible();
    });

    test('should remember user session after page refresh', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 1);
      const loginPage = new LoginPage(page);
      const navigation = new NavigationComponent(page);
      
      // Login
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      await expect(navigation.getUserMenu()).toBeVisible();
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(navigation.getUserMenu()).toBeVisible();
      await expect(page).not.toHaveURL(/.*\/login/);
    });

    test('should login with remember me option', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 2);
      const loginPage = new LoginPage(page);
      const navigation = new NavigationComponent(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.checkRememberMe();
      await loginPage.submitForm();
      
      await expect(navigation.getUserMenu()).toBeVisible();
      
      // Close and reopen browser (simulate new session)
      await page.context().close();
      const newContext = await page.context().browser().newContext();
      const newPage = await newContext.newPage();
      
      await newPage.goto('/dashboard');
      const newNavigation = new NavigationComponent(newPage);
      
      // Should still be logged in due to remember me
      await expect(newNavigation.getUserMenu()).toBeVisible();
      
      await newContext.close();
    });

    test('should handle case-insensitive email login', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      const navigation = new NavigationComponent(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email.toUpperCase(), userData.password);
      await loginPage.submitForm();
      
      await expect(navigation.getUserMenu()).toBeVisible();
    });

    test('should show loading state during login', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      
      // Click submit and immediately check for loading state
      await loginPage.getSubmitButton().click();
      await expect(loginPage.getLoadingIndicator()).toBeVisible();
      
      // Loading should disappear after login completes
      await expect(loginPage.getLoadingIndicator()).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Login Validation and Error Handling', () => {
    test('should show error for invalid email format', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm('invalid-email', 'password123');
      await loginPage.submitForm();
      
      await expect(loginPage.getFieldError('email')).toBeVisible();
      await expect(loginPage.getFieldError('email')).toContainText('Please enter a valid email address');
    });

    test('should show error for empty credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.submitForm();
      
      await expect(loginPage.getFieldError('email')).toBeVisible();
      await expect(loginPage.getFieldError('email')).toContainText('Email is required');
      
      await expect(loginPage.getFieldError('password')).toBeVisible();
      await expect(loginPage.getFieldError('password')).toContainText('Password is required');
    });

    test('should show error for incorrect credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm('nonexistent@example.com', 'wrongpassword');
      await loginPage.submitForm();
      
      await expect(loginPage.getErrorMessage()).toBeVisible();
      await expect(loginPage.getErrorMessage()).toContainText(/Invalid credentials|Login failed|Incorrect email or password/);
    });

    test('should show error for correct email but wrong password', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, 'wrongpassword123');
      await loginPage.submitForm();
      
      await expect(loginPage.getErrorMessage()).toBeVisible();
      await expect(loginPage.getErrorMessage()).toContainText(/Invalid credentials|Incorrect password/);
    });

    test('should handle account lockout after multiple failed attempts', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      
      // Attempt login with wrong password multiple times
      for (let i = 0; i < 5; i++) {
        await loginPage.fillLoginForm(userData.email, 'wrongpassword');
        await loginPage.submitForm();
        await expect(loginPage.getErrorMessage()).toBeVisible();
        await page.waitForTimeout(1000); // Brief pause between attempts
      }
      
      // After multiple failed attempts, account should be locked
      await loginPage.fillLoginForm(userData.email, userData.password); // Correct password
      await loginPage.submitForm();
      
      await expect(loginPage.getErrorMessage()).toBeVisible();
      await expect(loginPage.getErrorMessage()).toContainText(/Account locked|Too many failed attempts|Account temporarily disabled/);
    });

    test('should prevent SQL injection attacks', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm("admin'; DROP TABLE users; --", "password");
      await loginPage.submitForm();
      
      // Should show normal login error, not crash or succeed
      await expect(loginPage.getErrorMessage()).toBeVisible();
      await expect(loginPage.getErrorMessage()).toContainText(/Invalid credentials|Login failed/);
    });

    test('should handle special characters in password', async ({ page }) => {
      const userData = testDataHelper.generateUniqueData('user', {
        password: 'P@$$w0rd!@#$%^&*()_+-=[]{}|;:,.<>?'
      });
      const loginPage = new LoginPage(page);
      
      // First register user with special character password (assuming registration works)
      // Then test login
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      
      // Should handle special characters properly
      const hasError = await loginPage.getErrorMessage().isVisible().catch(() => false);
      if (hasError) {
        // If error, it should be about credentials, not about special characters
        await expect(loginPage.getErrorMessage()).not.toContainText(/Invalid characters|Special characters not allowed/);
      }
    });
  });

  test.describe('Logout Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each logout test
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      
      const navigation = new NavigationComponent(page);
      await expect(navigation.getUserMenu()).toBeVisible();
    });

    test('should successfully logout user', async ({ page }) => {
      const navigation = new NavigationComponent(page);
      const loginPage = new LoginPage(page);
      
      await navigation.logout();
      
      // Should be redirected to login page or home page
      await expect(page).toHaveURL(/.*\/login|.*\/home|.*\/$/);
      
      // User menu should not be visible
      await expect(navigation.getUserMenu()).not.toBeVisible();
      
      // Login form should be visible if on login page
      if (page.url().includes('/login')) {
        await expect(loginPage.getEmailField()).toBeVisible();
      }
    });

    test('should clear session data on logout', async ({ page }) => {
      const navigation = new NavigationComponent(page);
      
      await navigation.logout();
      
      // Try to access protected page
      await page.goto('/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*\/login/);
    });

    test('should handle logout from multiple tabs', async ({ page, context }) => {
      const navigation = new NavigationComponent(page);
      
      // Open second tab
      const secondPage = await context.newPage();
      await secondPage.goto('/dashboard');
      const secondNavigation = new NavigationComponent(secondPage);
      await expect(secondNavigation.getUserMenu()).toBeVisible();
      
      // Logout from first tab
      await navigation.logout();
      
      // Refresh second tab - should also be logged out
      await secondPage.reload();
      await expect(secondPage).toHaveURL(/.*\/login/);
      
      await secondPage.close();
    });

    test('should show confirmation dialog for logout', async ({ page }) => {
      const navigation = new NavigationComponent(page);
      
      // Set up dialog handler
      let dialogShown = false;
      page.on('dialog', async dialog => {
        dialogShown = true;
        expect(dialog.message()).toContain(/Are you sure|Confirm logout|Log out/);
        await dialog.accept();
      });
      
      await navigation.clickLogoutButton();
      
      if (dialogShown) {
        // If confirmation dialog was shown, verify logout completed
        await expect(page).toHaveURL(/.*\/login|.*\/home/);
      }
    });
  });

  test.describe('Session Management', () => {
    test('should handle session timeout', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      const navigation = new NavigationComponent(page);
      
      // Login
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      await expect(navigation.getUserMenu()).toBeVisible();
      
      // Simulate session timeout by manipulating session storage/cookies
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Clear auth cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      });
      
      // Try to access protected resource
      await page.goto('/dashboard');
      
      // Should be redirected to login due to expired session
      await expect(page).toHaveURL(/.*\/login/);
    });

    test('should extend session on user activity', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      const navigation = new NavigationComponent(page);
      
      // Login
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      await expect(navigation.getUserMenu()).toBeVisible();
      
      // Simulate user activity
      await page.click('body');
      await page.keyboard.press('Space');
      await page.mouse.move(100, 100);
      
      // Wait a bit and verify session is still active
      await page.waitForTimeout(2000);
      await page.reload();
      
      await expect(navigation.getUserMenu()).toBeVisible();
    });

    test('should handle concurrent login sessions', async ({ page, context }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      
      // Login in first tab
      await loginPage.navigate();
      await loginPage.fillLoginForm(userData.email, userData.password);
      await loginPage.submitForm();
      
      const navigation = new NavigationComponent(page);
      await expect(navigation.getUserMenu()).toBeVisible();
      
      // Login with same credentials in second tab
      const secondPage = await context.newPage();
      const secondLoginPage = new LoginPage(secondPage);
      
      await secondLoginPage.navigate();
      await secondLoginPage.fillLoginForm(userData.email, userData.password);
      await secondLoginPage.submitForm();
      
      const secondNavigation = new NavigationComponent(secondPage);
      await expect(secondNavigation.getUserMenu()).toBeVisible();
      
      // Both sessions should be active (or handle according to business rules)
      await page.reload();
      await secondPage.reload();
      
      // Verify behavior based on system requirements
      // Either both should remain logged in, or first session should be invalidated
      const firstTabLoggedIn = await navigation.getUserMenu().isVisible().catch(() => false);
      const secondTabLoggedIn = await secondNavigation.getUserMenu().isVisible().catch(() => false);
      
      // At least one should be logged in
      expect(firstTabLoggedIn || secondTabLoggedIn).toBe(true);
      
      await secondPage.close();
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.clickForgotPasswordLink();
      
      await expect(page).toHaveURL(/.*\/forgot-password|.*\/reset-password/);
    });

    test('should send password reset email', async ({ page }) => {
      const userData = testDataHelper.getUserData('valid', 0);
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.clickForgotPasswordLink();
      
      // Fill email and submit
      await page.fill('[data-testid="email"], #email, input[type="email"]', userData.email);
      await page.click('[data-testid="submit"], button[type="submit"], .submit-button');
      
      // Should show success message
      await expect(page.locator('text=Email sent, text=Check your email, text=Reset link sent')).toBeVisible();
    });

    test('should show error for non-existent email in password reset', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      await loginPage.clickForgotPasswordLink();
      
      await page.fill('[data-testid="email"], #email, input[type="email"]', 'nonexistent@example.com');
      await page.click('[data-testid="submit"], button[type="submit"], .submit-button');
      
      await expect(page.locator('text=Email not found, text=Account does not exist, text=Invalid email')).toBeVisible();
    });
  });

  test.describe('Social Login Integration', () => {
    test('should display social login options', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      
      // Check for social login buttons (if implemented)
      const socialButtons = page.locator('[data-testid*="social"], .social-login, .oauth-button');
      const socialButtonCount = await socialButtons.count();
      
      if (socialButtonCount > 0) {
        await expect(socialButtons.first()).toBeVisible();
      }
    });

    test('should handle Google login redirect', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.navigate();
      
      const googleButton = page.locator('[data-testid="google-login"], .google-login, text=Continue with Google');
      
      if (await googleButton.isVisible()) {
        // Set up navigation handler
        const [popup] = await Promise.all([
          page.waitForEvent('popup'),
          googleButton.click()
        ]);
        
        // Verify popup opens to Google OAuth
        await expect(popup).toHaveURL(/accounts\.google\.com|oauth\.google\.com/);
        await popup.close();
      }
    });
  });
});