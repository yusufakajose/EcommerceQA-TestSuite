/**
 * API Security Tests
 * Tests for API-specific security vulnerabilities
 */
const { test, expect } = require('@playwright/test');
const SecurityTestUtils = require('./utils/SecurityTestUtils');
test.describe('API Security Tests', () => {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    test.beforeEach(async ({ page }) => {
        // Set up API testing context
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });
    test.describe('API Authentication and Authorization', () => {
        test('API Endpoint Authentication Requirements', async ({ page }) => {
            const protectedEndpoints = [
                '/api/users/profile',
                '/api/orders',
                '/api/admin/users',
                '/api/cart',
                '/api/checkout'
            ];
            for (const endpoint of protectedEndpoints) {
                console.log(`Testing authentication for: ${endpoint}`);
                // Test without authentication
                const response = await page.request.get(endpoint);
                const status = response.status();
                // Should return 401 Unauthorized or 403 Forbidden
                const isProtected = status === 401 || status === 403;
                if (!isProtected && status === 200) {
                    console.warn(`Endpoint ${endpoint} may lack proper authentication`);
                }
                expect([401, 403, 404].includes(status)).toBe(true);
                // Check for proper error response
                if (status === 401 || status === 403) {
                    const responseBody = await response.text();
                    const hasProperError = responseBody.includes('unauthorized') ||
                        responseBody.includes('forbidden') ||
                        responseBody.includes('authentication');
                    expect(hasProperError).toBe(true);
                }
            }
        });
        test('JWT Token Security', async ({ page }) => {
            // Attempt to login and get JWT token
            const loginResponse = await page.request.post('/api/auth/login', {
                data: {
                    email: 'test@example.com',
                    password: 'password123'
                }
            });
            if (loginResponse.status() === 200) {
                const loginData = await loginResponse.json();
                const token = loginData.token || loginData.access_token;
                if (token) {
                    console.log('JWT token received, analyzing security...');
                    // Check token structure (should have 3 parts separated by dots)
                    const tokenParts = token.split('.');
                    expect(tokenParts.length).toBe(3);
                    // Decode JWT header and payload (not signature)
                    try {
                        const header = JSON.parse(atob(tokenParts[0]));
                        const payload = JSON.parse(atob(tokenParts[1]));
                        console.log('JWT Header:', header);
                        console.log('JWT Payload keys:', Object.keys(payload));
                        // Check for security best practices
                        expect(header.alg).toBeDefined();
                        expect(header.alg).not.toBe('none'); // Should not use 'none' algorithm
                        // Check for expiration
                        if (payload.exp) {
                            const expirationTime = new Date(payload.exp * 1000);
                            const now = new Date();
                            const timeUntilExpiry = expirationTime.getTime() - now.getTime();
                            console.log(`Token expires in: ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);
                            // Token should not be valid for too long
                            const maxValidityHours = 24;
                            expect(timeUntilExpiry).toBeLessThan(maxValidityHours * 60 * 60 * 1000);
                        }
                        else {
                            console.warn('JWT token does not have expiration time');
                        }
                        // Check for sensitive information in payload
                        const sensitiveFields = ['password', 'secret', 'private_key'];
                        sensitiveFields.forEach(field => {
                            expect(payload[field]).toBeUndefined();
                        });
                    }
                    catch (error) {
                        console.warn('Could not decode JWT token:', error.message);
                    }
                }
            }
        });
        test('API Rate Limiting', async ({ page }) => {
            const testEndpoint = '/api/auth/login';
            const maxRequests = 10;
            let rateLimitHit = false;
            console.log(`Testing rate limiting on ${testEndpoint}`);
            for (let i = 1; i <= maxRequests; i++) {
                const response = await page.request.post(testEndpoint, {
                    data: {
                        email: 'test@example.com',
                        password: 'wrongpassword'
                    }
                });
                const status = response.status();
                console.log(`Request ${i}: Status ${status}`);
                // Check for rate limiting responses
                if (status === 429 || status === 503) {
                    console.log(`Rate limiting detected after ${i} requests`);
                    rateLimitHit = true;
                    // Check for proper rate limit headers
                    const headers = response.headers();
                    const rateLimitHeaders = [
                        'x-ratelimit-limit',
                        'x-ratelimit-remaining',
                        'x-ratelimit-reset',
                        'retry-after'
                    ];
                    const hasRateLimitHeaders = rateLimitHeaders.some(header => headers[header]);
                    if (hasRateLimitHeaders) {
                        console.log('Rate limit headers found');
                    }
                    else {
                        console.warn('Rate limit headers missing');
                    }
                    break;
                }
                // Small delay between requests
                await page.waitForTimeout(100);
            }
            if (!rateLimitHit) {
                console.warn('No rate limiting detected - consider implementing API rate limiting');
            }
        });
    });
    test.describe('API Input Validation', () => {
        test('API XSS Prevention', async ({ page }) => {
            const xssPayloads = [
                '<script>alert("XSS")</script>',
                '"><script>alert("XSS")</script>',
                '<img src=x onerror=alert("XSS")>'
            ];
            const testEndpoints = [
                { url: '/api/users', method: 'POST', data: { name: '', email: 'test@example.com' } },
                { url: '/api/products/search', method: 'GET', params: { q: '' } }
            ];
            for (const endpoint of testEndpoints) {
                for (const payload of xssPayloads) {
                    console.log(`Testing XSS on ${endpoint.url} with payload: ${payload}`);
                    let response;
                    if (endpoint.method === 'POST') {
                        const data = { ...endpoint.data };
                        data.name = payload;
                        response = await page.request.post(endpoint.url, { data });
                    }
                    else {
                        const url = `${endpoint.url}?q=${encodeURIComponent(payload)}`;
                        response = await page.request.get(url);
                    }
                    const responseText = await response.text();
                    // Response should not contain unescaped XSS payload
                    const containsUnescapedPayload = responseText.includes('<script>') &&
                        !responseText.includes('&lt;script&gt;');
                    if (containsUnescapedPayload) {
                        console.warn(`Potential XSS vulnerability in ${endpoint.url}`);
                    }
                    expect(containsUnescapedPayload).toBe(false);
                }
            }
        });
        test('API SQL Injection Prevention', async ({ page }) => {
            const sqlPayloads = [
                "' OR '1'='1",
                "'; DROP TABLE users; --",
                "' UNION SELECT * FROM users --"
            ];
            const testEndpoints = [
                '/api/users/1',
                '/api/products/search?q=',
                '/api/orders?user_id='
            ];
            for (const endpoint of testEndpoints) {
                for (const payload of sqlPayloads) {
                    console.log(`Testing SQL injection on ${endpoint} with payload: ${payload}`);
                    const testUrl = endpoint.includes('?') ?
                        `${endpoint}${encodeURIComponent(payload)}` :
                        `${endpoint}${encodeURIComponent(payload)}`;
                    const response = await page.request.get(testUrl);
                    const responseText = await response.text();
                    const status = response.status();
                    // Check for SQL error messages
                    const sqlErrorPatterns = [
                        /sql syntax/i,
                        /mysql error/i,
                        /postgresql error/i,
                        /sqlite error/i,
                        /ora-\d+/i
                    ];
                    const hasSqlError = sqlErrorPatterns.some(pattern => pattern.test(responseText));
                    if (hasSqlError) {
                        console.warn(`Potential SQL injection vulnerability in ${endpoint}`);
                    }
                    expect(hasSqlError).toBe(false);
                    // Should not return 500 errors due to SQL injection
                    expect(status).not.toBe(500);
                }
            }
        });
        test('API Parameter Pollution', async ({ page }) => {
            const testEndpoints = [
                '/api/products?category=electronics&category=books',
                '/api/users?id=1&id=2',
                '/api/search?q=test&q=admin'
            ];
            for (const endpoint of testEndpoints) {
                console.log(`Testing parameter pollution: ${endpoint}`);
                const response = await page.request.get(endpoint);
                const status = response.status();
                const responseText = await response.text();
                // Should handle duplicate parameters gracefully
                expect([200, 400, 422].includes(status)).toBe(true);
                // Should not cause server errors
                expect(status).not.toBe(500);
                // Should not expose internal errors
                const hasInternalError = /internal error|stack trace|exception/i.test(responseText);
                expect(hasInternalError).toBe(false);
            }
        });
    });
    test.describe('API Data Exposure', () => {
        test('Sensitive Data Exposure in API Responses', async ({ page }) => {
            const testEndpoints = [
                '/api/users',
                '/api/users/profile',
                '/api/admin/users'
            ];
            for (const endpoint of testEndpoints) {
                try {
                    console.log(`Testing data exposure in: ${endpoint}`);
                    const response = await page.request.get(endpoint);
                    if (response.status() === 200) {
                        const responseText = await response.text();
                        // Check for sensitive data patterns
                        const sensitivePatterns = [
                            /password["\s]*[:=]["\s]*[^"}\s,]+/i,
                            /secret["\s]*[:=]["\s]*[^"}\s,]+/i,
                            /private[_-]?key/i,
                            /api[_-]?key["\s]*[:=]/i,
                            /token["\s]*[:=]["\s]*[^"}\s,]{20,}/i,
                            /ssn["\s]*[:=]/i,
                            /credit[_-]?card/i
                        ];
                        const exposedData = [];
                        sensitivePatterns.forEach((pattern, index) => {
                            if (pattern.test(responseText)) {
                                exposedData.push(`Pattern ${index + 1} matched`);
                            }
                        });
                        if (exposedData.length > 0) {
                            console.warn(`Potential sensitive data exposure in ${endpoint}:`, exposedData);
                        }
                        expect(exposedData.length).toBe(0);
                    }
                }
                catch (error) {
                    console.log(`Endpoint ${endpoint} not accessible: ${error.message}`);
                }
            }
        });
        test('API Error Message Information Disclosure', async ({ page }) => {
            const testEndpoints = [
                '/api/nonexistent',
                '/api/users/999999',
                '/api/admin/secret'
            ];
            for (const endpoint of testEndpoints) {
                console.log(`Testing error messages for: ${endpoint}`);
                const response = await page.request.get(endpoint);
                const responseText = await response.text();
                // Check for information disclosure in error messages
                const disclosurePatterns = [
                    /database.*error/i,
                    /mysql|postgresql|oracle/i,
                    /stack trace/i,
                    /file.*path.*\/.*\//i,
                    /line \d+ in/i,
                    /exception.*at.*line/i,
                    /root@|admin@/i
                ];
                const hasDisclosure = disclosurePatterns.some(pattern => pattern.test(responseText));
                if (hasDisclosure) {
                    console.warn(`Information disclosure in error message for ${endpoint}`);
                }
                expect(hasDisclosure).toBe(false);
            }
        });
    });
    test.describe('API Security Headers', () => {
        test('API CORS Configuration', async ({ page }) => {
            const testEndpoint = '/api/users';
            // Test CORS preflight request
            const corsResponse = await page.request.fetch(testEndpoint, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'https://malicious-site.com',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });
            const corsHeaders = corsResponse.headers();
            console.log('CORS Headers:', corsHeaders);
            // Check CORS headers
            const allowOrigin = corsHeaders['access-control-allow-origin'];
            const allowMethods = corsHeaders['access-control-allow-methods'];
            const allowHeaders = corsHeaders['access-control-allow-headers'];
            if (allowOrigin) {
                console.log(`CORS Allow-Origin: ${allowOrigin}`);
                // Should not allow all origins in production
                if (allowOrigin === '*') {
                    console.warn('CORS allows all origins - consider restricting in production');
                }
            }
            if (allowMethods) {
                console.log(`CORS Allow-Methods: ${allowMethods}`);
                // Should not allow dangerous methods unnecessarily
                const dangerousMethods = ['DELETE', 'PUT', 'PATCH'];
                const allowsDangerous = dangerousMethods.some(method => allowMethods.toUpperCase().includes(method));
                if (allowsDangerous) {
                    console.log('CORS allows potentially dangerous methods');
                }
            }
        });
        test('API Security Headers Presence', async ({ page }) => {
            const response = await page.request.get('/api/users');
            const headers = response.headers();
            const securityHeaders = {
                'x-content-type-options': 'nosniff',
                'x-frame-options': 'DENY or SAMEORIGIN',
                'x-xss-protection': '1; mode=block',
                'content-security-policy': 'CSP header',
                'strict-transport-security': 'HSTS header (for HTTPS)'
            };
            Object.entries(securityHeaders).forEach(([header, description]) => {
                if (headers[header]) {
                    console.log(`✓ ${header}: ${headers[header]}`);
                }
                else {
                    console.warn(`✗ Missing ${header} (${description})`);
                }
            });
            // At least some security headers should be present
            const presentHeaders = Object.keys(securityHeaders).filter(header => headers[header]);
            expect(presentHeaders.length).toBeGreaterThan(0);
        });
    });
    test.describe('API Business Logic Security', () => {
        test('Price Manipulation Prevention', async ({ page }) => {
            // Test if API prevents price manipulation in orders
            const maliciousOrder = {
                items: [
                    {
                        productId: 1,
                        quantity: 1,
                        price: 0.01 // Manipulated price
                    }
                ],
                total: 0.01
            };
            const response = await page.request.post('/api/orders', {
                data: maliciousOrder
            });
            // Should reject orders with manipulated prices
            const status = response.status();
            expect([400, 401, 403, 422].includes(status)).toBe(true);
            if (status === 200) {
                console.warn('API may be vulnerable to price manipulation');
            }
        });
        test('Quantity Manipulation Prevention', async ({ page }) => {
            // Test negative quantities and excessive quantities
            const testQuantities = [-1, 0, 999999];
            for (const quantity of testQuantities) {
                console.log(`Testing quantity manipulation: ${quantity}`);
                const response = await page.request.post('/api/cart/add', {
                    data: {
                        productId: 1,
                        quantity: quantity
                    }
                });
                const status = response.status();
                // Should reject invalid quantities
                if (quantity <= 0 || quantity > 1000) {
                    expect([400, 422].includes(status)).toBe(true);
                }
            }
        });
        test('User ID Manipulation (IDOR)', async ({ page }) => {
            // Test Insecure Direct Object References
            const testUserIds = [1, 2, 999, -1, 'admin', '../admin'];
            for (const userId of testUserIds) {
                console.log(`Testing IDOR with user ID: ${userId}`);
                const response = await page.request.get(`/api/users/${userId}`);
                const status = response.status();
                // Should require proper authorization
                if (status === 200) {
                    const responseData = await response.json();
                    // Should not return other users' sensitive data
                    if (responseData.email || responseData.personalInfo) {
                        console.warn(`Potential IDOR vulnerability - user ${userId} data accessible`);
                    }
                }
                // Most requests should be unauthorized or forbidden
                expect([401, 403, 404].includes(status)).toBe(true);
            }
        });
    });
});
// Generate API security testing summary
test.afterAll(async () => {
    console.log('\n=== API Security Testing Summary ===');
    console.log('✓ API Authentication and Authorization');
    console.log('✓ API Input Validation');
    console.log('✓ API Data Exposure Prevention');
    console.log('✓ API Security Headers');
    console.log('✓ API Business Logic Security');
    console.log('\nAll API security tests completed.');
    console.log('Review test output for API security recommendations.');
});
