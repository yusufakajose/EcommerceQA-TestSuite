/**
 * Product Catalog Page Object
 * Handles product browsing, searching, and filtering functionality
 */

const { BasePage } = require('./BasePage');
const { NavigationComponent } = require('../components/NavigationComponent');

class ProductCatalogPage extends BasePage {
  constructor(page) {
    super(page);
    this.navigation = new NavigationComponent(page);

    // Page URL
    this.url = '/products';

    // Page selectors
    this.selectors = {
      // Page elements
      pageTitle: '[data-testid="products-title"]',
      productGrid: '[data-testid="product-grid"]',
      productList: '[data-testid="product-list"]',

      // Product items
      productItem: '[data-testid="product-item"]',
      productImage: '[data-testid="product-image"]',
      productTitle: '[data-testid="product-title"]',
      productPrice: '[data-testid="product-price"]',
      productRating: '[data-testid="product-rating"]',
      productDescription: '[data-testid="product-description"]',
      addToCartButton: '[data-testid="add-to-cart"]',
      quickViewButton: '[data-testid="quick-view"]',
      wishlistButton: '[data-testid="add-to-wishlist"]',

      // Search and filters
      searchInput: '[data-testid="product-search"]',
      searchButton: '[data-testid="search-button"]',
      clearSearchButton: '[data-testid="clear-search"]',

      // Category filters
      categoryFilter: '[data-testid="category-filter"]',
      categoryOption: '[data-testid="category-option"]',

      // Price filters
      priceFilter: '[data-testid="price-filter"]',
      minPriceInput: '[data-testid="min-price"]',
      maxPriceInput: '[data-testid="max-price"]',
      applyPriceFilter: '[data-testid="apply-price-filter"]',

      // Brand filters
      brandFilter: '[data-testid="brand-filter"]',
      brandCheckbox: '[data-testid="brand-checkbox"]',

      // Rating filter
      ratingFilter: '[data-testid="rating-filter"]',
      ratingOption: '[data-testid="rating-option"]',

      // Sorting
      sortDropdown: '[data-testid="sort-dropdown"]',
      sortOption: '[data-testid="sort-option"]',

      // View options
      gridViewButton: '[data-testid="grid-view"]',
      listViewButton: '[data-testid="list-view"]',

      // Pagination
      pagination: '[data-testid="pagination"]',
      previousPageButton: '[data-testid="previous-page"]',
      nextPageButton: '[data-testid="next-page"]',
      pageNumber: '[data-testid="page-number"]',

      // Results info
      resultsCount: '[data-testid="results-count"]',
      noResultsMessage: '[data-testid="no-results"]',

      // Loading states
      loadingSpinner: '[data-testid="loading-spinner"]',

      // Quick view modal
      quickViewModal: '[data-testid="quick-view-modal"]',
      quickViewClose: '[data-testid="quick-view-close"]',
      quickViewAddToCart: '[data-testid="quick-view-add-to-cart"]',
    };
  }

