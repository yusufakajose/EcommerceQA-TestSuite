/**
 * User Flow Accessibility Tests
 * Tests accessibility compliance for critical user journeys
 */

const { test, expect } = require('@playwright/test');
const AccessibilityTestUtils = require('./utils/AccessibilityTestUtils');

test.describe('User Flow Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure clean state for each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('User Registration Flow Accessibility', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Run initial accessibility scan
    const initialScan = await AccessibilityTestUtils.runAccessibilityScan(page, {
      tags: ['wcag2aa']
    });
    
    expect(initialScan.violations).toEqual([]);
    
    // Test form accessibility
    const formValidation = await AccessibilityTestUtils.validateFormAccessibility(page);
    
    // Verify all form inputs have proper labels
    formValidation.forEach(form => {
      form.inputs.forEach(input => {
        if (input.type !== 'hidden' && input.type !== 'submit') {
          expect(input.hasAccessibleLabel).toBe(true);
        }
      });
      
      // Log any accessibility issues
      if (form.issues.length > 0) {
        console.log('Form accessibility issues:', form.issues);
      }
    });
    
    // Test keyboard navigation through registration form
    const keyboardNav = await AccessibilityTestUtils.testKeyboardNavigation(page, {
      maxTabs: 15
    });
    
    expect(keyboardNav.summary.focusableElements).toBeGreaterThan(0);
    
    // Fill form and test error state accessibility
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('input[name="password"]').fill('123');
    await page.locator('button[type="submit"]').click();
    
    // Wait for validation errors
    await page.waitForTimeout(1000);
    
    // Scan accessibility after error state
    const errorStateScan = await AccessibilityTestUtils.runAccessibilityScan(page, {
      rules: ['aria-valid-attr-value', 'aria-required-attr']
    });
    
    expect(errorStateScan.violations).toEqual([]);
    
    console.log('Registration flow accessibility test completed');
  });

  test('Login Flow Accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Run accessibility scan
    const loginScan = await AccessibilityTestUtils.runAccessibilityScan(page);
    expect(loginScan.violations).toEqual([]);
    
    // Test form accessibility
    const formValidation = await AccessibilityTestUtils.validateFormAccessibility(page);
    
    formValidation.forEach(form => {
      expect(form.issues.length).toBe(0);
    });
    
    // Test keyboard navigation
    const keyboardNav = await AccessibilityTestUtils.testKeyboardNavigation(page, {
      maxTabs: 10
    });
    
    // Verify focus indicators
    const elementsWithFocusIndicator = keyboardNav.focusPath.filter(item => item.hasFocusIndicator);
    const focusIndicatorRatio = elementsWithFocusIndicator.length / keyboardNav.focusPath.length;
    
    expect(focusIndicatorRatio).toBeGreaterThan(0.8); // At least 80% should have focus indicators
    
    // Test login error state
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(1000);
    
    // Check error message accessibility
    const errorElements = await page.locator('.error, [role="alert"], [aria-live]').count();
    
    if (errorElements > 0) {
      const errorScan = await AccessibilityTestUtils.runAccessibilityScan(page, {
        rules: ['aria-valid-attr-value']
      });
      
      expect(errorScan.violations).toEqual([]);
    }
    
    console.log('Login flow accessibility test completed');
  });

  test('Product Browsing Flow Accessibility', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Initial accessibility scan
    const productsScan = await AccessibilityTestUtils.runAccessibilityScan(page);
    expect(productsScan.violations).toEqual([]);
    
    // Test product grid accessibility
    const productImages = await page.locator('.product-item img, [data-testid="product-image"]').all();
    
    for (const image of productImages) {
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText.length).toBeGreaterThan(0);
    }
    
    // Test search functionality accessibility
    const searchInput = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
    
    if (await searchInput.count() > 0) {
      // Check search input has proper label
      const searchInputId = await searchInput.getAttribute('id');
      const hasLabel = await page.locator(`label[for="${searchInputId}"]`).count() > 0;
      const hasAriaLabel = await searchInput.getAttribute('aria-label') !== null;
      
      expect(hasLabel || hasAriaLabel).toBe(true);
      
      // Test search functionality
      await searchInput.fill('laptop');
      await page.keyboard.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(2000);
      
      // Check if search results are announced
      const liveRegions = await page.locator('[aria-live], [role="status"]').count();
      
      if (liveRegions === 0) {
        console.warn('Consider adding aria-live region for search results announcement');
      }
      
      // Scan search results accessibility
      const searchResultsScan = await AccessibilityTestUtils.runAccessibilityScan(page);
      expect(searchResultsScan.violations).toEqual([]);
    }
    
    // Test product filtering accessibility
    const filterElements = await page.locator('select, input[type="checkbox"], input[type="radio"]').all();
    
    for (const filter of filterElements) {
      const filterId = await filter.getAttribute('id');
      const filterName = await filter.getAttribute('name');
      
      if (filterId) {
        const hasLabel = await page.locator(`label[for="${filterId}"]`).count() > 0;
        expect(hasLabel).toBe(true);
      }
    }
    
    console.log('Product browsing flow accessibility test completed');
  });

  test('Shopping Cart Flow Accessibility', async ({ page }) => {
    // First add a product to cart (simulate)
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Try to add product to cart
    const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-testid="add-to-cart"]').first();
    
    if (await addToCartButton.count() > 0) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to cart
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Run accessibility scan
    const cartScan = await AccessibilityTestUtils.runAccessibilityScan(page);
    expect(cartScan.violations).toEqual([]);
    
    // Test cart item controls accessibility
    const quantityInputs = await page.locator('input[type="number"], input[name*="quantity"]').all();
    
    for (const input of quantityInputs) {
      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      
      if (inputId) {
        const hasLabel = await page.locator(`label[for="${inputId}"]`).count() > 0;
        expect(hasLabel || ariaLabel).toBeTruthy();
      }
    }
    
    // Test remove item buttons accessibility
    const removeButtons = await page.locator('button:has-text("Remove"), [data-testid="remove-item"]').all();
    
    for (const button of removeButtons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const buttonText = await button.textContent();
      
      // Button should have descriptive text or aria-label
      expect(ariaLabel || (buttonText && buttonText.trim().length > 0)).toBeTruthy();
    }
    
    // Test keyboard navigation in cart
    const keyboardNav = await AccessibilityTestUtils.testKeyboardNavigation(page, {
      maxTabs: 20
    });
    
    expect(keyboardNav.summary.focusableElements).toBeGreaterThan(0);
    
    console.log('Shopping cart flow accessibility test completed');
  });

  test('Checkout Flow Accessibility', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Run accessibility scan
    const checkoutScan = await AccessibilityTestUtils.runAccessibilityScan(page);
    expect(checkoutScan.violations).toEqual([]);
    
    // Test checkout form accessibility
    const formValidation = await AccessibilityTestUtils.validateFormAccessibility(page);
    
    formValidation.forEach(form => {
      // All form inputs should have accessible labels
      form.inputs.forEach(input => {
        if (input.type !== 'hidden' && input.type !== 'submit') {
          expect(input.hasAccessibleLabel).toBe(true);
        }
      });
      
      // Required fields should be properly marked
      const requiredInputs = form.inputs.filter(input => input.required);
      requiredInputs.forEach(input => {
        // Should have aria-required or visual indicator
        const hasAriaRequired = input.ariaRequired === 'true';
        
        if (!hasAriaRequired) {
          console.warn(`Required field ${input.name} should have aria-required="true"`);
        }
      });
    });
    
    // Test payment form accessibility (if present)
    const paymentInputs = await page.locator('input[name*="card"], input[name*="payment"]').all();
    
    for (const input of paymentInputs) {
      const autocomplete = await input.getAttribute('autocomplete');
      
      // Payment inputs should have appropriate autocomplete attributes
      if (!autocomplete) {
        console.warn('Payment input should have autocomplete attribute for better accessibility');
      }
    }
    
    // Test checkout steps accessibility (if multi-step)
    const stepIndicators = await page.locator('.step, [role="tablist"], .progress-indicator').count();
    
    if (stepIndicators > 0) {
      const stepsScan = await AccessibilityTestUtils.runAccessibilityScan(page, {
        rules: ['aria-current']
      });
      
      expect(stepsScan.violations).toEqual([]);
    }
    
    console.log('Checkout flow accessibility test completed');
  });

  test('Navigation and Menu Accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test main navigation accessibility
    const navScan = await AccessibilityTestUtils.runAccessibilityScan(page, {
      include: ['nav', '[role="navigation"]']
    });
    
    expect(navScan.violations).toEqual([]);
    
    // Test mobile menu accessibility (if present)
    const mobileMenuToggle = page.locator('button[aria-expanded], .menu-toggle, [data-testid="mobile-menu-toggle"]');
    
    if (await mobileMenuToggle.count() > 0) {
      const ariaExpanded = await mobileMenuToggle.getAttribute('aria-expanded');
      expect(ariaExpanded).toBeTruthy();
      
      // Test menu toggle functionality
      await mobileMenuToggle.click();
      await page.waitForTimeout(500);
      
      const expandedState = await mobileMenuToggle.getAttribute('aria-expanded');
      expect(expandedState).toBe('true');
      
      // Scan mobile menu accessibility
      const mobileMenuScan = await AccessibilityTestUtils.runAccessibilityScan(page);
      expect(mobileMenuScan.violations).toEqual([]);
      
      // Test keyboard navigation in mobile menu
      const menuKeyboardNav = await AccessibilityTestUtils.testKeyboardNavigation(page, {
        maxTabs: 15
      });
      
      expect(menuKeyboardNav.summary.focusableElements).toBeGreaterThan(0);
    }
    
    // Test skip links
    const skipLinks = await page.locator('a[href^="#"]').first();
    
    if (await skipLinks.count() > 0) {
      const skipLinkText = await skipLinks.textContent();
      expect(skipLinkText).toContain('skip');
      
      // Test skip link functionality
      await skipLinks.focus();
      await page.keyboard.press('Enter');
      
      // Verify focus moved to target
      const targetId = await skipLinks.getAttribute('href');
      if (targetId) {
        const targetElement = page.locator(targetId.substring(1));
        
        if (await targetElement.count() > 0) {
          const isFocused = await targetElement.evaluate(el => document.activeElement === el);
          expect(isFocused).toBe(true);
        }
      }
    }
    
    console.log('Navigation accessibility test completed');
  });

  test('Dynamic Content and AJAX Accessibility', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Test loading states accessibility
    const searchInput = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('laptop');
      await page.keyboard.press('Enter');
      
      // Check for loading indicators
      const loadingIndicators = await page.locator('.loading, [aria-busy="true"], .spinner').count();
      
      if (loadingIndicators > 0) {
        console.log('Loading indicators found - good for accessibility');
      }
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Check for live regions announcing results
      const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
      
      if (liveRegions === 0) {
        console.warn('Consider adding aria-live regions for dynamic content updates');
      }
      
      // Scan updated content
      const dynamicContentScan = await AccessibilityTestUtils.runAccessibilityScan(page);
      expect(dynamicContentScan.violations).toEqual([]);
    }
    
    // Test infinite scroll or pagination accessibility (if present)
    const paginationElements = await page.locator('.pagination, [role="navigation"][aria-label*="pagination"]').count();
    
    if (paginationElements > 0) {
      const paginationScan = await AccessibilityTestUtils.runAccessibilityScan(page, {
        include: ['.pagination', '[role="navigation"]']
      });
      
      expect(paginationScan.violations).toEqual([]);
    }
    
    console.log('Dynamic content accessibility test completed');
  });

  test('Error Handling and Feedback Accessibility', async ({ page }) => {
    // Test form validation errors
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Submit form with invalid data to trigger errors
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('input[name="password"]').fill('123');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(1000);
    
    // Check error message accessibility
    const errorMessages = await page.locator('.error, [role="alert"], [aria-invalid="true"]').all();
    
    for (const error of errorMessages) {
      const role = await error.getAttribute('role');
      const ariaLive = await error.getAttribute('aria-live');
      const ariaInvalid = await error.getAttribute('aria-invalid');
      
      // Error should be announced to screen readers
      const isAccessible = role === 'alert' || ariaLive || ariaInvalid === 'true';
      
      if (!isAccessible) {
        console.warn('Error message may not be accessible to screen readers');
      }
    }
    
    // Test success messages (simulate successful form submission)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to trigger success message
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(2000);
    
    // Check for success messages
    const successMessages = await page.locator('.success, [role="status"], .alert-success').count();
    
    if (successMessages > 0) {
      console.log('Success messages found - verify they are accessible');
    }
    
    // Scan final state
    const errorHandlingScan = await AccessibilityTestUtils.runAccessibilityScan(page);
    expect(errorHandlingScan.violations).toEqual([]);
    
    console.log('Error handling accessibility test completed');
  });
});

// Generate accessibility summary after all tests
test.afterAll(async () => {
  console.log('\\n=== User Flow Accessibility Testing Summary ===');
  console.log('✓ User Registration Flow');
  console.log('✓ Login Flow');
  console.log('✓ Product Browsing Flow');
  console.log('✓ Shopping Cart Flow');
  console.log('✓ Checkout Flow');
  console.log('✓ Navigation and Menu');
  console.log('✓ Dynamic Content and AJAX');
  console.log('✓ Error Handling and Feedback');
  console.log('\\nAll critical user flows tested for accessibility compliance.');
  console.log('Review test output for specific recommendations and improvements.');
});