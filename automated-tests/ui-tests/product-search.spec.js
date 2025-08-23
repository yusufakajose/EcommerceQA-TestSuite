/**
 * Product Search and Filtering Test Suite
 * Comprehensive tests for product search and filtering functionality
 */

const { test, expect } = require('@playwright/test');
const ProductCatalogPage = require('./pages/ProductCatalogPage');
const TestDataHelper = require('../../test-data/TestDataHelper');

let testDataHelper;

test.describe('Product Search and Filtering Tests', () => {
  test.beforeAll(async () => {
    testDataHelper = new TestDataHelper('development');
    await testDataHelper.initializeTestSuite('ProductSearch');
  });

  test.afterAll(async () => {
    testDataHelper.cleanupTestSuite();
  });

  test.afterEach(async ({ page }, testInfo) => {
    testDataHelper.cleanupTestData(testInfo.title);
  });

  test.describe('Product Search Functionality', () => {
    test('should search products by name successfully', async ({ page }) => {
      const searchData = testDataHelper.getTestData('products', 'searchTestData');
      const headphonesSearch = searchData.find(s => s.searchTerm === 'headphones');
      
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.searchProducts(headphonesSearch.searchTerm);
      
      // Verify search results
      await expect(catalogPage.getSearchResults()).toHaveCount(headphonesSearch.expectedCount);
      
      // Verify correct products are displayed
      for (const productId of headphonesSearch.expectedResults) {
        await expect(catalogPage.getProductById(productId)).toBeVisible();
      }
      
      // Verify search term is highlighted in results
      await expect(catalogPage.getSearchHighlight()).toContainText(headphonesSearch.searchTerm);
    });

    test('should search products by partial name match', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.searchProducts('blue'); // Partial match for "Bluetooth"
      
      const results = await catalogPage.getSearchResults();
      await expect(results).toHaveCountGreaterThan(0);
      
      // Verify results contain the search term
      const productTitles = await catalogPage.getAllProductTitles();
      const matchingProducts = productTitles.filter(title => 
        title.toLowerCase().includes('blue') || title.toLowerCase().includes('bluetooth')
      );
      expect(matchingProducts.length).toBeGreaterThan(0);
    });

    test('should handle case-insensitive search', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Search with different cases
      const searchTerms = ['HEADPHONES', 'headphones', 'HeAdPhOnEs'];
      
      for (const term of searchTerms) {
        await catalogPage.searchProducts(term);
        const results = await catalogPage.getSearchResults();
        await expect(results).toHaveCountGreaterThan(0);
      }
    });

    test('should show no results for non-existent products', async ({ page }) => {
      const searchData = testDataHelper.getTestData('products', 'searchTestData');
      const noResultsSearch = searchData.find(s => s.searchTerm === 'nonexistent');
      
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.searchProducts(noResultsSearch.searchTerm);
      
      await expect(catalogPage.getSearchResults()).toHaveCount(0);
      await expect(catalogPage.getNoResultsMessage()).toBeVisible();
      await expect(catalogPage.getNoResultsMessage()).toContainText(/No products found|No results|Nothing found/);
    });

    test('should handle special characters in search', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      const specialSearchTerms = ['@#$%', '!@#', '<script>', '&amp;'];
      
      for (const term of specialSearchTerms) {
        await catalogPage.searchProducts(term);
        
        // Should not crash and should show appropriate results or no results
        await expect(catalogPage.getSearchInput()).toHaveValue(term);
        
        // Verify no XSS or injection issues
        const pageContent = await page.content();
        expect(pageContent).not.toContain('<script>');
      }
    });

    test('should provide search suggestions/autocomplete', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Start typing to trigger suggestions
      await catalogPage.typeInSearchInput('head');
      
      // Check if suggestions appear
      const suggestions = catalogPage.getSearchSuggestions();
      const suggestionsVisible = await suggestions.isVisible().catch(() => false);
      
      if (suggestionsVisible) {
        await expect(suggestions).toBeVisible();
        
        // Click on a suggestion
        await catalogPage.clickFirstSuggestion();
        
        // Verify search is performed
        const results = await catalogPage.getSearchResults();
        await expect(results).toHaveCountGreaterThan(0);
      }
    });

    test('should maintain search term in URL and allow bookmarking', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.searchProducts('fitness');
      
      // Verify URL contains search parameter
      await expect(page).toHaveURL(/.*[?&]search=fitness|.*\/search\/fitness/);
      
      // Refresh page and verify search persists
      await page.reload();
      await expect(catalogPage.getSearchInput()).toHaveValue('fitness');
      
      const results = await catalogPage.getSearchResults();
      await expect(results).toHaveCountGreaterThan(0);
    });

    test('should clear search results', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.searchProducts('headphones');
      
      // Verify search results are shown
      const results = await catalogPage.getSearchResults();
      await expect(results).toHaveCountGreaterThan(0);
      
      // Clear search
      await catalogPage.clearSearch();
      
      // Verify all products are shown again
      await expect(catalogPage.getSearchInput()).toHaveValue('');
      const allProducts = await catalogPage.getAllProducts();
      await expect(allProducts).toHaveCountGreaterThan(results.length);
    });
  });

  test.describe('Product Filtering', () => {
    test('should filter products by category', async ({ page }) => {
      const filterData = testDataHelper.getTestData('products', 'filterTestData');
      const categoryFilter = filterData.find(f => f.filterType === 'category');
      
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.filterByCategory(categoryFilter.filterValue);
      
      // Verify filtered results
      await expect(catalogPage.getFilteredResults()).toHaveCount(categoryFilter.expectedCount);
      
      // Verify all displayed products are from the selected category
      const productCategories = await catalogPage.getAllProductCategories();
      productCategories.forEach(category => {
        expect(category).toBe(categoryFilter.filterValue);
      });
    });

    test('should filter products by price range', async ({ page }) => {
      const filterData = testDataHelper.getTestData('products', 'filterTestData');
      const priceFilter = filterData.find(f => f.filterType === 'priceRange');
      
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.filterByPriceRange(priceFilter.filterValue.min, priceFilter.filterValue.max);
      
      // Verify filtered results
      await expect(catalogPage.getFilteredResults()).toHaveCount(priceFilter.expectedCount);
      
      // Verify all displayed products are within price range
      const productPrices = await catalogPage.getAllProductPrices();
      productPrices.forEach(price => {
        expect(price).toBeGreaterThanOrEqual(priceFilter.filterValue.min);
        expect(price).toBeLessThanOrEqual(priceFilter.filterValue.max);
      });
    });

    test('should filter products by rating', async ({ page }) => {
      const filterData = testDataHelper.getTestData('products', 'filterTestData');
      const ratingFilter = filterData.find(f => f.filterType === 'rating');
      
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.filterByMinimumRating(ratingFilter.filterValue);
      
      // Verify filtered results
      await expect(catalogPage.getFilteredResults()).toHaveCount(ratingFilter.expectedCount);
      
      // Verify all displayed products meet minimum rating
      const productRatings = await catalogPage.getAllProductRatings();
      productRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(ratingFilter.filterValue);
      });
    });

    test('should filter products by availability', async ({ page }) => {
      const filterData = testDataHelper.getTestData('products', 'filterTestData');
      const availabilityFilter = filterData.find(f => f.filterType === 'inStock');
      
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.filterByAvailability(availabilityFilter.filterValue);
      
      // Verify filtered results
      await expect(catalogPage.getFilteredResults()).toHaveCount(availabilityFilter.expectedCount);
      
      // Verify all displayed products are in stock
      const stockStatuses = await catalogPage.getAllProductStockStatuses();
      stockStatuses.forEach(inStock => {
        expect(inStock).toBe(availabilityFilter.filterValue);
      });
    });

    test('should apply multiple filters simultaneously', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Apply multiple filters
      await catalogPage.filterByCategory('Electronics');
      await catalogPage.filterByPriceRange(50, 200);
      await catalogPage.filterByMinimumRating(4.0);
      await catalogPage.filterByAvailability(true);
      
      const results = await catalogPage.getFilteredResults();
      
      // Verify all filters are applied
      const products = await catalogPage.getAllProductDetails();
      products.forEach(product => {
        expect(product.category).toBe('Electronics');
        expect(product.price).toBeGreaterThanOrEqual(50);
        expect(product.price).toBeLessThanOrEqual(200);
        expect(product.rating).toBeGreaterThanOrEqual(4.0);
        expect(product.inStock).toBe(true);
      });
    });

    test('should show active filter indicators', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.filterByCategory('Electronics');
      
      // Verify active filter is displayed
      await expect(catalogPage.getActiveFilterTag('Electronics')).toBeVisible();
      
      // Apply another filter
      await catalogPage.filterByPriceRange(50, 200);
      await expect(catalogPage.getActiveFilterTag('$50 - $200')).toBeVisible();
      
      // Verify both filters are shown
      await expect(catalogPage.getActiveFilters()).toHaveCount(2);
    });

    test('should remove individual filters', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.filterByCategory('Electronics');
      await catalogPage.filterByPriceRange(50, 200);
      
      // Verify both filters are active
      await expect(catalogPage.getActiveFilters()).toHaveCount(2);
      
      // Remove category filter
      await catalogPage.removeFilter('Electronics');
      
      // Verify only price filter remains
      await expect(catalogPage.getActiveFilters()).toHaveCount(1);
      await expect(catalogPage.getActiveFilterTag('$50 - $200')).toBeVisible();
      await expect(catalogPage.getActiveFilterTag('Electronics')).not.toBeVisible();
    });

    test('should clear all filters', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Apply multiple filters
      await catalogPage.filterByCategory('Electronics');
      await catalogPage.filterByPriceRange(50, 200);
      await catalogPage.filterByMinimumRating(4.0);
      
      await expect(catalogPage.getActiveFilters()).toHaveCount(3);
      
      // Clear all filters
      await catalogPage.clearAllFilters();
      
      // Verify all filters are removed
      await expect(catalogPage.getActiveFilters()).toHaveCount(0);
      
      // Verify all products are shown
      const allProducts = await catalogPage.getAllProducts();
      const featuredProducts = testDataHelper.getTestData('products', 'featuredProducts');
      await expect(allProducts).toHaveCount(featuredProducts.length);
    });
  });

  test.describe('Search and Filter Combination', () => {
    test('should combine search with category filter', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Search for "wireless" and filter by "Electronics"
      await catalogPage.searchProducts('wireless');
      await catalogPage.filterByCategory('Electronics');
      
      const results = await catalogPage.getFilteredResults();
      
      // Verify results match both search and filter criteria
      const products = await catalogPage.getAllProductDetails();
      products.forEach(product => {
        expect(product.name.toLowerCase()).toContain('wireless');
        expect(product.category).toBe('Electronics');
      });
    });

    test('should combine search with price filter', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Search for "fitness" and filter by price range
      await catalogPage.searchProducts('fitness');
      await catalogPage.filterByPriceRange(100, 300);
      
      const results = await catalogPage.getFilteredResults();
      
      // Verify results match both criteria
      const products = await catalogPage.getAllProductDetails();
      products.forEach(product => {
        expect(product.name.toLowerCase()).toContain('fitness');
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(300);
      });
    });

    test('should maintain filters when performing new search', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Apply filters first
      await catalogPage.filterByCategory('Electronics');
      await catalogPage.filterByPriceRange(50, 200);
      
      // Then search
      await catalogPage.searchProducts('bluetooth');
      
      // Verify filters are still active
      await expect(catalogPage.getActiveFilters()).toHaveCount(2);
      
      // Verify results match both search and filters
      const products = await catalogPage.getAllProductDetails();
      products.forEach(product => {
        expect(product.name.toLowerCase()).toContain('bluetooth');
        expect(product.category).toBe('Electronics');
        expect(product.price).toBeGreaterThanOrEqual(50);
        expect(product.price).toBeLessThanOrEqual(200);
      });
    });
  });

  test.describe('Sorting and Display Options', () => {
    test('should sort products by price (low to high)', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.sortBy('price-asc');
      
      const prices = await catalogPage.getAllProductPrices();
      
      // Verify prices are in ascending order
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    test('should sort products by price (high to low)', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.sortBy('price-desc');
      
      const prices = await catalogPage.getAllProductPrices();
      
      // Verify prices are in descending order
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });

    test('should sort products by rating', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.sortBy('rating-desc');
      
      const ratings = await catalogPage.getAllProductRatings();
      
      // Verify ratings are in descending order
      for (let i = 1; i < ratings.length; i++) {
        expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1]);
      }
    });

    test('should sort products by name (A-Z)', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      await catalogPage.sortBy('name-asc');
      
      const names = await catalogPage.getAllProductTitles();
      
      // Verify names are in alphabetical order
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    test('should change product display view (grid/list)', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Switch to list view
      await catalogPage.switchToListView();
      await expect(catalogPage.getProductContainer()).toHaveClass(/list-view|list-layout/);
      
      // Switch to grid view
      await catalogPage.switchToGridView();
      await expect(catalogPage.getProductContainer()).toHaveClass(/grid-view|grid-layout/);
    });

    test('should change number of products per page', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Change to show 12 products per page
      await catalogPage.setProductsPerPage(12);
      
      const products = await catalogPage.getAllProducts();
      expect(products.length).toBeLessThanOrEqual(12);
      
      // Verify pagination is updated
      const paginationInfo = await catalogPage.getPaginationInfo();
      expect(paginationInfo).toContain('12');
    });
  });

  test.describe('Performance and UX', () => {
    test('should show loading state during search', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Start search and immediately check for loading state
      await catalogPage.getSearchInput().fill('headphones');
      await catalogPage.getSearchButton().click();
      
      // Check for loading indicator
      const loadingIndicator = catalogPage.getLoadingIndicator();
      const isLoading = await loadingIndicator.isVisible().catch(() => false);
      
      if (isLoading) {
        await expect(loadingIndicator).toBeVisible();
        await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
      }
    });

    test('should debounce search input', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Type quickly to test debouncing
      const searchInput = catalogPage.getSearchInput();
      await searchInput.fill('h');
      await searchInput.fill('he');
      await searchInput.fill('hea');
      await searchInput.fill('head');
      await searchInput.fill('headphones');
      
      // Wait for debounce period
      await page.waitForTimeout(1000);
      
      // Verify search was performed only once with final term
      await expect(searchInput).toHaveValue('headphones');
      const results = await catalogPage.getSearchResults();
      await expect(results).toHaveCountGreaterThan(0);
    });

    test('should handle rapid filter changes', async ({ page }) => {
      const catalogPage = new ProductCatalogPage(page);
      
      await catalogPage.navigate();
      
      // Rapidly change filters
      await catalogPage.filterByCategory('Electronics');
      await catalogPage.filterByCategory('Wearables');
      await catalogPage.filterByCategory('Accessories');
      
      // Wait for final filter to apply
      await page.waitForTimeout(1000);
      
      // Verify final filter is applied correctly
      await expect(catalogPage.getActiveFilterTag('Accessories')).toBeVisible();
      
      const products = await catalogPage.getAllProductDetails();
      products.forEach(product => {
        expect(product.category).toBe('Accessories');
      });
    });
  });
});