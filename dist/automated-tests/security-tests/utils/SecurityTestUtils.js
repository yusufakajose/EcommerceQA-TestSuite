/**
 * Security Testing Utilities
 * Helper functions for comprehensive security testing
 */
class SecurityTestUtils {
    /**
     * Test for XSS vulnerabilities in input fields
     */
    static async testXSSVulnerability(page, inputSelector, payloads) {
        const results = [];
        const inputElement = page.locator(inputSelector);
        if (await inputElement.count() === 0) {
            return { tested: false, reason: 'Input element not found' };
        }
        for (const payload of payloads) {
            try {
                // Clear and fill input with XSS payload
                await inputElement.clear();
                await inputElement.fill(payload);
                // Check if payload is reflected in DOM
                const pageContent = await page.content();
                const isReflected = pageContent.includes(payload);
                const isEscaped = pageContent.includes('&lt;') || pageContent.includes('&amp;');
                // Check for script execution
                let scriptExecuted = false;
                page.on('dialog', dialog => {
                    scriptExecuted = true;
                    dialog.dismiss();
                });
                await page.waitForTimeout(500);
                results.push({
                    payload,
                    isReflected,
                    isEscaped,
                    scriptExecuted,
                    vulnerable: isReflected && !isEscaped && scriptExecuted
                });
            }
            catch (error) {
                results.push({
                    payload,
                    error: error.message,
                    vulnerable: false
                });
            }
        }
        return {
            tested: true,
            inputSelector,
            results,
            summary: {
                totalTests: results.length,
                vulnerabilities: results.filter(r => r.vulnerable).length,
                escaped: results.filter(r => r.isEscaped).length
            }
        };
    }
    /**
     * Test for SQL injection vulnerabilities
     */
    static async testSQLInjection(page, inputSelector, payloads) {
        const results = [];
        const inputElement = page.locator(inputSelector);
        if (await inputElement.count() === 0) {
            return { tested: false, reason: 'Input element not found' };
        }
        for (const payload of payloads) {
            try {
                await inputElement.clear();
                await inputElement.fill(payload);
                // Submit form or trigger search
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000);
                const pageContent = await page.textContent('body');
                // Check for SQL error messages
                const sqlErrorPatterns = [
                    /sql syntax/i,
                    /mysql error/i,
                    /postgresql error/i,
                    /ora-\d+/i,
                    /microsoft ole db/i,
                    /sqlite error/i,
                    /syntax error/i,
                    /unclosed quotation mark/i,
                    /you have an error in your sql syntax/i
                ];
                const hasSqlError = sqlErrorPatterns.some(pattern => pattern.test(pageContent));
                const hasServerError = pageContent.includes('500') ||
                    pageContent.includes('Internal Server Error');
                results.push({
                    payload,
                    hasSqlError,
                    hasServerError,
                    vulnerable: hasSqlError,
                    pageContent: pageContent.substring(0, 200) // First 200 chars for analysis
                });
            }
            catch (error) {
                results.push({
                    payload,
                    error: error.message,
                    vulnerable: false
                });
            }
        }
        return {
            tested: true,
            inputSelector,
            results,
            summary: {
                totalTests: results.length,
                vulnerabilities: results.filter(r => r.vulnerable).length,
                serverErrors: results.filter(r => r.hasServerError).length
            }
        };
    }
    /**
     * Analyze security headers
     */
    static async analyzeSecurityHeaders(page) {
        const response = await page.goto(page.url());
        const headers = response.headers();
        const securityHeaders = {
            'content-security-policy': {
                present: !!headers['content-security-policy'],
                value: headers['content-security-policy'],
                recommendation: 'Implement CSP to prevent XSS attacks'
            },
            'x-frame-options': {
                present: !!headers['x-frame-options'],
                value: headers['x-frame-options'],
                recommendation: 'Add X-Frame-Options to prevent clickjacking'
            },
            'x-content-type-options': {
                present: !!headers['x-content-type-options'],
                value: headers['x-content-type-options'],
                recommendation: 'Add X-Content-Type-Options: nosniff'
            },
            'x-xss-protection': {
                present: !!headers['x-xss-protection'],
                value: headers['x-xss-protection'],
                recommendation: 'Add X-XSS-Protection header'
            },
            'strict-transport-security': {
                present: !!headers['strict-transport-security'],
                value: headers['strict-transport-security'],
                recommendation: 'Add HSTS header for HTTPS sites'
            },
            'referrer-policy': {
                present: !!headers['referrer-policy'],
                value: headers['referrer-policy'],
                recommendation: 'Add Referrer-Policy header'
            }
        };
        const analysis = {
            headers: securityHeaders,
            score: 0,
            recommendations: []
        };
        // Calculate security score
        Object.entries(securityHeaders).forEach(([header, info]) => {
            if (info.present) {
                analysis.score += 1;
            }
            else {
                analysis.recommendations.push(info.recommendation);
            }
        });
        analysis.score = Math.round((analysis.score / Object.keys(securityHeaders).length) * 100);
        return analysis;
    }
    /**
     * Test session security
     */
    static async analyzeSessionSecurity(page) {
        const cookies = await page.context().cookies();
        const sessionCookies = cookies.filter(cookie => cookie.name.toLowerCase().includes('session') ||
            cookie.name.toLowerCase().includes('auth') ||
            cookie.name.toLowerCase().includes('token'));
        const analysis = {
            totalCookies: cookies.length,
            sessionCookies: sessionCookies.length,
            securityIssues: [],
            recommendations: []
        };
        sessionCookies.forEach(cookie => {
            const issues = [];
            if (!cookie.httpOnly) {
                issues.push('Missing HttpOnly flag - vulnerable to XSS');
            }
            if (page.url().startsWith('https://') && !cookie.secure) {
                issues.push('Missing Secure flag for HTTPS site');
            }
            if (!['Strict', 'Lax', 'None'].includes(cookie.sameSite)) {
                issues.push('Missing or invalid SameSite attribute');
            }
            if (cookie.value.length < 16) {
                issues.push('Session token appears to be too short');
            }
            analysis.securityIssues.push({
                cookieName: cookie.name,
                issues
            });
        });
        // Generate recommendations
        if (sessionCookies.length === 0) {
            analysis.recommendations.push('No session cookies found - verify session management');
        }
        const totalIssues = analysis.securityIssues.reduce((sum, cookie) => sum + cookie.issues.length, 0);
        if (totalIssues > 0) {
            analysis.recommendations.push('Fix session cookie security attributes');
        }
        return analysis;
    }
    /**
     * Test for common security misconfigurations
     */
    static async testSecurityMisconfigurations(page) {
        const baseUrl = new URL(page.url()).origin;
        const testPaths = [
            '/.env',
            '/config.php',
            '/wp-config.php',
            '/admin',
            '/debug',
            '/test',
            '/phpinfo.php',
            '/server-status',
            '/server-info',
            '/.git/config',
            '/robots.txt',
            '/sitemap.xml'
        ];
        const results = [];
        for (const path of testPaths) {
            try {
                const response = await page.goto(`${baseUrl}${path}`);
                const status = response.status();
                const content = await page.textContent('body');
                const isAccessible = status === 200;
                const hasSensitiveInfo = this.checkForSensitiveInformation(content);
                results.push({
                    path,
                    status,
                    accessible: isAccessible,
                    hasSensitiveInfo,
                    risk: isAccessible && hasSensitiveInfo ? 'HIGH' : isAccessible ? 'MEDIUM' : 'LOW'
                });
            }
            catch (error) {
                results.push({
                    path,
                    status: 'ERROR',
                    accessible: false,
                    error: error.message,
                    risk: 'LOW'
                });
            }
        }
        return {
            tested: testPaths.length,
            results,
            summary: {
                accessible: results.filter(r => r.accessible).length,
                highRisk: results.filter(r => r.risk === 'HIGH').length,
                mediumRisk: results.filter(r => r.risk === 'MEDIUM').length
            }
        };
    }
    /**
     * Check content for sensitive information
     */
    static checkForSensitiveInformation(content) {
        const sensitivePatterns = [
            /password\s*[:=]\s*[^\s]+/i,
            /api[_-]?key\s*[:=]\s*[^\s]+/i,
            /secret\s*[:=]\s*[^\s]+/i,
            /database.*password/i,
            /mysql.*root/i,
            /admin.*password/i,
            /private.*key/i,
            /access.*token/i,
            /connection.*string/i,
            /debug.*true/i
        ];
        return sensitivePatterns.some(pattern => pattern.test(content));
    }
    /**
     * Test file upload security
     */
    static async testFileUploadSecurity(page, fileInputSelector) {
        const fileInput = page.locator(fileInputSelector);
        if (await fileInput.count() === 0) {
            return { tested: false, reason: 'File input not found' };
        }
        const analysis = {
            hasAcceptAttribute: false,
            acceptedTypes: [],
            allowsExecutables: false,
            hasSizeLimit: false,
            recommendations: []
        };
        // Check accept attribute
        const acceptAttribute = await fileInput.getAttribute('accept');
        if (acceptAttribute) {
            analysis.hasAcceptAttribute = true;
            analysis.acceptedTypes = acceptAttribute.split(',').map(type => type.trim());
            // Check for dangerous file types
            const dangerousTypes = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.php', '.asp'];
            analysis.allowsExecutables = dangerousTypes.some(type => acceptAttribute.toLowerCase().includes(type));
        }
        else {
            analysis.recommendations.push('Add accept attribute to restrict file types');
        }
        // Check for size limit attributes
        const maxSizeAttr = await fileInput.getAttribute('data-max-size');
        const maxLengthAttr = await fileInput.getAttribute('maxlength');
        if (maxSizeAttr || maxLengthAttr) {
            analysis.hasSizeLimit = true;
        }
        else {
            analysis.recommendations.push('Add file size limits');
        }
        // Security recommendations
        if (analysis.allowsExecutables) {
            analysis.recommendations.push('Remove executable file types from accepted types');
        }
        if (!analysis.hasAcceptAttribute) {
            analysis.recommendations.push('Implement server-side file type validation');
        }
        return analysis;
    }
    /**
     * Test for CSRF protection
     */
    static async testCSRFProtection(page, formSelector = 'form') {
        const forms = await page.locator(formSelector).all();
        const results = [];
        for (let i = 0; i < forms.length; i++) {
            const form = forms[i];
            const formAnalysis = {
                formIndex: i,
                hasCSRFToken: false,
                tokenName: null,
                tokenValue: null,
                method: 'GET',
                recommendations: []
            };
            // Check form method
            const method = await form.getAttribute('method');
            formAnalysis.method = method || 'GET';
            // Look for CSRF tokens
            const csrfInputs = await form.locator('input[name*="csrf"], input[name*="token"], input[name="_token"]').all();
            if (csrfInputs.length > 0) {
                const csrfInput = csrfInputs[0];
                formAnalysis.hasCSRFToken = true;
                formAnalysis.tokenName = await csrfInput.getAttribute('name');
                formAnalysis.tokenValue = await csrfInput.getAttribute('value');
            }
            // Check hidden inputs that might be tokens
            const hiddenInputs = await form.locator('input[type="hidden"]').all();
            for (const hiddenInput of hiddenInputs) {
                const name = await hiddenInput.getAttribute('name');
                const value = await hiddenInput.getAttribute('value');
                if (name && value && value.length > 10 && !formAnalysis.hasCSRFToken) {
                    formAnalysis.hasCSRFToken = true;
                    formAnalysis.tokenName = name;
                    formAnalysis.tokenValue = value.substring(0, 10) + '...'; // Truncate for security
                }
            }
            // Generate recommendations
            if (!formAnalysis.hasCSRFToken && formAnalysis.method.toLowerCase() === 'post') {
                formAnalysis.recommendations.push('Add CSRF token to POST form');
            }
            if (formAnalysis.hasCSRFToken && formAnalysis.tokenValue && formAnalysis.tokenValue.length < 16) {
                formAnalysis.recommendations.push('CSRF token appears to be too short');
            }
            results.push(formAnalysis);
        }
        return {
            totalForms: forms.length,
            results,
            summary: {
                formsWithCSRF: results.filter(r => r.hasCSRFToken).length,
                postFormsWithoutCSRF: results.filter(r => !r.hasCSRFToken && r.method.toLowerCase() === 'post').length
            }
        };
    }
    /**
     * Generate comprehensive security report
     */
    static generateSecurityReport(testResults) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: 0,
                vulnerabilities: 0,
                warnings: 0,
                passed: 0,
                securityScore: 0
            },
            categories: {
                inputValidation: { tests: 0, issues: 0 },
                authentication: { tests: 0, issues: 0 },
                sessionManagement: { tests: 0, issues: 0 },
                encryption: { tests: 0, issues: 0 },
                errorHandling: { tests: 0, issues: 0 },
                configuration: { tests: 0, issues: 0 }
            },
            recommendations: [],
            criticalIssues: [],
            testResults
        };
        // Analyze test results
        testResults.forEach(result => {
            report.summary.totalTests++;
            if (result.vulnerable || result.risk === 'HIGH') {
                report.summary.vulnerabilities++;
                report.criticalIssues.push(result);
            }
            else if (result.risk === 'MEDIUM' || result.warnings > 0) {
                report.summary.warnings++;
            }
            else {
                report.summary.passed++;
            }
        });
        // Calculate security score
        const totalIssues = report.summary.vulnerabilities + report.summary.warnings;
        report.summary.securityScore = Math.max(0, 100 - (totalIssues * 10));
        // Generate recommendations
        if (report.summary.vulnerabilities > 0) {
            report.recommendations.push('Address critical security vulnerabilities immediately');
        }
        if (report.summary.warnings > 0) {
            report.recommendations.push('Review and fix security warnings');
        }
        if (report.summary.securityScore < 70) {
            report.recommendations.push('Implement comprehensive security measures');
        }
        return report;
    }
}
module.exports = SecurityTestUtils;
