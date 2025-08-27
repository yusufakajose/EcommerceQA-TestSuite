/**
 * Page Objects Index
 * Exports all page objects for easy importing
 */

const { BasePage } = require('./BasePage');
const { LoginPage } = require('./LoginPage');
const { RegistrationPage } = require('./RegistrationPage');
const { ProductCatalogPage } = require('./ProductCatalogPage');
const { ShoppingCartPage } = require('./ShoppingCartPage');
const { CheckoutPage } = require('./CheckoutPage');

module.exports = {
  BasePage,
  LoginPage,
  RegistrationPage,
  ProductCatalogPage,
  ShoppingCartPage,
  CheckoutPage,
};