  /**
   * Navigate to product catalog page
   */
  async navigateToProductCatalog() {
    await this.navigateTo(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Search for products
   * @param {string} searchTerm - Search term
   */
  async searchProducts(searchTerm) {
    await this.fillInput(this.selectors.searchInput, searchTerm);
    await this.clickElement(this.selectors.searchButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Clear search
   */
  async clearSearch() {
    if (await this.isElementVisible(this.selectors.clearSearchButton)) {
      await this.clickElement(this.selectors.clearSearchButton);
      await this.waitForNetworkIdle();
    }
  }

  /**
   * Filter by category
   * @param {string} category - Category name
   */
  async filterByCategory(category) {
    await this.selectOption(this.selectors.categoryFilter, category);
    await this.waitForNetworkIdle();
  }

  /**
   * Filter by price range
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   */
  async filterByPriceRange(minPrice, maxPrice) {
    if (minPrice !== undefined) {
      await this.fillInput(this.selectors.minPriceInput, minPrice.toString());
    }
    if (maxPrice !== undefined) {
      await this.fillInput(this.selectors.maxPriceInput, maxPrice.toString());
    }
    await this.clickElement(this.selectors.applyPriceFilter);
    await this.waitForNetworkIdle();
  }

  /**
   * Filter by brand
   * @param {string} brand - Brand name
   */
  async filterByBrand(brand) {
    const brandCheckbox = `${this.selectors.brandCheckbox}[value="${brand}"]`;
    await this.clickElement(brandCheckbox);
    await this.waitForNetworkIdle();
  }

  /**
   * Filter by rating
   * @param {number} rating - Minimum rating (1-5)
   */
  async filterByRating(rating) {
    const ratingOption = `${this.selectors.ratingOption}[data-rating="${rating}"]`;
    await this.clickElement(ratingOption);
    await this.waitForNetworkIdle();
  }

  /**
   * Sort products
   * @param {string} sortBy - Sort option (price-low, price-high, name, rating, newest)
   */
  async sortProducts(sortBy) {
    await this.selectOption(this.selectors.sortDropdown, sortBy);
    await this.waitForNetworkIdle();
  }

  /**
   * Switch to grid view
   */
  async switchToGridView() {
    await this.clickElement(this.selectors.gridViewButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to list view
   */
  async switchToListView() {
    await this.clickElement(this.selectors.listViewButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get all product items
   */
  async getProductItems() {
    await this.waitForElement(this.selectors.productItem);
    return await this.page.locator(this.selectors.productItem).all();
  }

  /**
   * Get product count
   */
  async getProductCount() {
    const products = await this.getProductItems();
    return products.length;
  }

  /**
   * Get product details by index
   * @param {number} index - Product index (0-based)
   */
  async getProductDetails(index) {
    const products = await this.getProductItems();
    if (index >= products.length) {
      throw new Error(`Product index ${index} out of range. Found ${products.length} products.`);
    }

    const product = products[index];

    return {
      title: await product.locator(this.selectors.productTitle).textContent(),
      price: await product.locator(this.selectors.productPrice).textContent(),
      rating: await product.locator(this.selectors.productRating).textContent(),
      image: await product.locator(this.selectors.productImage).getAttribute('src'),
    };
  }

  /**
   * Add product to cart by index
   * @param {number} index - Product index (0-based)
   */
  async addProductToCart(index) {
    const products = await this.getProductItems();
    if (index >= products.length) {
      throw new Error(`Product index ${index} out of range. Found ${products.length} products.`);
    }

    const addToCartButton = products[index].locator(this.selectors.addToCartButton);
    await addToCartButton.click();
    await this.waitForNetworkIdle();
  }

  /**
   * Add product to cart by name
   * @param {string} productName - Product name
   */
  async addProductToCartByName(productName) {
    const productSelector = `${this.selectors.productItem}:has(${this.selectors.productTitle}:text("${productName}"))`;
    const addToCartButton = `${productSelector} ${this.selectors.addToCartButton}`;

    await this.clickElement(addToCartButton);
    await this.waitForNetworkIdle();
  }

  /**
   * Quick view product by index
   * @param {number} index - Product index (0-based)
   */
  async quickViewProduct(index) {
    const products = await this.getProductItems();
    if (index >= products.length) {
      throw new Error(`Product index ${index} out of range. Found ${products.length} products.`);
    }

    const quickViewButton = products[index].locator(this.selectors.quickViewButton);
    await quickViewButton.click();
    await this.waitForElement(this.selectors.quickViewModal);
  }

  /**
   * Close quick view modal
   */
  async closeQuickView() {
    await this.clickElement(this.selectors.quickViewClose);
    await this.waitForElementToDisappear(this.selectors.quickViewModal);
  }

  /**
   * Add to cart from quick view
   */
  async addToCartFromQuickView() {
    await this.clickElement(this.selectors.quickViewAddToCart);
    await this.waitForNetworkIdle();
  }

  /**
   * Add product to wishlist by index
   * @param {number} index - Product index (0-based)
   */
  async addProductToWishlist(index) {
    const products = await this.getProductItems();
    if (index >= products.length) {
      throw new Error(`Product index ${index} out of range. Found ${products.length} products.`);
    }

    const wishlistButton = products[index].locator(this.selectors.wishlistButton);
    await wishlistButton.click();
    await this.waitForNetworkIdle();
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    if (await this.isElementVisible(this.selectors.nextPageButton)) {
      await this.clickElement(this.selectors.nextPageButton);
      await this.waitForNetworkIdle();
    }
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    if (await this.isElementVisible(this.selectors.previousPageButton)) {
      await this.clickElement(this.selectors.previousPageButton);
      await this.waitForNetworkIdle();
    }
  }

  /**
   * Navigate to specific page
   * @param {number} pageNumber - Page number
   */
  async goToPage(pageNumber) {
    const pageButton = `${this.selectors.pageNumber}[data-page="${pageNumber}"]`;
    if (await this.isElementVisible(pageButton)) {
      await this.clickElement(pageButton);
      await this.waitForNetworkIdle();
    }
  }

  /**
   * Get results count
   */
  async getResultsCount() {
    if (await this.isElementVisible(this.selectors.resultsCount)) {
      const countText = await this.getTextContent(this.selectors.resultsCount);
      const match = countText.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  /**
   * Check if no results message is displayed
   */
  async hasNoResults() {
    return await this.isElementVisible(this.selectors.noResultsMessage);
  }

  /**
   * Wait for products to load
   */
  async waitForProductsToLoad() {
    // Wait for loading spinner to disappear
    if (await this.isElementVisible(this.selectors.loadingSpinner)) {
      await this.waitForElementToDisappear(this.selectors.loadingSpinner);
    }

    // Wait for either products or no results message
    await Promise.race([
      this.waitForElement(this.selectors.productItem),
      this.waitForElement(this.selectors.noResultsMessage),
    ]);
  }

  /**
   * Validate product catalog page is loaded
   */
  async validateProductCatalogLoaded() {
    await this.validateElementVisible(this.selectors.pageTitle);
    await this.validateElementVisible(this.selectors.searchInput);
    await this.validateElementVisible(this.selectors.sortDropdown);
  }

  /**
   * Validate search results
   * @param {string} searchTerm - Search term used
   * @param {number} expectedCount - Expected number of results (optional)
   */
  async validateSearchResults(searchTerm, expectedCount) {
    await this.waitForProductsToLoad();

    if (expectedCount !== undefined) {
      const actualCount = await this.getProductCount();
      expect(actualCount).toBe(expectedCount);
    }

    // Validate search term appears in URL or results
    const currentUrl = await this.getCurrentUrl();
    expect(currentUrl).toContain('search');
  }

  /**
   * Validate no search results
   */
  async validateNoSearchResults() {
    await this.waitForProductsToLoad();
    const hasNoResults = await this.hasNoResults();
    expect(hasNoResults).toBe(true);
  }

  /**
   * Validate product added to cart
   */
  async validateProductAddedToCart() {
    // Check cart count increased or success message
    const cartCount = await this.navigation.getCartItemCount();
    expect(cartCount).toBeGreaterThan(0);
  }

  /**
   * Validate price filter results
   * @param {number} minPrice - Minimum price
   * @param {number} maxPrice - Maximum price
   */
  async validatePriceFilterResults(minPrice, maxPrice) {
    await this.waitForProductsToLoad();
    const products = await this.getProductItems();

    for (let i = 0; i < products.length; i++) {
      const productDetails = await this.getProductDetails(i);
      const price = parseFloat(productDetails.price.replace(/[^0-9.]/g, ''));

      if (minPrice !== undefined) {
        expect(price).toBeGreaterThanOrEqual(minPrice);
      }
      if (maxPrice !== undefined) {
        expect(price).toBeLessThanOrEqual(maxPrice);
      }
    }
  }

  /**
   * Validate category filter results
   * @param {string} category - Category name
   */
  async validateCategoryFilterResults(category) {
    await this.waitForProductsToLoad();

    // Check URL contains category or validate product categories
    const currentUrl = await this.getCurrentUrl();
    expect(currentUrl).toContain(category.toLowerCase());
  }

  /**
   * Validate sort order
   * @param {string} sortBy - Sort option
   */
  async validateSortOrder(sortBy) {
    await this.waitForProductsToLoad();
    const products = await this.getProductItems();

    if (products.length < 2) return; // Can't validate sort with less than 2 items

    const prices = [];
    for (let i = 0; i < Math.min(products.length, 5); i++) {
      const productDetails = await this.getProductDetails(i);
      const price = parseFloat(productDetails.price.replace(/[^0-9.]/g, ''));
      prices.push(price);
    }

    if (sortBy === 'price-low') {
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    } else if (sortBy === 'price-high') {
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    }
  }
}

module.exports = { ProductCatalogPage };
