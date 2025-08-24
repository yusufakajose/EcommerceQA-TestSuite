/**
 * Responsive Testing Utilities
 * Helper functions for responsive design and cross-browser testing
 */
class ResponsiveTestUtils {
    constructor(page) {
        this.page = page;
    }
    /**
     * Common device viewports for testing
     */
    static get VIEWPORTS() {
        return {
            // Desktop viewports
            DESKTOP_XL: { width: 1920, height: 1080, name: 'desktop-xl' },
            DESKTOP_LARGE: { width: 1440, height: 900, name: 'desktop-large' },
            DESKTOP: { width: 1280, height: 720, name: 'desktop' },
            LAPTOP: { width: 1366, height: 768, name: 'laptop' },
            // Tablet viewports
            TABLET_LANDSCAPE: { width: 1024, height: 768, name: 'tablet-landscape' },
            TABLET_PORTRAIT: { width: 768, height: 1024, name: 'tablet-portrait' },
            IPAD_PRO: { width: 1024, height: 1366, name: 'ipad-pro' },
            // Mobile viewports
            MOBILE_LARGE: { width: 414, height: 896, name: 'mobile-large' },
            MOBILE_MEDIUM: { width: 375, height: 667, name: 'mobile-medium' },
            MOBILE_SMALL: { width: 320, height: 568, name: 'mobile-small' },
            // Specific device viewports
            IPHONE_12: { width: 390, height: 844, name: 'iphone-12' },
            IPHONE_SE: { width: 375, height: 667, name: 'iphone-se' },
            PIXEL_5: { width: 393, height: 851, name: 'pixel-5' },
            GALAXY_S5: { width: 360, height: 640, name: 'galaxy-s5' }
        };
    }
    /**
     * Breakpoint categories for responsive testing
     */
    static get BREAKPOINTS() {
        return {
            MOBILE: { min: 0, max: 767 },
            TABLET: { min: 768, max: 1023 },
            DESKTOP: { min: 1024, max: Infinity }
        };
    }
    /**
     * Set viewport size and wait for layout to settle
     * @param {Object} viewport - Viewport configuration
     */
    async setViewport(viewport) {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        // Wait for responsive layout to settle
        await this.page.waitForTimeout(500);
        // Wait for any CSS transitions to complete
        await this.page.waitForFunction(() => {
            const elements = document.querySelectorAll('*');
            for (let element of elements) {
                const style = window.getComputedStyle(element);
                if (style.transitionDuration !== '0s' && style.transitionDuration !== '') {
                    return false;
                }
            }
            return true;
        }, { timeout: 5000 }).catch(() => {
            // Ignore timeout - transitions might not be detectable
        });
    }
    /**
     * Get current breakpoint category
     * @returns {string} - 'mobile', 'tablet', or 'desktop'
     */
    async getCurrentBreakpoint() {
        const viewport = this.page.viewportSize();
        const width = viewport.width;
        if (width <= ResponsiveTestUtils.BREAKPOINTS.MOBILE.max) {
            return 'mobile';
        }
        else if (width <= ResponsiveTestUtils.BREAKPOINTS.TABLET.max) {
            return 'tablet';
        }
        else {
            return 'desktop';
        }
    }
    /**
     * Check if element is visible in current viewport
     * @param {Locator} element - Playwright locator
     * @returns {boolean}
     */
    async isElementInViewport(element) {
        return await element.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return (rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth));
        });
    }
    /**
     * Check if element overflows viewport horizontally
     * @param {Locator} element - Playwright locator
     * @returns {boolean}
     */
    async doesElementOverflowHorizontally(element) {
        const elementBox = await element.boundingBox();
        const viewport = this.page.viewportSize();
        return elementBox.width > viewport.width ||
            elementBox.x + elementBox.width > viewport.width;
    }
    /**
     * Get element's responsive behavior
     * @param {Locator} element - Playwright locator
     * @param {Array} viewports - Array of viewport configurations
     * @returns {Object} - Responsive behavior data
     */
    async getElementResponsiveBehavior(element, viewports) {
        const behavior = {};
        for (const viewport of viewports) {
            await this.setViewport(viewport);
            const isVisible = await element.isVisible().catch(() => false);
            const boundingBox = isVisible ? await element.boundingBox() : null;
            behavior[viewport.name] = {
                visible: isVisible,
                boundingBox: boundingBox,
                inViewport: isVisible ? await this.isElementInViewport(element) : false,
                overflowsHorizontally: isVisible ? await this.doesElementOverflowHorizontally(element) : false
            };
        }
        return behavior;
    }
    /**
     * Test element across all standard viewports
     * @param {Locator} element - Playwright locator
     * @returns {Object} - Test results for all viewports
     */
    async testElementAcrossViewports(element) {
        const viewports = Object.values(ResponsiveTestUtils.VIEWPORTS);
        return await this.getElementResponsiveBehavior(element, viewports);
    }
    /**
     * Verify responsive grid layout
     * @param {Locator} gridContainer - Grid container locator
     * @param {Object} expectedColumns - Expected columns per breakpoint
     */
    async verifyResponsiveGrid(gridContainer, expectedColumns) {
        const results = {};
        for (const [breakpoint, columns] of Object.entries(expectedColumns)) {
            const viewport = this.getViewportForBreakpoint(breakpoint);
            await this.setViewport(viewport);
            // Get grid items
            const gridItems = gridContainer.locator('> *');
            const itemCount = await gridItems.count();
            if (itemCount === 0) {
                results[breakpoint] = { error: 'No grid items found' };
                continue;
            }
            // Get positions of first few items to determine columns
            const positions = [];
            const maxItems = Math.min(columns * 2, itemCount); // Check first 2 rows
            for (let i = 0; i < maxItems; i++) {
                const item = gridItems.nth(i);
                const box = await item.boundingBox();
                positions.push({ x: box.x, y: box.y, width: box.width, height: box.height });
            }
            // Analyze grid structure
            const actualColumns = this.analyzeGridColumns(positions);
            results[breakpoint] = {
                expected: columns,
                actual: actualColumns,
                matches: actualColumns === columns,
                positions: positions
            };
        }
        return results;
    }
    /**
     * Get viewport configuration for breakpoint
     * @param {string} breakpoint - 'mobile', 'tablet', or 'desktop'
     * @returns {Object} - Viewport configuration
     */
    getViewportForBreakpoint(breakpoint) {
        switch (breakpoint.toLowerCase()) {
            case 'mobile':
                return ResponsiveTestUtils.VIEWPORTS.MOBILE_MEDIUM;
            case 'tablet':
                return ResponsiveTestUtils.VIEWPORTS.TABLET_PORTRAIT;
            case 'desktop':
                return ResponsiveTestUtils.VIEWPORTS.DESKTOP;
            default:
                return ResponsiveTestUtils.VIEWPORTS.DESKTOP;
        }
    }
    /**
     * Analyze grid columns from item positions
     * @param {Array} positions - Array of item positions
     * @returns {number} - Number of columns detected
     */
    analyzeGridColumns(positions) {
        if (positions.length === 0)
            return 0;
        // Group items by Y position (same row)
        const rows = {};
        const tolerance = 10; // Allow for small differences in Y position
        positions.forEach((pos, index) => {
            let foundRow = false;
            for (const [rowY, items] of Object.entries(rows)) {
                if (Math.abs(pos.y - parseFloat(rowY)) <= tolerance) {
                    items.push({ ...pos, index });
                    foundRow = true;
                    break;
                }
            }
            if (!foundRow) {
                rows[pos.y] = [{ ...pos, index }];
            }
        });
        // Find the row with the most items (likely the first complete row)
        let maxColumns = 0;
        for (const items of Object.values(rows)) {
            maxColumns = Math.max(maxColumns, items.length);
        }
        return maxColumns;
    }
    /**
     * Check if text is properly truncated or wrapped
     * @param {Locator} element - Text element locator
     * @returns {Object} - Text overflow information
     */
    async checkTextOverflow(element) {
        return await element.evaluate((el) => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                textOverflow: style.textOverflow,
                whiteSpace: style.whiteSpace,
                overflow: style.overflow,
                overflowX: style.overflowX,
                overflowY: style.overflowY,
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                isOverflowing: el.scrollWidth > el.clientWidth,
                boundingBox: {
                    width: rect.width,
                    height: rect.height
                }
            };
        });
    }
    /**
     * Verify touch-friendly element sizes
     * @param {Locator} element - Interactive element locator
     * @returns {Object} - Touch accessibility information
     */
    async verifyTouchFriendlySize(element) {
        const boundingBox = await element.boundingBox();
        const minTouchSize = 44; // Minimum recommended touch target size
        return {
            width: boundingBox.width,
            height: boundingBox.height,
            isTouchFriendly: boundingBox.width >= minTouchSize && boundingBox.height >= minTouchSize,
            minSize: minTouchSize,
            widthDeficit: Math.max(0, minTouchSize - boundingBox.width),
            heightDeficit: Math.max(0, minTouchSize - boundingBox.height)
        };
    }
    /**
     * Test form usability on mobile devices
     * @param {Locator} form - Form locator
     * @returns {Object} - Mobile usability test results
     */
    async testMobileFormUsability(form) {
        await this.setViewport(ResponsiveTestUtils.VIEWPORTS.MOBILE_MEDIUM);
        const inputs = form.locator('input, select, textarea, button');
        const inputCount = await inputs.count();
        const results = [];
        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const inputType = await input.getAttribute('type') || 'text';
            const tagName = await input.evaluate(el => el.tagName.toLowerCase());
            const touchInfo = await this.verifyTouchFriendlySize(input);
            const inputMode = await input.getAttribute('inputmode');
            const autocomplete = await input.getAttribute('autocomplete');
            results.push({
                index: i,
                tagName: tagName,
                type: inputType,
                touchFriendly: touchInfo.isTouchFriendly,
                size: { width: touchInfo.width, height: touchInfo.height },
                inputMode: inputMode,
                autocomplete: autocomplete,
                hasProperKeyboard: this.hasProperMobileKeyboard(inputType, inputMode)
            });
        }
        return {
            totalInputs: inputCount,
            touchFriendlyInputs: results.filter(r => r.touchFriendly).length,
            inputsWithProperKeyboard: results.filter(r => r.hasProperKeyboard).length,
            details: results
        };
    }
    /**
     * Check if input has proper mobile keyboard configuration
     * @param {string} inputType - Input type attribute
     * @param {string} inputMode - Input mode attribute
     * @returns {boolean}
     */
    hasProperMobileKeyboard(inputType, inputMode) {
        const numericTypes = ['number', 'tel'];
        const emailTypes = ['email'];
        const urlTypes = ['url'];
        if (numericTypes.includes(inputType) || inputMode === 'numeric' || inputMode === 'tel') {
            return true;
        }
        if (emailTypes.includes(inputType) || inputMode === 'email') {
            return true;
        }
        if (urlTypes.includes(inputType) || inputMode === 'url') {
            return true;
        }
        return inputType === 'text' && !inputMode; // Default is acceptable for text
    }
    /**
     * Disable animations for consistent visual testing
     */
    async disableAnimations() {
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
      `
        });
    }
    /**
     * Hide dynamic content for consistent screenshots
     * @param {Array} selectors - CSS selectors for dynamic content
     */
    async hideDynamicContent(selectors = []) {
        const defaultSelectors = [
            '.timestamp',
            '.current-time',
            '.live-chat',
            '.notification-badge',
            '.price-change',
            '.stock-indicator',
            '.live-data',
            '.notification',
            '.dynamic-content'
        ];
        const allSelectors = [...defaultSelectors, ...selectors];
        await this.page.addStyleTag({
            content: `
        ${allSelectors.join(', ')} {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `
        });
    }
    /**
     * Wait for images to load completely
     * @param {number} timeout - Timeout in milliseconds
     */
    async waitForImages(timeout = 10000) {
        await this.page.waitForFunction(() => {
            const images = Array.from(document.images);
            return images.every(img => img.complete && img.naturalHeight !== 0);
        }, { timeout }).catch(() => {
            // Ignore timeout - some images might not load
            console.warn('Some images may not have loaded completely');
        });
    }
    /**
     * Get comprehensive responsive test report
     * @param {Locator} element - Element to test
     * @returns {Object} - Comprehensive test report
     */
    async getResponsiveTestReport(element) {
        const report = {
            timestamp: new Date().toISOString(),
            viewports: {},
            summary: {
                totalViewports: 0,
                visibleInViewports: 0,
                overflowingViewports: 0,
                touchFriendlyViewports: 0
            }
        };
        const viewports = Object.values(ResponsiveTestUtils.VIEWPORTS);
        for (const viewport of viewports) {
            await this.setViewport(viewport);
            const isVisible = await element.isVisible().catch(() => false);
            let viewportData = {
                visible: isVisible,
                viewport: viewport
            };
            if (isVisible) {
                const boundingBox = await element.boundingBox();
                const inViewport = await this.isElementInViewport(element);
                const overflowsHorizontally = await this.doesElementOverflowHorizontally(element);
                const touchInfo = await this.verifyTouchFriendlySize(element);
                viewportData = {
                    ...viewportData,
                    boundingBox: boundingBox,
                    inViewport: inViewport,
                    overflowsHorizontally: overflowsHorizontally,
                    touchFriendly: touchInfo.isTouchFriendly,
                    touchInfo: touchInfo
                };
                // Update summary
                report.summary.visibleInViewports++;
                if (overflowsHorizontally)
                    report.summary.overflowingViewports++;
                if (touchInfo.isTouchFriendly)
                    report.summary.touchFriendlyViewports++;
            }
            report.viewports[viewport.name] = viewportData;
            report.summary.totalViewports++;
        }
        return report;
    }
}
module.exports = ResponsiveTestUtils;
