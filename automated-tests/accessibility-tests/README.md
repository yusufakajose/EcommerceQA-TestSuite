# Accessibility Testing Suite

Comprehensive accessibility testing framework ensuring WCAG 2.1 AA compliance for the ecommerce application.

## Overview

This accessibility testing suite provides automated validation of web accessibility standards using axe-core integration with Playwright. It covers critical user flows, WCAG compliance, keyboard navigation, color contrast, and screen reader compatibility.

## Quick Start

### Prerequisites

- Node.js and npm installed
- Playwright test framework configured
- @axe-core/playwright package installed

### Installation

```bash
# Install accessibility testing dependencies
npm install @axe-core/playwright --save-dev
```

### Running Tests

```bash
# Run all accessibility tests
npx playwright test accessibility-tests/

# Run specific test suite
npx playwright test accessibility-test-suite.spec.js

# Run user flow accessibility tests
npx playwright test user-flows-accessibility.spec.js

# Run with HTML report
npx playwright test accessibility-tests/ --reporter=html
```

## Test Suites

### 1. Core Accessibility Test Suite (`accessibility-test-suite.spec.js`)

Comprehensive WCAG compliance testing covering:

- **WCAG Compliance**: Full WCAG 2.1 AA validation for all pages
- **Color Contrast**: Automated contrast ratio validation
- **Keyboard Navigation**: Complete keyboard accessibility testing
- **Form Accessibility**: Form label and validation testing
- **Heading Structure**: Heading hierarchy validation
- **Image Alt Text**: Alternative text validation
- **ARIA Attributes**: ARIA implementation validation
- **Screen Reader Compatibility**: Screen reader simulation
- **Mobile Accessibility**: Touch target and mobile-specific testing
- **Dynamic Content**: AJAX and dynamic content accessibility
- **Error Messages**: Accessible error handling validation

### 2. User Flow Accessibility Tests (`user-flows-accessibility.spec.js`)

End-to-end accessibility testing for critical user journeys:

- **User Registration Flow**: Registration form accessibility
- **Login Flow**: Authentication accessibility
- **Product Browsing Flow**: Product catalog accessibility
- **Shopping Cart Flow**: Cart management accessibility
- **Checkout Flow**: Checkout process accessibility
- **Navigation and Menu**: Site navigation accessibility
- **Dynamic Content**: AJAX content accessibility
- **Error Handling**: Error message accessibility

## Test Configuration

### Accessibility Configuration (`accessibility.config.js`)

Centralized configuration including:

- WCAG compliance levels (2.0 A, AA, 2.1 AA, 2.2 AA)
- Critical accessibility rules
- Test page configurations
- Viewport and browser settings
- Accessibility thresholds
- Custom test definitions

### Key Configuration Options

```javascript
// WCAG levels to test
wcagLevels: ['wcag2a', 'wcag2aa', 'wcag21aa']

// Critical accessibility rules
rules: {
  critical: [
    'color-contrast',
    'keyboard',
    'alt-text',
    'form-field-multiple-labels',
    'heading-order'
  ]
}

// Accessibility thresholds
thresholds: {
  violations: {
    critical: 0,
    serious: 0,
    moderate: 2,
    minor: 5
  }
}
```

## Utility Functions

### AccessibilityTestUtils Class

Reusable utility functions for accessibility testing:

#### Core Methods

