/**
 * Accessibility Testing Configuration
 * Configuration for comprehensive accessibility testing with axe-core
 */
module.exports = {
    // WCAG compliance levels to test
    wcagLevels: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
    // Accessibility testing rules configuration
    rules: {
        // Critical rules that must pass
        critical: [
            'color-contrast',
            'keyboard',
            'focus-order-semantics',
            'alt-text',
            'form-field-multiple-labels',
            'heading-order',
            'landmark-one-main',
            'page-has-heading-one',
            'aria-valid-attr',
            'aria-valid-attr-value',
            'aria-required-attr'
        ],
        // Important rules for better accessibility
        important: [
            'bypass',
            'document-title',
            'html-has-lang',
            'landmark-banner-is-top-level',
            'landmark-contentinfo-is-top-level',
            'landmark-main-is-top-level',
            'landmark-no-duplicate-banner',
            'landmark-no-duplicate-contentinfo',
            'region',
            'skip-link'
        ],
        // Rules to disable for specific contexts
        disabled: [
        // Disable if using custom focus management
        // 'focus-order-semantics'
        ]
    },
    // Test pages and their specific configurations
    testPages: [
        {
            name: 'Homepage',
            url: '/',
            description: 'Main landing page',
            criticalElements: ['nav', 'main', 'footer'],
            skipRules: []
        },
        {
            name: 'User Registration',
            url: '/register',
            description: 'User registration form',
            criticalElements: ['form', 'input', 'button'],
            skipRules: [],
            customTests: ['form-validation', 'error-handling']
        },
        {
            name: 'User Login',
            url: '/login',
            description: 'User login form',
            criticalElements: ['form', 'input', 'button'],
            skipRules: [],
            customTests: ['form-validation', 'error-handling']
        },
        {
            name: 'Product Catalog',
            url: '/products',
            description: 'Product listing and search',
            criticalElements: ['img', 'button', 'input'],
            skipRules: [],
            customTests: ['image-alt-text', 'search-functionality']
        },
        {
            name: 'Product Details',
            url: '/products/1',
            description: 'Individual product page',
            criticalElements: ['img', 'button', 'h1'],
            skipRules: [],
            customTests: ['image-alt-text', 'product-actions']
        },
        {
            name: 'Shopping Cart',
            url: '/cart',
            description: 'Shopping cart management',
            criticalElements: ['button', 'input[type="number"]', 'table'],
            skipRules: [],
            customTests: ['cart-controls', 'quantity-management']
        },
        {
            name: 'Checkout',
            url: '/checkout',
            description: 'Checkout process',
            criticalElements: ['form', 'input', 'select', 'button'],
            skipRules: [],
            customTests: ['form-validation', 'payment-form', 'multi-step-process']
        },
        {
            name: 'User Profile',
            url: '/profile',
            description: 'User account management',
            criticalElements: ['form', 'input', 'button'],
            skipRules: [],
            customTests: ['form-validation', 'account-settings']
        }
    ],
    // User journey flows for accessibility testing
    userFlows: [
        {
            name: 'Complete Purchase Flow',
            description: 'Full user journey from product selection to checkout',
            steps: [
                { action: 'navigate', url: '/products' },
                { action: 'search', query: 'laptop' },
                { action: 'selectProduct', index: 0 },
                { action: 'addToCart' },
                { action: 'navigate', url: '/cart' },
                { action: 'proceedToCheckout' },
                { action: 'fillCheckoutForm' }
            ],
            accessibilityChecks: ['keyboard-navigation', 'screen-reader-compatibility', 'error-handling']
        },
        {
            name: 'User Registration and Login',
            description: 'User account creation and authentication',
            steps: [
                { action: 'navigate', url: '/register' },
                { action: 'fillRegistrationForm' },
                { action: 'submitForm' },
                { action: 'navigate', url: '/login' },
                { action: 'fillLoginForm' },
                { action: 'submitForm' }
            ],
            accessibilityChecks: ['form-accessibility', 'error-messages', 'success-feedback']
        }
    ],
    // Device and viewport configurations for responsive accessibility testing
    viewports: [
        {
            name: 'Desktop',
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        },
        {
            name: 'Tablet',
            width: 768,
            height: 1024,
            deviceScaleFactor: 2
        },
        {
            name: 'Mobile',
            width: 375,
            height: 667,
            deviceScaleFactor: 2
        },
        {
            name: 'Mobile Large',
            width: 414,
            height: 896,
            deviceScaleFactor: 3
        }
    ],
    // Browser configurations for cross-browser accessibility testing
    browsers: [
        {
            name: 'chromium',
            channel: 'chrome',
            accessibility: {
                screenReader: 'NVDA', // Simulated
                highContrast: false,
                reducedMotion: false
            }
        },
        {
            name: 'firefox',
            accessibility: {
                screenReader: 'JAWS', // Simulated
                highContrast: false,
                reducedMotion: false
            }
        },
        {
            name: 'webkit',
            accessibility: {
                screenReader: 'VoiceOver', // Simulated
                highContrast: false,
                reducedMotion: false
            }
        }
    ],
    // Accessibility testing thresholds
    thresholds: {
        // Maximum allowed violations by impact level
        violations: {
            critical: 0,
            serious: 0,
            moderate: 2,
            minor: 5
        },
        // Minimum color contrast ratios
        colorContrast: {
            normal: 4.5,
            large: 3.0,
            enhanced: 7.0
        },
        // Minimum touch target sizes (in pixels)
        touchTargets: {
            minimum: 44,
            recommended: 48
        },
        // Keyboard navigation requirements
        keyboardNavigation: {
            maxTabStops: 50,
            minFocusIndicatorRatio: 0.9
        }
    },
    // Reporting configuration
    reporting: {
        formats: ['html', 'json', 'junit'],
        outputDir: 'reports/accessibility',
        includeScreenshots: true,
        includeViolationDetails: true,
        generateSummary: true,
        // Report sections to include
        sections: {
            executiveSummary: true,
            detailedResults: true,
            recommendations: true,
            wcagCompliance: true,
            trendAnalysis: true
        }
    },
    // Integration settings
    integration: {
        // CI/CD integration
        cicd: {
            failOnViolations: true,
            failureThreshold: 'serious',
            generateArtifacts: true
        },
        // Issue tracking integration
        issueTracking: {
            enabled: false,
            system: 'github', // github, jira, etc.
            autoCreateIssues: false,
            labelPrefix: 'accessibility'
        }
    },
    // Custom accessibility test configurations
    customTests: {
        'form-validation': {
            description: 'Test form validation accessibility',
            rules: ['aria-valid-attr-value', 'form-field-multiple-labels'],
            actions: ['submit-invalid-form', 'check-error-messages']
        },
        'error-handling': {
            description: 'Test error message accessibility',
            rules: ['aria-valid-attr-value'],
            actions: ['trigger-errors', 'verify-announcements']
        },
        'image-alt-text': {
            description: 'Test image alternative text',
            rules: ['image-alt'],
            actions: ['check-all-images', 'verify-alt-text-quality']
        },
        'search-functionality': {
            description: 'Test search accessibility',
            rules: ['aria-valid-attr', 'form-field-multiple-labels'],
            actions: ['perform-search', 'check-results-announcement']
        },
        'cart-controls': {
            description: 'Test shopping cart control accessibility',
            rules: ['button-name', 'aria-valid-attr'],
            actions: ['test-quantity-controls', 'test-remove-buttons']
        },
        'multi-step-process': {
            description: 'Test multi-step process accessibility',
            rules: ['aria-current'],
            actions: ['navigate-steps', 'check-progress-indication']
        }
    },
    // Performance considerations for accessibility testing
    performance: {
        timeout: 30000,
        retries: 2,
        parallel: true,
        maxConcurrency: 3
    }
};
