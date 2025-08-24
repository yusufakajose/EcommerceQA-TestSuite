/**
 * Shopping Cart Page Object
 * Handles shopping cart functionality including item management and checkout initiation
 */
const { BasePage } = require('./BasePage');
const { NavigationComponent } = require('../components/NavigationComponent');
class ShoppingCartPage extends BasePage {
    constructor(page) {
        super(page);
        this.navigation = new NavigationComponent(page);
        // Page URL
        this.url = '/cart';
        // Page selectors
        this.selectors = {
            // Page elements
            pageTitle: '[data-testid="cart-title"]',
            cartContainer: '[data-testid="cart-container"]',
            emptyCartMessage: '[data-testid="empty-cart-message"]',
            // Cart items
            cartItem: '[data-testid="cart-item"]',
            itemImage: '[data-testid="item-image"]',
            itemName: '[data-testid="item-name"]',
            itemPrice: '[data-testid="item-price"]',
            itemQuantity: '[data-testid="item-quantity"]',
            itemSubtotal: '[data-testid="item-subtotal"]',
            // Quantity controls
            quantityInput: '[data-testid="quantity-input"]',
            increaseQuantityButton: '[data-testid="increase-quantity"]',
            decreaseQuantityButton: '[data-testid="decrease-quantity"]',
            updateQuantityButton: '[data-testid="update-quantity"]',
            // Item actions
            removeItemButton: '[data-testid="remove-item"]',
            saveForLaterButton: '[data-testid="save-for-later"]',
            moveToWishlistButton: '[data-testid="move-to-wishlist"]',
            // Cart summary
            cartSummary: '[data-testid="cart-summary"]',
            subtotalAmount: '[data-testid="subtotal-amount"]',
            taxAmount: '[data-testid="tax-amount"]',
            shippingAmount: '[data-testid="shipping-amount"]',
            discountAmount: '[data-testid="discount-amount"]',
            totalAmount: '[data-testid="total-amount"]',
            // Promo code
            promoCodeInput: '[data-testid="promo-code-input"]',
            applyPromoButton: '[data-testid="apply-promo-button"]',
            removePromoButton: '[data-testid="remove-promo-button"]',
            promoCodeError: '[data-testid="promo-code-error"]',
            promoCodeSuccess: '[data-testid="promo-code-success"]',
            // Shipping options
            shippingOptions: '[data-testid="shipping-options"]',
            shippingOption: '[data-testid="shipping-option"]',
            // Action buttons
            continueShoppingButton: '[data-testid="continue-shopping"]',
            clearCartButton: '[data-testid="clear-cart"]',
            checkoutButton: '[data-testid="checkout-button"]',
            // Saved items
            savedItemsSection: '[data-testid="saved-items"]',
            savedItem: '[data-testid="saved-item"]',
            moveToCartButton: '[data-testid="move-to-cart"]',
            // Loading states
            loadingSpinner: '[data-testid="loading-spinner"]',
            updatingCart: '[data-testid="updating-cart"]',
            // Messages
            successMessage: '[data-testid="success-message"]',
            errorMessage: '[data-testid="error-message"]'
        };
    }
    /**
     * Navigate to shopping cart page
     */
    async navigateToCart() {
        await this.navigateTo(this.url);
        await this.waitForPageLoad();
    }
    /**
     * Get all cart items
     */
    async getCartItems() {
        if (await this.isCartEmpty()) {
            return [];
        }
        await this.waitForElement(this.selectors.cartItem);
        return await this.page.locator(this.selectors.cartItem).all();
    }
    /**
     * Get cart item count
     */
    async getCartItemCount() {
        const items = await this.getCartItems();
        return items.length;
    }
    /**
     * Check if cart is empty
     */
    async isCartEmpty() {
        return await this.isElementVisible(this.selectors.emptyCartMessage);
    }
    /**
     * Get cart item details by index
     * @param {number} index - Item index (0-based)
     */
    async getCartItemDetails(index) {
        const items = await this.getCartItems();
        if (index >= items.length) {
            throw new Error(`Cart item index ${index} out of range. Found ${items.length} items.`);
        }
        const item = items[index];
        return {
            name: await item.locator(this.selectors.itemName).textContent(),
            price: await item.locator(this.selectors.itemPrice).textContent(),
            quantity: await item.locator(this.selectors.quantityInput).inputValue(),
            subtotal: await item.locator(this.selectors.itemSubtotal).textContent(),
            image: await item.locator(this.selectors.itemImage).getAttribute('src')
        };
    }
    /**
     * Update item quantity by index
     * @param {number} index - Item index (0-based)
     * @param {number} quantity - New quantity
     */
    async updateItemQuantity(index, quantity) {
        const items = await this.getCartItems();
        if (index >= items.length) {
            throw new Error(`Cart item index ${index} out of range. Found ${items.length} items.`);
        }
        const quantityInput = items[index].locator(this.selectors.quantityInput);
        await quantityInput.fill(quantity.toString());
        // Click update button if it exists, otherwise quantity might update automatically
        const updateButton = items[index].locator(this.selectors.updateQuantityButton);
        if (await updateButton.isVisible()) {
            await updateButton.click();
        }
        await this.waitForCartUpdate();
    }
    /**
     * Increase item quantity by index
     * @param {number} index - Item index (0-based)
     */
    async increaseItemQuantity(index) {
        const items = await this.getCartItems();
        if (index >= items.length) {
            throw new Error(`Cart item index ${index} out of range. Found ${items.length} items.`);
        }
        const increaseButton = items[index].locator(this.selectors.increaseQuantityButton);
        await increaseButton.click();
        await this.waitForCartUpdate();
    }
    /**
     * Decrease item quantity by index
     * @param {number} index - Item index (0-based)
     */
    async decreaseItemQuantity(index) {
        const items = await this.getCartItems();
        if (index >= items.length) {
            throw new Error(`Cart item index ${index} out of range. Found ${items.length} items.`);
        }
        const decreaseButton = items[index].locator(this.selectors.decreaseQuantityButton);
        await decreaseButton.click();
        await this.waitForCartUpdate();
    }
    /**
     * Remove item from cart by index
     * @param {number} index - Item index (0-based)
     */
    async removeCartItem(index) {
        const items = await this.getCartItems();
        if (index >= items.length) {
            throw new Error(`Cart item index ${index} out of range. Found ${items.length} items.`);
        }
        const removeButton = items[index].locator(this.selectors.removeItemButton);
        await removeButton.click();
        await this.waitForCartUpdate();
    }
    /**
     * Remove item from cart by name
     * @param {string} itemName - Item name
     */
    async removeCartItemByName(itemName) {
        const itemSelector = `${this.selectors.cartItem}:has(${this.selectors.itemName}:text("${itemName}"))`;
        const removeButton = `${itemSelector} ${this.selectors.removeItemButton}`;
        await this.clickElement(removeButton);
        await this.waitForCartUpdate();
    }
    /**
     * Save item for later by index
     * @param {number} index - Item index (0-based)
     */
    async saveItemForLater(index) {
        const items = await this.getCartItems();
        if (index >= items.length) {
            throw new Error(`Cart item index ${index} out of range. Found ${items.length} items.`);
        }
        const saveButton = items[index].locator(this.selectors.saveForLaterButton);
        await saveButton.click();
        await this.waitForCartUpdate();
    }
    /**
     * Move item to wishlist by index
     * @param {number} index - Item index (0-based)
     */
    async moveItemToWishlist(index) {
        const items = await this.getCartItems();
        if (index >= items.length) {
            throw new Error(`Cart item index ${index} out of range. Found ${items.length} items.`);
        }
        const wishlistButton = items[index].locator(this.selectors.moveToWishlistButton);
        await wishlistButton.click();
        await this.waitForCartUpdate();
    }
    /**
     * Apply promo code
     * @param {string} promoCode - Promo code to apply
     */
    async applyPromoCode(promoCode) {
        await this.fillInput(this.selectors.promoCodeInput, promoCode);
        await this.clickElement(this.selectors.applyPromoButton);
        await this.waitForCartUpdate();
    }
    /**
     * Remove applied promo code
     */
    async removePromoCode() {
        if (await this.isElementVisible(this.selectors.removePromoButton)) {
            await this.clickElement(this.selectors.removePromoButton);
            await this.waitForCartUpdate();
        }
    }
    /**
     * Select shipping option
     * @param {string} shippingOption - Shipping option value
     */
    async selectShippingOption(shippingOption) {
        const optionSelector = `${this.selectors.shippingOption}[value="${shippingOption}"]`;
        await this.clickElement(optionSelector);
        await this.waitForCartUpdate();
    }
    /**
     * Clear entire cart
     */
    async clearCart() {
        if (await this.isElementVisible(this.selectors.clearCartButton)) {
            await this.clickElement(this.selectors.clearCartButton);
            await this.waitForCartUpdate();
        }
    }
    /**
     * Continue shopping
     */
    async continueShopping() {
        await this.clickElement(this.selectors.continueShoppingButton);
        await this.waitForPageLoad();
    }
    /**
     * Proceed to checkout
     */
    async proceedToCheckout() {
        await this.clickElement(this.selectors.checkoutButton);
        await this.waitForPageLoad();
    }
    /**
     * Get cart summary details
     */
    async getCartSummary() {
        return {
            subtotal: await this.getTextContent(this.selectors.subtotalAmount),
            tax: await this.getTextContent(this.selectors.taxAmount),
            shipping: await this.getTextContent(this.selectors.shippingAmount),
            discount: await this.isElementVisible(this.selectors.discountAmount)
                ? await this.getTextContent(this.selectors.discountAmount)
                : '0.00',
            total: await this.getTextContent(this.selectors.totalAmount)
        };
    }
    /**
     * Get total amount
     */
    async getTotalAmount() {
        const totalText = await this.getTextContent(this.selectors.totalAmount);
        return parseFloat(totalText.replace(/[^0-9.]/g, ''));
    }
    /**
     * Get subtotal amount
     */
    async getSubtotalAmount() {
        const subtotalText = await this.getTextContent(this.selectors.subtotalAmount);
        return parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
    }
    /**
     * Wait for cart to update
     */
    async waitForCartUpdate() {
        // Wait for updating indicator to appear and disappear
        if (await this.isElementVisible(this.selectors.updatingCart)) {
            await this.waitForElementToDisappear(this.selectors.updatingCart);
        }
        await this.waitForNetworkIdle();
    }
    /**
     * Get saved items
     */
    async getSavedItems() {
        if (await this.isElementVisible(this.selectors.savedItemsSection)) {
            return await this.page.locator(this.selectors.savedItem).all();
        }
        return [];
    }
    /**
     * Move saved item back to cart
     * @param {number} index - Saved item index (0-based)
     */
    async moveSavedItemToCart(index) {
        const savedItems = await this.getSavedItems();
        if (index >= savedItems.length) {
            throw new Error(`Saved item index ${index} out of range. Found ${savedItems.length} items.`);
        }
        const moveButton = savedItems[index].locator(this.selectors.moveToCartButton);
        await moveButton.click();
        await this.waitForCartUpdate();
    }
    /**
     * Validate cart page is loaded
     */
    async validateCartPageLoaded() {
        await this.validateElementVisible(this.selectors.pageTitle);
        await this.validateElementVisible(this.selectors.cartContainer);
    }
    /**
     * Validate cart is empty
     */
    async validateCartIsEmpty() {
        await this.validateElementVisible(this.selectors.emptyCartMessage);
        const isEmpty = await this.isCartEmpty();
        expect(isEmpty).toBe(true);
    }
    /**
     * Validate cart has items
     * @param {number} expectedCount - Expected number of items (optional)
     */
    async validateCartHasItems(expectedCount) {
        const isEmpty = await this.isCartEmpty();
        expect(isEmpty).toBe(false);
        if (expectedCount !== undefined) {
            const actualCount = await this.getCartItemCount();
            expect(actualCount).toBe(expectedCount);
        }
    }
    /**
     * Validate item quantity updated
     * @param {number} index - Item index
     * @param {number} expectedQuantity - Expected quantity
     */
    async validateItemQuantityUpdated(index, expectedQuantity) {
        const itemDetails = await this.getCartItemDetails(index);
        expect(parseInt(itemDetails.quantity)).toBe(expectedQuantity);
    }
    /**
     * Validate promo code applied successfully
     */
    async validatePromoCodeApplied() {
        await this.validateElementVisible(this.selectors.promoCodeSuccess);
        await this.validateElementVisible(this.selectors.discountAmount);
    }
    /**
     * Validate promo code error
     * @param {string} expectedError - Expected error message
     */
    async validatePromoCodeError(expectedError) {
        await this.validateElementVisible(this.selectors.promoCodeError);
        const actualError = await this.getTextContent(this.selectors.promoCodeError);
        if (expectedError) {
            expect(actualError).toContain(expectedError);
        }
    }
    /**
     * Validate cart total calculation
     */
    async validateCartTotalCalculation() {
        const summary = await this.getCartSummary();
        const subtotal = parseFloat(summary.subtotal.replace(/[^0-9.]/g, ''));
        const tax = parseFloat(summary.tax.replace(/[^0-9.]/g, ''));
        const shipping = parseFloat(summary.shipping.replace(/[^0-9.]/g, ''));
        const discount = parseFloat(summary.discount.replace(/[^0-9.]/g, ''));
        const total = parseFloat(summary.total.replace(/[^0-9.]/g, ''));
        const expectedTotal = subtotal + tax + shipping - discount;
        expect(Math.abs(total - expectedTotal)).toBeLessThan(0.01); // Allow for rounding differences
    }
    /**
     * Validate checkout button is enabled
     */
    async validateCheckoutButtonEnabled() {
        const checkoutButton = this.page.locator(this.selectors.checkoutButton);
        const isDisabled = await checkoutButton.isDisabled();
        expect(isDisabled).toBe(false);
    }
    /**
     * Validate checkout button is disabled
     */
    async validateCheckoutButtonDisabled() {
        const checkoutButton = this.page.locator(this.selectors.checkoutButton);
        const isDisabled = await checkoutButton.isDisabled();
        expect(isDisabled).toBe(true);
    }
}
module.exports = { ShoppingCartPage };
