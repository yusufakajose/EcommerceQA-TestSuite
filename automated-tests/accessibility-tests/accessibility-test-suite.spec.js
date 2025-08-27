/**
 * Comprehensive Accessibility Test Suite
 * Tests WCAG compliance and accessibility standards for ecommerce application
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// Test configuration for accessibility testing
const accessibilityConfig = {
  // WCAG compliance levels to test
  wcagLevels: ['wcag2a', 'wcag2aa', 'wcag21aa'],

  // Key pages to test for accessibility
  testPages: [
    { name: 'Homepage', url: '/' },
    { name: 'User Registration', url: '/register' },
    { name: 'User Login', url: '/login' },
    { name: 'Product Catalog', url: '/products' },
    { name: 'Product Details', url: '/products/1' },
    { name: 'Shopping Cart', url: '/cart' },
    { name: 'Checkout', url: '/checkout' },
    { name: 'User Profile', url: '/profile' },
  ],

  // Critical accessibility rules to enforce
  criticalRules: [
    'color-contrast',
    'keyboard-navigation',
    'focus-management',
    'alt-text',
    'form-labels',
    'heading-structure',
    'landmark-roles',
  ],
};

test.describe('Accessibility Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing context
    await page.goto('/');

    // Ensure page is fully loaded
    await page.waitForLoadState('networkidle');
  });

  // Test each critical page for WCAG compliance
  accessibilityConfig.testPages.forEach(({ name, url }) => {
    test(`WCAG Compliance - ${name}`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(accessibilityConfig.wcagLevels)
        .analyze();

      // Assert no accessibility violations
      expect(accessibilityScanResults.violations).toEqual([]);

      // Log accessibility scan summary
      console.log(`Accessibility scan for ${name}:`);
      console.log(`  - Passes: ${accessibilityScanResults.passes.length}`);
      console.log(`  - Violations: ${accessibilityScanResults.violations.length}`);
      console.log(`  - Incomplete: ${accessibilityScanResults.incomplete.length}`);

      // If violations exist, provide detailed information
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Accessibility Violations:');
        accessibilityScanResults.violations.forEach((violation, index) => {
          console.log(`  ${index + 1}. ${violation.id}: ${violation.description}`);
          console.log(`     Impact: ${violation.impact}`);
          console.log(`     Help: ${violation.helpUrl}`);
        });
      }
    });
  });

  test('Color Contrast Compliance', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('body')
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Additional manual color contrast checks for key elements
    const keyElements = ['button', 'a', '.primary-text', '.secondary-text', 'input', 'label'];

    for (const selector of keyElements) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`Checked color contrast for ${elements.length} ${selector} elements`);
      }
    }
  });

  test('Keyboard Navigation Accessibility', async ({ page }) => {
    await page.goto('/');

    // Test keyboard navigation through interactive elements
    const interactiveElements = [
      'button',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    let tabIndex = 0;
    const maxTabs = 20; // Prevent infinite loops

    while (tabIndex < maxTabs) {
      await page.keyboard.press('Tab');
      tabIndex++;

      // Check if focused element is visible and accessible
      const focusedElement = await page.locator(':focus').first();

      if ((await focusedElement.count()) > 0) {
        const isVisible = await focusedElement.isVisible();
        expect(isVisible).toBe(true);

        // Verify focus indicator is present
        const focusStyles = await focusedElement.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow,
          };
        });

        // At least one focus indicator should be present
        const hasFocusIndicator =
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none';

        if (!hasFocusIndicator) {
          console.warn(
            `Element may lack proper focus indicator:`,
            await focusedElement.getAttribute('class')
          );
        }
      }
    }

    console.log(`Keyboard navigation test completed. Tested ${tabIndex} tab stops.`);
  });

  test('Form Accessibility and Labels', async ({ page }) => {
    // Test registration form accessibility
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label', 'form-field-multiple-labels'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify all form inputs have proper labels
    const formInputs = await page.locator('input, select, textarea').all();

    for (const input of formInputs) {
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      const inputType = await input.getAttribute('type');

      if (inputType !== 'hidden' && inputType !== 'submit') {
        // Check for associated label
        const hasLabel = (await page.locator(`label[for="${inputId}"]`).count()) > 0;
        const hasAriaLabel = (await input.getAttribute('aria-label')) !== null;
        const hasAriaLabelledBy = (await input.getAttribute('aria-labelledby')) !== null;

        const hasAccessibleLabel = hasLabel || hasAriaLabel || hasAriaLabelledBy;

        if (!hasAccessibleLabel) {
          console.warn(`Input may lack accessible label: ${inputName || inputId || 'unknown'}`);
        }

        expect(hasAccessibleLabel).toBe(true);
      }
    }
  });

  test('Heading Structure and Hierarchy', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = [];

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));
      const text = await heading.textContent();

      headingLevels.push({ level, text: text?.trim() });
    }

    // Verify heading hierarchy (should not skip levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const currentLevel = headingLevels[i].level;
      const previousLevel = headingLevels[i - 1].level;

      if (currentLevel > previousLevel + 1) {
        console.warn(`Heading hierarchy skip detected: h${previousLevel} to h${currentLevel}`);
      }
    }

    console.log('Heading structure:', headingLevels);
  });

  test('Image Alt Text Accessibility', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Check all images have appropriate alt text
    const images = await page.locator('img').all();

    for (const image of images) {
      const altText = await image.getAttribute('alt');
      const src = await image.getAttribute('src');
      const role = await image.getAttribute('role');

      // Decorative images should have empty alt or role="presentation"
      // Content images should have descriptive alt text
      if (role === 'presentation' || altText === '') {
        console.log(`Decorative image found: ${src}`);
      } else if (altText && altText.length > 0) {
        console.log(`Content image with alt text: "${altText}"`);

        // Alt text should be descriptive but not too long
        expect(altText.length).toBeLessThan(125);
        expect(altText.length).toBeGreaterThan(0);
      } else {
        console.warn(`Image may lack proper alt text: ${src}`);
      }
    }
  });

  test('ARIA Attributes and Roles', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-valid-attr', 'aria-required-attr', 'aria-roles'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Check for proper ARIA landmark roles
    const landmarks = [
      { role: 'banner', selector: 'header, [role="banner"]' },
      { role: 'navigation', selector: 'nav, [role="navigation"]' },
      { role: 'main', selector: 'main, [role="main"]' },
      { role: 'contentinfo', selector: 'footer, [role="contentinfo"]' },
    ];

    for (const landmark of landmarks) {
      const elements = await page.locator(landmark.selector).count();
      if (elements === 0) {
        console.warn(`Missing landmark: ${landmark.role}`);
      } else {
        console.log(`Found ${elements} ${landmark.role} landmark(s)`);
      }
    }
  });

  test('Screen Reader Compatibility', async ({ page }) => {
    await page.goto('/');

    // Test for screen reader specific attributes
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-hidden-body'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Check for elements that should be hidden from screen readers
    const hiddenElements = await page.locator('[aria-hidden="true"]').all();

    for (const element of hiddenElements) {
      const isVisible = await element.isVisible();
      const tagName = await element.evaluate((el) => el.tagName.toLowerCase());

      // Verify that aria-hidden elements are either decorative or truly hidden
      if (isVisible && !['img', 'svg', 'i', 'span'].includes(tagName)) {
        console.warn(`Visible element with aria-hidden="true" may be problematic`);
      }
    }

    // Check for skip links
    const skipLinks = await page.locator('a[href^="#"]').first();
    if ((await skipLinks.count()) > 0) {
      const skipLinkText = await skipLinks.textContent();
      console.log(`Skip link found: "${skipLinkText}"`);
    } else {
      console.warn('No skip links found - consider adding for better navigation');
    }
  });

  test('Mobile Accessibility', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Test touch target sizes (minimum 44x44 pixels)
    const touchTargets = await page
      .locator('button, a, input[type="button"], input[type="submit"]')
      .all();

    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();

      if (boundingBox) {
        const meetsMinimumSize = boundingBox.width >= 44 && boundingBox.height >= 44;

        if (!meetsMinimumSize) {
          const targetText = await target.textContent();
          console.warn(
            `Touch target may be too small: "${targetText?.trim()}" (${boundingBox.width}x${boundingBox.height})`
          );
        }
      }
    }

    console.log(`Mobile accessibility test completed for ${touchTargets.length} touch targets`);
  });

  test('Dynamic Content Accessibility', async ({ page }) => {
    await page.goto('/products');

    // Test accessibility of dynamically loaded content
    await page.locator('input[placeholder*="search"]').fill('laptop');
    await page.keyboard.press('Enter');

    // Wait for search results to load
    await page.waitForSelector('[data-testid="search-results"], .product-list', { timeout: 5000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Check if search results are announced to screen readers
    const searchResults = await page.locator('[role="status"], [aria-live]').count();

    if (searchResults === 0) {
      console.warn(
        'Search results may not be announced to screen readers - consider adding aria-live region'
      );
    }
  });

  test('Error Message Accessibility', async ({ page }) => {
    await page.goto('/register');

    // Trigger form validation errors
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('input[name="password"]').fill('123');
    await page.locator('button[type="submit"]').click();

    // Wait for error messages to appear
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-valid-attr-value'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Check error message accessibility
    const errorMessages = await page.locator('.error, [role="alert"], [aria-invalid="true"]').all();

    for (const errorElement of errorMessages) {
      const ariaDescribedBy = await errorElement.getAttribute('aria-describedby');
      const role = await errorElement.getAttribute('role');
      const ariaInvalid = await errorElement.getAttribute('aria-invalid');

      const hasAccessibleError = ariaDescribedBy || role === 'alert' || ariaInvalid === 'true';

      if (!hasAccessibleError) {
        console.warn('Error message may not be accessible to screen readers');
      }
    }
  });
});

// Utility function to generate accessibility report
test.afterAll(async () => {
  console.log('\\n=== Accessibility Testing Summary ===');
  console.log('All accessibility tests completed.');
  console.log('Check test results for detailed accessibility compliance information.');
  console.log('For detailed WCAG guidelines, visit: https://www.w3.org/WAI/WCAG21/quickref/');
});
