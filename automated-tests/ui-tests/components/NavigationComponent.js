/**
 * Navigation Component
 * Handles common navigation elements like header, menu, breadcrumbs
 */

const { BasePage } = require('../pages/BasePage');
const { expect } = require('@playwright/test');

class NavigationComponent extends BasePage {
  constructor(page) {
    super(page);

    // Navigation selectors
    this.selectors = {
      // Header navigation
      header: '[data-testid="header"]',
      logo: '[data-testid="logo"]',
      mainMenu: '[data-testid="main-menu"]',
      userMenu: '[data-testid="user-menu"]',
      cartIcon: '[data-testid="cart-icon"]',
      searchBox: '[data-testid="search-box"]',
      searchButton: '[data-testid="search-button"]',

      // Main navigation links
      homeLink: '[data-testid="nav-home"]',
      productsLink: '[data-testid="nav-products"]',
      categoriesLink: '[data-testid="nav-categories"]',
      aboutLink: '[data-testid="nav-about"]',
      contactLink: '[data-testid="nav-contact"]',

      // User menu items
      loginLink: '[data-testid="nav-login"]',
      registerLink: '[data-testid="nav-register"]',
      profileLink: '[data-testid="nav-profile"]',
      ordersLink: '[data-testid="nav-orders"]',
      logoutLink: '[data-testid="nav-logout"]',

      // Mobile navigation
      mobileMenuButton: '[data-testid="mobile-menu-button"]',
      mobileMenu: '[data-testid="mobile-menu"]',
      mobileMenuClose: '[data-testid="mobile-menu-close"]',

      // Breadcrumbs
      breadcrumbs: '[data-testid="breadcrumbs"]',
      breadcrumbItem: '[data-testid="breadcrumb-item"]',

      // Cart badge
      cartBadge: '[data-testid="cart-badge"]',
      cartCount: '[data-testid="cart-count"]',
    };
  }

  /**
   * Navigate to home page
   */
  async navigateToHome() {
    await this.clickElement(this.selectors.homeLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to products page
   */
  async navigateToProducts() {
    await this.clickElement(this.selectors.productsLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to categories page
   */
  async navigateToCategories() {
    await this.clickElement(this.selectors.categoriesLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin() {
    await this.clickElement(this.selectors.loginLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to register page
   */
  async navigateToRegister() {
    await this.clickElement(this.selectors.registerLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to user profile
   */
  async navigateToProfile() {
    await this.clickElement(this.selectors.profileLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to orders page
   */
  async navigateToOrders() {
    await this.clickElement(this.selectors.ordersLink);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to cart page
   */
  async navigateToCart() {
    await this.clickElement(this.selectors.cartIcon);
    await this.waitForPageLoad();
  }

  /**
   * Perform search
   * @param {string} searchTerm - Term to search for
   */
  async performSearch(searchTerm) {
    await this.fillInput(this.selectors.searchBox, searchTerm);
    await this.clickElement(this.selectors.searchButton);
    await this.waitForPageLoad();
  }

  /**
   * Logout user
   */
  async logout() {
    await this.clickElement(this.selectors.logoutLink);
    await this.waitForPageLoad();
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu() {
    if (await this.isElementVisible(this.selectors.mobileMenuButton)) {
      await this.clickElement(this.selectors.mobileMenuButton);
      await this.waitForElement(this.selectors.mobileMenu);
    }
  }

  /**
   * Close mobile menu
   */
  async closeMobileMenu() {
    if (await this.isElementVisible(this.selectors.mobileMenuClose)) {
      await this.clickElement(this.selectors.mobileMenuClose);
      await this.waitForElementToDisappear(this.selectors.mobileMenu);
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount() {
    if (await this.isElementVisible(this.selectors.cartCount)) {
      const countText = await this.getTextContent(this.selectors.cartCount);
      return parseInt(countText) || 0;
    }
    return 0;
  }

  /**
   * Validate navigation is visible
   */
  async validateNavigationVisible() {
    await this.validateElementVisible(this.selectors.header);
    await this.validateElementVisible(this.selectors.logo);
    await this.validateElementVisible(this.selectors.mainMenu);
  }

  /**
   * Validate user is logged in
   */
  async validateUserLoggedIn() {
    await this.validateElementVisible(this.selectors.userMenu);
    await this.validateElementVisible(this.selectors.profileLink);
    await this.validateElementVisible(this.selectors.logoutLink);
  }

  /**
   * Validate user is logged out
   */
  async validateUserLoggedOut() {
    await this.validateElementVisible(this.selectors.loginLink);
    await this.validateElementVisible(this.selectors.registerLink);
  }

  /**
   * Get breadcrumb trail
   */
  async getBreadcrumbTrail() {
    const breadcrumbItems = await this.page.locator(this.selectors.breadcrumbItem).all();
    const trail = [];

    for (const item of breadcrumbItems) {
      const text = await item.textContent();
      trail.push(text.trim());
    }

    return trail;
  }

  /**
   * Validate breadcrumb trail
   * @param {string[]} expectedTrail - Expected breadcrumb items
   */
  async validateBreadcrumbTrail(expectedTrail) {
    const actualTrail = await this.getBreadcrumbTrail();
    expect(actualTrail).toEqual(expectedTrail);
  }

  /**
   * Hover over user menu to reveal dropdown
   */
  async hoverUserMenu() {
    await this.hoverElement(this.selectors.userMenu);
    await this.page.waitForTimeout(500); // Wait for dropdown animation
  }

  /**
   * Check if mobile view is active
   */
  async isMobileView() {
    return await this.isElementVisible(this.selectors.mobileMenuButton);
  }

  /**
   * Validate search functionality
   * @param {string} searchTerm - Term to search for
   */
  async validateSearchFunctionality(searchTerm) {
    await this.performSearch(searchTerm);

    // Validate search results page or search term in URL
    const currentUrl = await this.getCurrentUrl();
    expect(currentUrl).toContain('search');
  }
}

module.exports = { NavigationComponent };
