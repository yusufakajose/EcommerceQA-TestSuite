/**
 * Accessibility Testing Utilities
 * Helper functions for comprehensive accessibility testing
 */
const AxeBuilder = require('@axe-core/playwright').default;
class AccessibilityTestUtils {
    /**
     * Run comprehensive accessibility scan with custom configuration
     */
    static async runAccessibilityScan(page, options = {}) {
        const defaultOptions = {
            tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
            rules: [],
            include: [],
            exclude: [],
            disableRules: []
        };
        const config = { ...defaultOptions, ...options };
        let axeBuilder = new AxeBuilder({ page });
        if (config.tags.length > 0) {
            axeBuilder = axeBuilder.withTags(config.tags);
        }
        if (config.rules.length > 0) {
            axeBuilder = axeBuilder.withRules(config.rules);
        }
        if (config.include.length > 0) {
            config.include.forEach(selector => {
                axeBuilder = axeBuilder.include(selector);
            });
        }
        if (config.exclude.length > 0) {
            config.exclude.forEach(selector => {
                axeBuilder = axeBuilder.exclude(selector);
            });
        }
        if (config.disableRules.length > 0) {
            axeBuilder = axeBuilder.disableRules(config.disableRules);
        }
        const results = await axeBuilder.analyze();
        return {
            ...results,
            summary: {
                passes: results.passes.length,
                violations: results.violations.length,
                incomplete: results.incomplete.length,
                inapplicable: results.inapplicable.length
            }
        };
    }
    /**
     * Check color contrast for specific elements
     */
    static async checkColorContrast(page, selectors = []) {
        const results = [];
        for (const selector of selectors) {
            const elements = await page.locator(selector).all();
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                try {
                    const styles = await element.evaluate(el => {
                        const computedStyles = window.getComputedStyle(el);
                        return {
                            color: computedStyles.color,
                            backgroundColor: computedStyles.backgroundColor,
                            fontSize: computedStyles.fontSize,
                            fontWeight: computedStyles.fontWeight
                        };
                    });
                    const text = await element.textContent();
                    results.push({
                        selector,
                        index: i,
                        text: text?.trim().substring(0, 50),
                        styles,
                        element: element
                    });
                }
                catch (error) {
                    console.warn(`Could not analyze color contrast for ${selector}[${i}]:`, error.message);
                }
            }
        }
        return results;
    }
    /**
     * Test keyboard navigation flow
     */
    static async testKeyboardNavigation(page, options = {}) {
        const defaultOptions = {
            maxTabs: 50,
            startFromTop: true,
            recordFocusPath: true
        };
        const config = { ...defaultOptions, ...options };
        const focusPath = [];
        if (config.startFromTop) {
            await page.keyboard.press('Home');
            await page.evaluate(() => document.body.focus());
        }
        let tabCount = 0;
        let previousFocusedElement = null;
        while (tabCount < config.maxTabs) {
            await page.keyboard.press('Tab');
            tabCount++;
            try {
                const focusedElement = await page.locator(':focus').first();
                if (await focusedElement.count() > 0) {
                    const elementInfo = await focusedElement.evaluate(el => ({
                        tagName: el.tagName.toLowerCase(),
                        id: el.id,
                        className: el.className,
                        textContent: el.textContent?.trim().substring(0, 30),
                        href: el.href,
                        type: el.type,
                        role: el.getAttribute('role'),
                        ariaLabel: el.getAttribute('aria-label'),
                        tabIndex: el.tabIndex
                    }));
                    const boundingBox = await focusedElement.boundingBox();
                    const isVisible = await focusedElement.isVisible();
                    const focusInfo = {
                        tabIndex: tabCount,
                        element: elementInfo,
                        isVisible,
                        boundingBox,
                        hasFocusIndicator: await this.checkFocusIndicator(focusedElement)
                    };
                    if (config.recordFocusPath) {
                        focusPath.push(focusInfo);
                    }
                    // Check if we've returned to the first element (completed cycle)
                    if (previousFocusedElement &&
                        elementInfo.tagName === previousFocusedElement.tagName &&
                        elementInfo.id === previousFocusedElement.id &&
                        tabCount > 5) {
                        console.log('Keyboard navigation cycle completed');
                        break;
                    }
                    previousFocusedElement = elementInfo;
                }
                else {
                    console.log('No focused element found at tab', tabCount);
                }
            }
            catch (error) {
                console.warn(`Error during keyboard navigation at tab ${tabCount}:`, error.message);
            }
        }
        return {
            totalTabs: tabCount,
            focusPath: config.recordFocusPath ? focusPath : [],
            summary: {
                focusableElements: focusPath.length,
                visibleElements: focusPath.filter(item => item.isVisible).length,
                elementsWithFocusIndicator: focusPath.filter(item => item.hasFocusIndicator).length
            }
        };
    }
    /**
     * Check if element has proper focus indicator
     */
    static async checkFocusIndicator(element) {
        try {
            const focusStyles = await element.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    outline: styles.outline,
                    outlineWidth: styles.outlineWidth,
                    outlineStyle: styles.outlineStyle,
                    outlineColor: styles.outlineColor,
                    boxShadow: styles.boxShadow,
                    border: styles.border,
                    borderWidth: styles.borderWidth
                };
            });
            // Check for various focus indicators
            const hasOutline = focusStyles.outline !== 'none' &&
                focusStyles.outlineWidth !== '0px' &&
                focusStyles.outlineStyle !== 'none';
            const hasBoxShadow = focusStyles.boxShadow !== 'none' &&
                focusStyles.boxShadow !== '';
            const hasBorder = focusStyles.borderWidth !== '0px';
            return hasOutline || hasBoxShadow || hasBorder;
        }
        catch (error) {
            console.warn('Could not check focus indicator:', error.message);
            return false;
        }
    }
    /**
     * Validate form accessibility
     */
    static async validateFormAccessibility(page, formSelector = 'form') {
        const forms = await page.locator(formSelector).all();
        const results = [];
        for (let formIndex = 0; formIndex < forms.length; formIndex++) {
            const form = forms[formIndex];
            const formResult = {
                formIndex,
                inputs: [],
                labels: [],
                fieldsets: [],
                issues: []
            };
            // Check all form inputs
            const inputs = await form.locator('input, select, textarea').all();
            for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
                const input = inputs[inputIndex];
                const inputInfo = await input.evaluate(el => ({
                    id: el.id,
                    name: el.name,
                    type: el.type,
                    required: el.required,
                    ariaLabel: el.getAttribute('aria-label'),
                    ariaLabelledBy: el.getAttribute('aria-labelledby'),
                    ariaDescribedBy: el.getAttribute('aria-describedby'),
                    ariaRequired: el.getAttribute('aria-required')
                }));
                // Check for associated label
                let hasLabel = false;
                if (inputInfo.id) {
                    const labelCount = await page.locator(`label[for="${inputInfo.id}"]`).count();
                    hasLabel = labelCount > 0;
                }
                const hasAriaLabel = !!inputInfo.ariaLabel;
                const hasAriaLabelledBy = !!inputInfo.ariaLabelledBy;
                const inputResult = {
                    ...inputInfo,
                    hasLabel,
                    hasAriaLabel,
                    hasAriaLabelledBy,
                    hasAccessibleLabel: hasLabel || hasAriaLabel || hasAriaLabelledBy
                };
                formResult.inputs.push(inputResult);
                // Record accessibility issues
                if (!inputResult.hasAccessibleLabel && inputInfo.type !== 'hidden' && inputInfo.type !== 'submit') {
                    formResult.issues.push(`Input ${inputInfo.name || inputInfo.id || inputIndex} lacks accessible label`);
                }
                if (inputInfo.required && !inputInfo.ariaRequired) {
                    formResult.issues.push(`Required input ${inputInfo.name || inputInfo.id || inputIndex} should have aria-required="true"`);
                }
            }
            results.push(formResult);
        }
        return results;
    }
    /**
     * Check heading structure and hierarchy
     */
    static async validateHeadingStructure(page) {
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        const headingStructure = [];
        const issues = [];
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            const headingInfo = await heading.evaluate(el => ({
                tagName: el.tagName.toLowerCase(),
                level: parseInt(el.tagName.charAt(1)),
                text: el.textContent?.trim(),
                id: el.id,
                className: el.className
            }));
            const isVisible = await heading.isVisible();
            headingStructure.push({
                ...headingInfo,
                isVisible,
                index: i
            });
        }
        // Check for proper hierarchy
        let hasH1 = false;
        for (let i = 0; i < headingStructure.length; i++) {
            const current = headingStructure[i];
            if (current.level === 1) {
                hasH1 = true;
            }
            if (i > 0) {
                const previous = headingStructure[i - 1];
                // Check for skipped levels
                if (current.level > previous.level + 1) {
                    issues.push(`Heading level skip: h${previous.level} to h${current.level} at "${current.text}"`);
                }
            }
        }
        if (!hasH1) {
            issues.push('Page should have at least one h1 heading');
        }
        return {
            headings: headingStructure,
            issues,
            summary: {
                totalHeadings: headingStructure.length,
                hasH1,
                hierarchyIssues: issues.length
            }
        };
    }
    /**
     * Check ARIA landmarks and page structure
     */
    static async validatePageStructure(page) {
        const landmarks = {
            banner: await page.locator('header, [role="banner"]').count(),
            navigation: await page.locator('nav, [role="navigation"]').count(),
            main: await page.locator('main, [role="main"]').count(),
            contentinfo: await page.locator('footer, [role="contentinfo"]').count(),
            complementary: await page.locator('aside, [role="complementary"]').count(),
            search: await page.locator('[role="search"]').count()
        };
        const issues = [];
        if (landmarks.banner === 0) {
            issues.push('Page should have a banner landmark (header or role="banner")');
        }
        if (landmarks.main === 0) {
            issues.push('Page should have a main landmark (main or role="main")');
        }
        if (landmarks.main > 1) {
            issues.push('Page should have only one main landmark');
        }
        return {
            landmarks,
            issues,
            summary: {
                totalLandmarks: Object.values(landmarks).reduce((sum, count) => sum + count, 0),
                structureIssues: issues.length
            }
        };
    }
    /**
     * Generate comprehensive accessibility report
     */
    static generateAccessibilityReport(testResults) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                totalViolations: 0,
                criticalViolations: 0,
                moderateViolations: 0,
                minorViolations: 0
            },
            testResults: testResults,
            recommendations: []
        };
        // Calculate summary statistics
        testResults.forEach(result => {
            report.summary.totalTests++;
            if (result.violations && result.violations.length === 0) {
                report.summary.passedTests++;
            }
            else {
                report.summary.failedTests++;
            }
            if (result.violations) {
                result.violations.forEach(violation => {
                    report.summary.totalViolations++;
                    switch (violation.impact) {
                        case 'critical':
                            report.summary.criticalViolations++;
                            break;
                        case 'serious':
                            report.summary.criticalViolations++;
                            break;
                        case 'moderate':
                            report.summary.moderateViolations++;
                            break;
                        case 'minor':
                            report.summary.minorViolations++;
                            break;
                    }
                });
            }
        });
        // Generate recommendations
        if (report.summary.criticalViolations > 0) {
            report.recommendations.push('Address critical accessibility violations immediately');
        }
        if (report.summary.moderateViolations > 0) {
            report.recommendations.push('Review and fix moderate accessibility issues');
        }
        if (report.summary.totalViolations === 0) {
            report.recommendations.push('Great job! No accessibility violations found');
        }
        return report;
    }
}
module.exports = AccessibilityTestUtils;