```javascript
// Run comprehensive accessibility scan
const results = await AccessibilityTestUtils.runAccessibilityScan(page, {
  tags: ['wcag2aa'],
  rules: ['color-contrast', 'keyboard'],
});

// Test keyboard navigation
const keyboardResults = await AccessibilityTestUtils.testKeyboardNavigation(page, {
  maxTabs: 20,
});

// Validate form accessibility
const formResults = await AccessibilityTestUtils.validateFormAccessibility(page);

// Check heading structure
const headingResults = await AccessibilityTestUtils.validateHeadingStructure(page);

// Validate page structure
const structureResults = await AccessibilityTestUtils.validatePageStructure(page);
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

The test suite validates compliance with:

#### Perceivable

- ✅ Color contrast ratios (4.5:1 normal, 3:1 large text)
- ✅ Alternative text for images
- ✅ Resizable text up to 200%
- ✅ Visual focus indicators

#### Operable

- ✅ Keyboard accessibility
- ✅ Focus management
- ✅ Touch target sizes (44x44px minimum)
- ✅ No seizure-inducing content

#### Understandable

- ✅ Form labels and instructions
- ✅ Error identification and suggestions
- ✅ Consistent navigation
- ✅ Language identification

#### Robust

- ✅ Valid HTML and ARIA
- ✅ Screen reader compatibility
- ✅ Cross-browser accessibility

### Key Accessibility Features Tested

1. **Semantic HTML Structure**
   - Proper heading hierarchy (H1-H6)
   - Landmark roles (banner, navigation, main, contentinfo)
   - Form controls and labels

2. **ARIA Implementation**
   - ARIA roles and properties
   - Live regions for dynamic content
   - ARIA labels and descriptions

3. **Keyboard Navigation**
   - Logical tab order
   - Visible focus indicators
   - Skip links and shortcuts

4. **Form Accessibility**
   - Label association
   - Required field indication
   - Error message accessibility
   - Fieldset and legend usage

5. **Color and Contrast**
   - Sufficient contrast ratios
   - Color-independent information
   - High contrast mode support

## Test Results and Reporting

### Violation Categories

- **Critical**: Immediate accessibility barriers (0 allowed)
- **Serious**: Significant accessibility issues (0 allowed)
- **Moderate**: Important improvements (≤2 allowed)
- **Minor**: Enhancement opportunities (≤5 allowed)

### Report Generation

Tests generate comprehensive reports including:

- Accessibility violation details
- WCAG compliance status
- Remediation recommendations
- Screenshots of issues
- Trend analysis

### Sample Test Output

```
Accessibility scan for Homepage:
  - Passes: 47
  - Violations: 0
  - Incomplete: 2

Keyboard navigation test completed. Tested 15 tab stops.
All elements have proper focus indicators.

Form accessibility validation:
  ✓ All inputs have accessible labels
  ✓ Required fields properly marked
  ✓ Error messages are accessible
```

## Integration

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Accessibility Tests
  run: |
    npx playwright test accessibility-tests/

- name: Upload Accessibility Report
  uses: actions/upload-artifact@v3
  with:
    name: accessibility-report
    path: playwright-report/
```

### Custom Test Integration

```javascript
// Add to existing test files
const AccessibilityTestUtils = require('./utils/AccessibilityTestUtils');

test('Custom accessibility check', async ({ page }) => {
  await page.goto('/custom-page');

  const results = await AccessibilityTestUtils.runAccessibilityScan(page);
  expect(results.violations).toEqual([]);
});
```

## Best Practices

### 1. Test Early and Often

- Run accessibility tests during development
- Include in pull request validation
- Monitor accessibility metrics over time

### 2. Focus on User Impact

- Prioritize critical user flows
- Test with realistic user scenarios
- Consider different user abilities

### 3. Combine Automated and Manual Testing

- Use automated tests for consistent validation
- Supplement with manual testing
- Test with actual assistive technologies

### 4. Continuous Improvement

- Regular accessibility audits
- Team accessibility training
- User feedback integration

## Troubleshooting

### Common Issues

1. **Test Failures**

   ```bash
   # Run with debug mode
   npx playwright test --debug accessibility-test-suite.spec.js

   # Generate detailed report
   npx playwright test --reporter=html accessibility-tests/
   ```

2. **Color Contrast Issues**
   - Check CSS color values
   - Use browser dev tools contrast checker
   - Consider different color schemes

3. **Keyboard Navigation Problems**
   - Verify tabindex values
   - Check focus indicator styles
   - Test with actual keyboard navigation

4. **Form Accessibility Issues**
   - Ensure proper label association
   - Add ARIA attributes where needed
   - Test error message announcements

### Performance Optimization

```javascript
// Run focused accessibility scans
const results = await AccessibilityTestUtils.runAccessibilityScan(page, {
  include: ['main'], // Focus on specific areas
  rules: ['color-contrast'], // Test specific rules only
});
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [WebAIM Accessibility Resources](https://webaim.org/)

## Support

For questions or issues with accessibility testing:

1. Check the troubleshooting section
2. Review test output and reports
3. Consult WCAG guidelines for specific requirements
4. Test with actual assistive technologies when possible

---

**Note**: This accessibility testing suite provides automated validation but should be supplemented with manual testing and real user feedback for comprehensive accessibility assurance.
