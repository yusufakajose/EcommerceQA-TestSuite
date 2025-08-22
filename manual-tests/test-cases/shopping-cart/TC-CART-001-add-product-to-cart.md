# Test Case: Add Product to Shopping Cart

## Test Case Information
- **Test Case ID**: TC-CART-001
- **Test Case Title**: Add Product to Shopping Cart
- **Category**: Shopping Cart
- **Priority**: Critical
- **Test Type**: Functional
- **Created By**: QA Team
- **Created Date**: 2024-01-15
- **Last Updated**: 2024-01-15

## Test Description
Verify that users can successfully add products to their shopping cart and see appropriate feedback.

## Preconditions
- [ ] User is on a product detail page
- [ ] Product is in stock and available for purchase
- [ ] Shopping cart functionality is enabled

## Test Data
| Field | Value | Notes |
|-------|-------|-------|
| Product | Any available product | Must be in stock |
| Quantity | 2 | Test with quantity > 1 |
| Expected Cart Count | 2 | Should match selected quantity |

## Test Steps
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to a product detail page | Product page loads with "Add to Cart" button |
| 2 | Verify product is in stock | "Add to Cart" button is enabled |
| 3 | Select quantity of 2 | Quantity selector shows "2" |
| 4 | Click "Add to Cart" button | Button shows loading state briefly |
| 5 | Verify success feedback | Success message appears (e.g., "Added to cart") |
| 6 | Check cart icon/counter update | Cart counter shows "2" items |
| 7 | Click on cart icon | Cart dropdown or page opens |
| 8 | Verify product appears in cart | Product is listed with correct name and image |
| 9 | Check quantity in cart | Quantity shows "2" as selected |
| 10 | Verify price calculation | Individual price and total are correct |
| 11 | Check cart total | Subtotal reflects added items |

## Expected Result
Product is successfully added to cart with correct quantity, cart counter updates, success feedback is shown, and cart contents display accurately.

## Test Environment
- **Browser**: All (Chrome, Firefox, Safari, Edge)
- **Device**: All (Desktop, Mobile, Tablet)
- **OS**: All
- **Resolution**: All standard resolutions

## Requirements Traceability
- **Requirement ID**: REQ-1.3
- **User Story**: As a customer, I want to add products to my cart so that I can purchase multiple items together

## Test Execution
- **Execution Date**: [To be filled during execution]
- **Executed By**: [To be filled during execution]
- **Test Result**: [Pass | Fail | Blocked | Skip]
- **Actual Result**: [What actually happened during execution]
- **Notes**: [Any additional observations or comments]
- **Defects Found**: [Link to bug reports if any]

## Attachments
- [ ] Screenshot before adding to cart
- [ ] Screenshot of success message
- [ ] Screenshot of updated cart counter
- [ ] Screenshot of cart contents