# Security Testing Suite

Comprehensive security testing framework covering OWASP Top 10 vulnerabilities, API security, authentication security, and secure communication for the ecommerce application.

## Overview

This security testing suite provides automated validation of web application and API security using Playwright. It covers critical security vulnerabilities including XSS, SQL injection, authentication flaws, and security misconfigurations.

## Quick Start

### Prerequisites

- Node.js and npm installed
- Playwright test framework configured
- Target application running (default: http://localhost:3000)

### Running Tests

```bash
# Run all security tests
npx playwright test automated-tests/security-tests/

# Run web application security tests
npx playwright test security-test-suite.spec.js

# Run API security tests
npx playwright test api-security-tests.spec.js

# Run with HTML report
npx playwright test automated-tests/security-tests/ --reporter=html
```

## Test Suites

### 1. Web Application Security Tests (`security-test-suite.spec.js`)

Comprehensive web application security testing covering:

- **Input Validation and XSS Prevention**
  - Cross-Site Scripting (XSS) testing in forms and search
  - Reflected, stored, and DOM-based XSS prevention
  - Input sanitization and output encoding validation

- **SQL Injection Prevention**
  - SQL injection testing in login forms and search
  - Database error message analysis
  - Parameterized query validation

- **Authentication and Authorization**
  - Session management security
  - Password security requirements
  - Brute force protection testing
  - Session fixation and hijacking prevention

- **HTTPS and Secure Communication**
  - HTTPS enforcement testing
  - Secure cookie attributes validation
  - Security headers analysis (CSP, HSTS, X-Frame-Options)

- **File Upload Security**
  - File type validation testing
  - File size limit enforcement
  - Malicious file upload prevention

- **CSRF Protection**
  - Cross-Site Request Forgery token validation
  - Form security analysis

- **Information Disclosure Prevention**
  - Error message security testing
  - Directory traversal prevention
  - Sensitive information exposure detection

### 2. API Security Tests (`api-security-tests.spec.js`)

Comprehensive API security testing covering:

- **API Authentication and Authorization**
  - Endpoint authentication requirements
  - JWT token security analysis
  - API rate limiting testing

- **API Input Validation**
  - XSS prevention in API responses
  - SQL injection prevention in API parameters
  - Parameter pollution testing

- **API Data Exposure**
  - Sensitive data exposure in API responses
  - Error message information disclosure
  - API versioning security

- **API Security Headers**
  - CORS configuration analysis
  - API-specific security headers validation

- **API Business Logic Security**
  - Price manipulation prevention
  - Quantity manipulation testing
  - Insecure Direct Object References (IDOR)

## Security Testing Configuration

### Security Configuration (`security.config.js`)

Centralized configuration including:

- **Vulnerability Payloads**: XSS, SQL injection, command injection, path traversal
- **Test Scope**: Web application and API endpoints
- **Security Thresholds**: Vulnerability severity scoring
- **Compliance Frameworks**: OWASP Top 10, PCI DSS, GDPR
- **Security Headers**: Required and forbidden headers
- **Rate Limiting**: Login and API rate limiting configuration

### Key Configuration Options

```javascript
// Vulnerability payloads
payloads: {
  xss: [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>'
  ],
  sqlInjection: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --"
  ]
}

// Security thresholds
thresholds: {
  severity: {
    critical: { score: 10, maxAllowed: 0 },
    high: { score: 7, maxAllowed: 0 },
    medium: { score: 4, maxAllowed: 2 }
  }
}
```

## Utility Functions

### SecurityTestUtils Class

Reusable utility functions for security testing:

#### Core Methods

```javascript
// Test XSS vulnerabilities
const xssResults = await SecurityTestUtils.testXSSVulnerability(
  page, 
  'input[name="search"]', 
  xssPayloads
);

// Test SQL injection
const sqlResults = await SecurityTestUtils.testSQLInjection(
  page, 
  'input[name="email"]', 
  sqlPayloads
);

// Analyze security headers
const headerAnalysis = await SecurityTestUtils.analyzeSecurityHeaders(page);

// Analyze session security
const sessionAnalysis = await SecurityTestUtils.analyzeSessionSecurity(page);

// Test security misconfigurations
const configResults = await SecurityTestUtils.testSecurityMisconfigurations(page);
```

## OWASP Top 10 2021 Coverage

### A01:2021 - Broken Access Control
- ✅ Insecure Direct Object References (IDOR)
- ✅ Privilege escalation testing
- ✅ Access control bypass prevention

### A02:2021 - Cryptographic Failures
- ✅ Sensitive data exposure prevention
- ✅ HTTPS enforcement
- ✅ Secure cookie attributes

### A03:2021 - Injection
- ✅ SQL injection prevention
- ✅ XSS (Cross-Site Scripting) prevention
- ✅ Command injection prevention
- ✅ LDAP injection prevention

### A04:2021 - Insecure Design
- ✅ Business logic flaw testing
- ✅ Rate limiting validation
- ✅ Price manipulation prevention

### A05:2021 - Security Misconfiguration
- ✅ Security headers validation
- ✅ Error handling security
- ✅ Default configuration testing

### A06:2021 - Vulnerable Components
- ✅ Component version disclosure
- ✅ Dependency vulnerability assessment

### A07:2021 - Authentication Failures
- ✅ Password policy validation
- ✅ Session management security
- ✅ Brute force protection

### A08:2021 - Data Integrity Failures
- ✅ Code integrity validation
- ✅ Deserialization security

### A09:2021 - Logging Failures
- ✅ Security event logging
- ✅ Monitoring validation

### A10:2021 - Server-Side Request Forgery
- ✅ SSRF prevention testing
- ✅ Internal network access validation

## Security Testing Categories

### Input Validation Testing
- XSS prevention across all input fields
- SQL injection prevention in forms and APIs
- Command injection prevention
- Path traversal prevention
- Parameter pollution handling

### Authentication Security
- Password strength requirements
- Session management security
- Multi-factor authentication validation
- Brute force protection
- Account lockout mechanisms

### Authorization Testing
- Access control validation
- Privilege escalation prevention
- Role-based access control
- Resource authorization

### Communication Security
- HTTPS enforcement
- TLS configuration validation
- Certificate validation
- Secure cookie implementation

### Data Protection
- Sensitive data exposure prevention
- PII protection validation
- Credit card data security
- Data encryption verification

## Security Headers Validation

### Required Security Headers

```javascript
// Content Security Policy
'Content-Security-Policy': 'script-src \'self\'; object-src \'none\';'

// Clickjacking protection
'X-Frame-Options': 'DENY'

// MIME type sniffing prevention
'X-Content-Type-Options': 'nosniff'

// XSS protection
'X-XSS-Protection': '1; mode=block'

// HTTPS enforcement
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'

// Referrer policy
'Referrer-Policy': 'strict-origin-when-cross-origin'
```

### Security Score Calculation

- **Excellent (95-100)**: All security controls implemented
- **Good (80-94)**: Minor security improvements needed
- **Acceptable (65-79)**: Some security issues present
- **Poor (50-64)**: Significant security vulnerabilities
- **Critical (<50)**: Major security overhaul required

## Test Results and Reporting

### Vulnerability Severity Levels

- **Critical**: Immediate security risk requiring urgent attention
- **High**: Significant security vulnerability
- **Medium**: Important security improvement needed
- **Low**: Minor security enhancement
- **Info**: Security information or recommendation

### Sample Test Output

```
Security Testing Summary:
✓ XSS Prevention Testing - 15 payloads tested
✓ SQL Injection Prevention - 12 payloads tested
✓ Authentication Security - Session management validated
✓ HTTPS Configuration - Security headers present
✓ API Security - Rate limiting detected
✗ CSRF Protection - Missing CSRF tokens in 2 forms

Security Score: 82/100 (Good)
Recommendations:
- Implement CSRF protection for all forms
- Add Content-Security-Policy header
- Enable HSTS for HTTPS enforcement
```

## Integration

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Security Tests
  run: |
    npx playwright test automated-tests/security-tests/
    
- name: Generate Security Report
  run: |
    npx playwright show-report
    
- name: Check Security Thresholds
  run: |
    node scripts/security-threshold-check.js
```

### Custom Security Testing

```javascript
// Add to existing test files
const SecurityTestUtils = require('./utils/SecurityTestUtils');

test('Custom security validation', async ({ page }) => {
  await page.goto('/custom-page');
  
  // Test XSS prevention
  const xssResults = await SecurityTestUtils.testXSSVulnerability(
    page, 
    'input[name="custom-field"]', 
    ['<script>alert("XSS")</script>']
  );
  
  expect(xssResults.summary.vulnerabilities).toBe(0);
});
```

## Best Practices

### 1. Comprehensive Testing
- Test all input points and user interactions
- Include both positive and negative test cases
- Use realistic attack vectors and payloads
- Test across different user roles and permissions

### 2. Regular Security Testing
- Run security tests on every code change
- Schedule regular comprehensive security scans
- Monitor for new vulnerability patterns
- Update test payloads based on current threats

### 3. Security-First Development
- Implement security controls during development
- Use secure coding practices
- Validate all inputs and encode all outputs
- Follow principle of least privilege

### 4. Continuous Improvement
- Regular security training for development team
- Stay updated with latest security threats
- Implement security feedback loops
- Conduct periodic security reviews

## Troubleshooting

### Common Issues

1. **False Positives**
   ```bash
   # Review test configuration
   cat automated-tests/security-tests/security.config.js
   
   # Check security control implementation
   npx playwright test --debug security-test-suite.spec.js
   ```

2. **Test Performance Issues**
   ```bash
   # Run specific security test categories
   npx playwright test --grep "XSS Prevention"
   
   # Reduce payload sets for faster execution
   # Edit security.config.js payloads section
   ```

3. **Environment Configuration**
   ```bash
   # Set environment variables
   export BASE_URL=http://localhost:3000
   export API_BASE_URL=http://localhost:3000/api
   
   # Verify application is running
   curl -I http://localhost:3000
   ```

### Performance Optimization

```javascript
// Run focused security tests
const focusedConfig = {
  payloads: {
    xss: ['<script>alert("XSS")</script>'], // Reduced payload set
    sqlInjection: ["' OR '1'='1"] // Single payload for quick testing
  }
};
```

## Resources

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Playwright Security Testing](https://playwright.dev/docs/test-runners)
- [Web Security Academy](https://portswigger.net/web-security)

## Support

For questions or issues with security testing:

1. Check the troubleshooting section
2. Review security test configuration
3. Consult OWASP guidelines for specific vulnerabilities
4. Validate security controls are properly implemented

---

**Note**: This security testing suite provides automated vulnerability detection but should be supplemented with manual security testing and professional security assessments for comprehensive security validation.