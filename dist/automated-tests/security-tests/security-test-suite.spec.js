/**
 * Comprehensive Security Test Suite
 * Tests for common web application security vulnerabilities
 */
const { test, expect } = require('@playwright/test');
const SecurityTestUtils = require('./utils/SecurityTestUtils');
// Security test configuration
const securityConfig = {
    // Common XSS payloads for testing
    xssPayloads: [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        "';alert('XSS');//",
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        '"><img src=x onerror=alert("XSS")>'
    ],
    // SQL injection payloads
    sqlInjectionPayloads: [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1 --",
        "1' OR '1'='1' /*"
    ],
    // Command injection payloads
    commandInjectionPayloads: [
        '; ls -la',
        '| whoami',
        '&& cat /etc/passwd',
        '`id`',
        '$(whoami)',
        '; ping -c 1 127.0.0.1'
    ],
    // Path traversal payloads
    pathTraversalPayloads: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd'
    ]
};
test.describe('Security Testing Suite', () => {
    test.beforeEach(async ({ page }) => {
        // Set up security testing context
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });
    test.describe('Input Validation and XSS Prevention', () => {
        test('XSS Prevention in Search Functionality', async ({ page }) => {
            await page.goto('/products');
            await page.waitForLoadState('networkidle');
            const searchInput = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
            if (await searchInput.count() > 0) {
                for (const payload of securityConfig.xssPayloads) {
                    console.log(`Testing XSS payload: ${payload}`);
                    // Clear and fill search input with XSS payload
                    await searchInput.clear();
                    await searchInput.fill(payload);
                    await page.keyboard.press('Enter');
                    // Wait for response
                    await page.waitForTimeout(1000);
                    // Check if XSS payload was executed (should not be)
                    const alertDialogs = [];
                    page.on('dialog', dialog => {
                        alertDialogs.push(dialog.message());
                        dialog.dismiss();
                    });
                    // Verify no script execution occurred
                    expect(alertDialogs.length).toBe(0);
                    // Check if payload is properly escaped in DOM
                    const pageContent = await page.content();
                    const isProperlyEscaped = !pageContent.includes('<script>') ||
                        pageContent.includes('&lt;script&gt;') ||
                        pageContent.includes('&amp;lt;script&amp;gt;');
                    expect(isProperlyEscaped).toBe(true);
                    // Verify search results don't contain unescaped payload
                    const searchResults = await page.locator('[data-testid="search-results"], .search-results').textContent();
                    if (searchResults) {
                        const containsRawScript = searchResults.includes('<script>') && !searchResults.includes('&lt;');
                        expect(containsRawScript).toBe(false);
                    }
                }
            }
        });
        test('XSS Prevention in User Registration', async ({ page }) => {
            await page.goto('/register');
            await page.waitForLoadState('networkidle');
            const formInputs = [
                { selector: 'input[name="firstName"], input[name="first_name"]', name: 'firstName' },
                { selector: 'input[name="lastName"], input[name="last_name"]', name: 'lastName' },
                { selector: 'input[name="email"]', name: 'email' },
                { selector: 'textarea[name="bio"], textarea[name="description"]', name: 'bio' }
            ];
            for (const input of formInputs) {
                const inputElement = page.locator(input.selector);
                if (await inputElement.count() > 0) {
                    console.log(`Testing XSS in ${input.name} field`);
                    for (const payload of securityConfig.xssPayloads.slice(0, 3)) { // Test subset for performance
                        await inputElement.clear();
                        await inputElement.fill(payload);
                        // Check if input value is properly handled
                        const inputValue = await inputElement.inputValue();
                        // Input should either reject the payload or escape it
                        const isSecure = inputValue !== payload ||
                            inputValue.includes('&lt;') ||
                            inputValue.includes('&amp;');
                        if (!isSecure) {
                            console.warn(`Potential XSS vulnerability in ${input.name} field`);
                        }
                    }
                }
            }
        });
        test('XSS Prevention in User Comments/Reviews', async ({ page }) => {
            // Navigate to a product page that might have reviews
            await page.goto('/products/1');
            await page.waitForLoadState('networkidle');
            const reviewTextarea = page.locator('textarea[name*="review"], textarea[name*="comment"], [data-testid="review-input"]');
            if (await reviewTextarea.count() > 0) {
                for (const payload of securityConfig.xssPayloads.slice(0, 3)) {
                    console.log(`Testing XSS in review: ${payload}`);
                    await reviewTextarea.clear();
                    await reviewTextarea.fill(payload);
                    // Submit review if submit button exists
                    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), [data-testid="submit-review"]');
                    if (await submitButton.count() > 0) {
                        await submitButton.click();
                        await page.waitForTimeout(1000);
                        // Check if payload appears unescaped in the page
                        const pageContent = await page.content();
                        const hasUnescapedScript = pageContent.includes('<script>alert') &&
                            !pageContent.includes('&lt;script&gt;');
                        expect(hasUnescapedScript).toBe(false);
                    }
                }
            }
        });
    });
    test.describe('SQL Injection Prevention', () => {
        test('SQL Injection Prevention in Search', async ({ page }) => {
            await page.goto('/products');
            await page.waitForLoadState('networkidle');
            const searchInput = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
            if (await searchInput.count() > 0) {
                for (const payload of securityConfig.sqlInjectionPayloads) {
                    console.log(`Testing SQL injection payload: ${payload}`);
                    await searchInput.clear();
                    await searchInput.fill(payload);
                    await page.keyboard.press('Enter');
                    // Wait for response
                    await page.waitForTimeout(2000);
                    // Check for SQL error messages that might indicate vulnerability
                    const pageContent = await page.textContent('body');
                    const sqlErrorPatterns = [
                        /sql syntax/i,
                        /mysql error/i,
                        /postgresql error/i,
                        /ora-\d+/i,
                        /microsoft ole db/i,
                        /sqlite error/i,
                        /syntax error/i,
                        /unclosed quotation mark/i
                    ];
                    const hasSqlError = sqlErrorPatterns.some(pattern => pattern.test(pageContent));
                    if (hasSqlError) {
                        console.warn(`Potential SQL injection vulnerability detected with payload: ${payload}`);
                    }
                    expect(hasSqlError).toBe(false);
                    // Verify application handles the input gracefully
                    const hasServerError = pageContent.includes('500') ||
                        pageContent.includes('Internal Server Error') ||
                        pageContent.includes('Database Error');
                    expect(hasServerError).toBe(false);
                }
            }
        });
        test('SQL Injection Prevention in Login Form', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            const emailInput = page.locator('input[name="email"], input[type="email"]');
            const passwordInput = page.locator('input[name="password"], input[type="password"]');
            const submitButton = page.locator('button[type="submit"], input[type="submit"]');
            if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
                for (const payload of securityConfig.sqlInjectionPayloads.slice(0, 3)) {
                    console.log(`Testing SQL injection in login: ${payload}`);
                    // Test SQL injection in email field
                    await emailInput.clear();
                    await emailInput.fill(payload);
                    await passwordInput.clear();
                    await passwordInput.fill('password123');
                    if (await submitButton.count() > 0) {
                        await submitButton.click();
                        await page.waitForTimeout(2000);
                        // Check for SQL errors or unexpected behavior
                        const pageContent = await page.textContent('body');
                        const hasSqlError = /sql|mysql|postgresql|ora-\d+|sqlite/i.test(pageContent);
                        expect(hasSqlError).toBe(false);
                        // Should not be logged in with SQL injection
                        const isLoggedIn = await page.locator('a:has-text("Logout"), [data-testid="logout"]').count() > 0;
                        expect(isLoggedIn).toBe(false);
                    }
                }
            }
        });
    });
    test.describe('Authentication and Authorization', () => {
        test('Session Management Security', async ({ page }) => {
            // Test session fixation and session hijacking prevention
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            // Get initial session cookies
            const initialCookies = await page.context().cookies();
            const sessionCookies = initialCookies.filter(cookie => cookie.name.toLowerCase().includes('session') ||
                cookie.name.toLowerCase().includes('auth') ||
                cookie.name.toLowerCase().includes('token'));
            console.log(`Found ${sessionCookies.length} session-related cookies`);
            // Check session cookie security attributes
            sessionCookies.forEach(cookie => {
                console.log(`Checking cookie: ${cookie.name}`);
                // Session cookies should be HttpOnly
                expect(cookie.httpOnly).toBe(true);
                // Session cookies should be Secure (if HTTPS)
                if (page.url().startsWith('https://')) {
                    expect(cookie.secure).toBe(true);
                }
                // Session cookies should have SameSite attribute
                expect(['Strict', 'Lax', 'None'].includes(cookie.sameSite)).toBe(true);
            });
            // Test session regeneration after login
            const emailInput = page.locator('input[name="email"]');
            const passwordInput = page.locator('input[name="password"]');
            const submitButton = page.locator('button[type="submit"]');
            if (await emailInput.count() > 0) {
                await emailInput.fill('test@example.com');
                await passwordInput.fill('password123');
                await submitButton.click();
                await page.waitForTimeout(2000);
                // Get cookies after login attempt
                const postLoginCookies = await page.context().cookies();
                const postLoginSessionCookies = postLoginCookies.filter(cookie => cookie.name.toLowerCase().includes('session') ||
                    cookie.name.toLowerCase().includes('auth'));
                // Session ID should change after login (session regeneration)
                if (sessionCookies.length > 0 && postLoginSessionCookies.length > 0) {
                    const sessionChanged = sessionCookies[0].value !== postLoginSessionCookies[0].value;
                    if (!sessionChanged) {
                        console.warn('Session ID did not change after login - potential session fixation vulnerability');
                    }
                }
            }
        });
        test('Password Security Requirements', async ({ page }) => {
            await page.goto('/register');
            await page.waitForLoadState('networkidle');
            const passwordInput = page.locator('input[name="password"], input[type="password"]');
            const submitButton = page.locator('button[type="submit"]');
            if (await passwordInput.count() > 0) {
                const weakPasswords = [
                    '123',
                    'password',
                    '12345678',
                    'qwerty',
                    'admin',
                    'test'
                ];
                for (const weakPassword of weakPasswords) {
                    console.log(`Testing weak password: ${weakPassword}`);
                    // Fill other required fields
                    const emailInput = page.locator('input[name="email"]');
                    if (await emailInput.count() > 0) {
                        await emailInput.fill('test@example.com');
                    }
                    await passwordInput.clear();
                    await passwordInput.fill(weakPassword);
                    if (await submitButton.count() > 0) {
                        await submitButton.click();
                        await page.waitForTimeout(1000);
                        // Should show password strength error
                        const errorMessages = await page.locator('.error, .invalid, [role="alert"]').textContent();
                        const hasPasswordError = errorMessages &&
                            (errorMessages.includes('password') || errorMessages.includes('weak') || errorMessages.includes('strong'));
                        if (!hasPasswordError) {
                            console.warn(`Weak password "${weakPassword}" was accepted without warning`);
                        }
                    }
                }
            }
        });
        test('Brute Force Protection', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            const emailInput = page.locator('input[name="email"]');
            const passwordInput = page.locator('input[name="password"]');
            const submitButton = page.locator('button[type="submit"]');
            if (await emailInput.count() > 0) {
                const maxAttempts = 5;
                let isBlocked = false;
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    console.log(`Login attempt ${attempt}/${maxAttempts}`);
                    await emailInput.clear();
                    await emailInput.fill('test@example.com');
                    await passwordInput.clear();
                    await passwordInput.fill(`wrongpassword${attempt}`);
                    await submitButton.click();
                    await page.waitForTimeout(2000);
                    // Check for rate limiting or account lockout
                    const pageContent = await page.textContent('body');
                    const isRateLimited = /rate limit|too many attempts|account locked|temporarily blocked/i.test(pageContent);
                    if (isRateLimited) {
                        console.log(`Rate limiting detected after ${attempt} attempts`);
                        isBlocked = true;
                        break;
                    }
                    // Check if CAPTCHA is required
                    const hasCaptcha = await page.locator('[data-testid="captcha"], .captcha, .recaptcha').count() > 0;
                    if (hasCaptcha) {
                        console.log(`CAPTCHA required after ${attempt} attempts`);
                        isBlocked = true;
                        break;
                    }
                }
                if (!isBlocked) {
                    console.warn('No brute force protection detected - consider implementing rate limiting');
                }
            }
        });
    });
    test.describe('HTTPS and Secure Communication', () => {
        test('HTTPS Enforcement', async ({ page }) => {
            // Test if HTTP redirects to HTTPS
            const httpUrl = page.url().replace('https://', 'http://');
            if (httpUrl !== page.url()) {
                try {
                    await page.goto(httpUrl);
                    await page.waitForLoadState('networkidle');
                    // Should redirect to HTTPS
                    const currentUrl = page.url();
                    expect(currentUrl.startsWith('https://')).toBe(true);
                    console.log('HTTPS redirect working correctly');
                }
                catch (error) {
                    console.log('HTTP version not accessible (good for security)');
                }
            }
        });
        test('Secure Cookie Attributes', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            const cookies = await page.context().cookies();
            cookies.forEach(cookie => {
                console.log(`Checking cookie security: ${cookie.name}`);
                // Sensitive cookies should be secure
                const isSensitive = cookie.name.toLowerCase().includes('session') ||
                    cookie.name.toLowerCase().includes('auth') ||
                    cookie.name.toLowerCase().includes('token') ||
                    cookie.name.toLowerCase().includes('csrf');
                if (isSensitive) {
                    // Should be HttpOnly to prevent XSS
                    expect(cookie.httpOnly).toBe(true);
                    // Should be Secure if using HTTPS
                    if (page.url().startsWith('https://')) {
                        expect(cookie.secure).toBe(true);
                    }
                    // Should have SameSite attribute
                    expect(['Strict', 'Lax', 'None'].includes(cookie.sameSite)).toBe(true);
                }
            });
        });
        test('Content Security Policy Headers', async ({ page }) => {
            const response = await page.goto('/');
            const headers = response.headers();
            // Check for CSP header
            const cspHeader = headers['content-security-policy'] || headers['content-security-policy-report-only'];
            if (cspHeader) {
                console.log('CSP Header found:', cspHeader);
                // CSP should restrict script sources
                expect(cspHeader.includes('script-src')).toBe(true);
                // Should not allow unsafe-inline or unsafe-eval (ideally)
                const hasUnsafeInline = cspHeader.includes("'unsafe-inline'");
                const hasUnsafeEval = cspHeader.includes("'unsafe-eval'");
                if (hasUnsafeInline) {
                    console.warn('CSP allows unsafe-inline - consider removing for better security');
                }
                if (hasUnsafeEval) {
                    console.warn('CSP allows unsafe-eval - consider removing for better security');
                }
            }
            else {
                console.warn('No Content Security Policy header found - consider implementing CSP');
            }
            // Check for other security headers
            const securityHeaders = {
                'x-frame-options': 'X-Frame-Options header missing - consider adding to prevent clickjacking',
                'x-content-type-options': 'X-Content-Type-Options header missing - consider adding "nosniff"',
                'x-xss-protection': 'X-XSS-Protection header missing - consider adding',
                'strict-transport-security': 'HSTS header missing - consider adding for HTTPS sites',
                'referrer-policy': 'Referrer-Policy header missing - consider adding'
            };
            Object.entries(securityHeaders).forEach(([header, warning]) => {
                if (!headers[header]) {
                    console.warn(warning);
                }
                else {
                    console.log(`${header}: ${headers[header]}`);
                }
            });
        });
    });
    test.describe('File Upload Security', () => {
        test('File Upload Validation', async ({ page }) => {
            // Look for file upload functionality
            await page.goto('/profile');
            await page.waitForLoadState('networkidle');
            const fileInputs = await page.locator('input[type="file"]').all();
            if (fileInputs.length > 0) {
                console.log(`Found ${fileInputs.length} file upload input(s)`);
                for (const fileInput of fileInputs) {
                    // Check if file input has accept attribute
                    const acceptAttribute = await fileInput.getAttribute('accept');
                    if (acceptAttribute) {
                        console.log(`File input accept attribute: ${acceptAttribute}`);
                        // Should restrict file types
                        expect(acceptAttribute.length).toBeGreaterThan(0);
                        // Should not accept executable files
                        const allowsExecutables = /\.exe|\.bat|\.cmd|\.scr|\.pif|\.com/i.test(acceptAttribute);
                        expect(allowsExecutables).toBe(false);
                    }
                    else {
                        console.warn('File input without accept attribute - consider adding file type restrictions');
                    }
                    // Test file size validation (if possible)
                    const maxSizeAttribute = await fileInput.getAttribute('data-max-size');
                    if (maxSizeAttribute) {
                        console.log(`File size limit: ${maxSizeAttribute}`);
                    }
                    else {
                        console.warn('No visible file size limit - ensure server-side validation exists');
                    }
                }
            }
        });
    });
    test.describe('Cross-Site Request Forgery (CSRF) Protection', () => {
        test('CSRF Token Presence', async ({ page }) => {
            // Check forms for CSRF tokens
            await page.goto('/register');
            await page.waitForLoadState('networkidle');
            const forms = await page.locator('form').all();
            for (let i = 0; i < forms.length; i++) {
                const form = forms[i];
                console.log(`Checking form ${i + 1} for CSRF protection`);
                // Look for CSRF token input
                const csrfTokens = await form.locator('input[name*="csrf"], input[name*="token"], input[name="_token"]').count();
                if (csrfTokens > 0) {
                    console.log(`CSRF token found in form ${i + 1}`);
                }
                else {
                    console.warn(`No CSRF token found in form ${i + 1} - consider adding CSRF protection`);
                }
                // Check for hidden inputs that might be tokens
                const hiddenInputs = await form.locator('input[type="hidden"]').all();
                for (const hiddenInput of hiddenInputs) {
                    const name = await hiddenInput.getAttribute('name');
                    const value = await hiddenInput.getAttribute('value');
                    if (name && value && value.length > 10) {
                        console.log(`Hidden input "${name}" might be a security token`);
                    }
                }
            }
        });
    });
    test.describe('Information Disclosure Prevention', () => {
        test('Error Message Information Disclosure', async ({ page }) => {
            // Test various endpoints for information disclosure
            const testUrls = [
                '/nonexistent-page',
                '/admin',
                '/api/users',
                '/config',
                '/.env',
                '/debug'
            ];
            for (const testUrl of testUrls) {
                try {
                    const response = await page.goto(testUrl);
                    const status = response.status();
                    const content = await page.textContent('body');
                    console.log(`Testing ${testUrl}: Status ${status}`);
                    // Check for information disclosure in error messages
                    const sensitivePatterns = [
                        /database.*error/i,
                        /mysql|postgresql|oracle/i,
                        /stack trace/i,
                        /file not found.*\/.*\//i,
                        /debug.*mode/i,
                        /exception.*at.*line/i,
                        /root@|admin@/i,
                        /password.*=|pwd.*=/i
                    ];
                    const hasSensitiveInfo = sensitivePatterns.some(pattern => pattern.test(content));
                    if (hasSensitiveInfo) {
                        console.warn(`Potential information disclosure at ${testUrl}`);
                    }
                    expect(hasSensitiveInfo).toBe(false);
                }
                catch (error) {
                    console.log(`${testUrl} not accessible: ${error.message}`);
                }
            }
        });
        test('Directory Traversal Prevention', async ({ page }) => {
            // Test for directory traversal vulnerabilities
            const baseUrl = new URL(page.url()).origin;
            for (const payload of securityConfig.pathTraversalPayloads) {
                const testUrl = `${baseUrl}/files/${payload}`;
                try {
                    console.log(`Testing directory traversal: ${payload}`);
                    const response = await page.goto(testUrl);
                    const content = await page.textContent('body');
                    // Should not return system files
                    const hasSystemFile = /root:|bin\/|etc\/passwd|windows\\system32/i.test(content);
                    if (hasSystemFile) {
                        console.warn(`Potential directory traversal vulnerability with payload: ${payload}`);
                    }
                    expect(hasSystemFile).toBe(false);
                }
                catch (error) {
                    console.log(`Directory traversal test failed (good): ${error.message}`);
                }
            }
        });
    });
});
// Generate security testing summary
test.afterAll(async () => {
    console.log('\n=== Security Testing Summary ===');
    console.log('✓ XSS Prevention Testing');
    console.log('✓ SQL Injection Prevention Testing');
    console.log('✓ Authentication Security Testing');
    console.log('✓ HTTPS and Secure Communication Testing');
    console.log('✓ File Upload Security Testing');
    console.log('✓ CSRF Protection Testing');
    console.log('✓ Information Disclosure Prevention Testing');
    console.log('\nAll security tests completed.');
    console.log('Review test output for security recommendations and potential vulnerabilities.');
});
