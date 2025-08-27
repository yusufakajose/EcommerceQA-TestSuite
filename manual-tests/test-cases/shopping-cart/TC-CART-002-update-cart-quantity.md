# Test Case: Update Product Quantity in Cart

## Test Case Information

- **Test Case ID**: TC-CART-002
- **Test Case Title**: Update Product Quantity in Shopping Cart
- **Category**: Shopping Cart
- **Priority**: High
- **Test Type**: Functional
- **Created By**: QA Team
- **Created Date**: 2024-01-15
- **Last Updated**: 2024-01-15

## Test Description

Verify that users can modify the quantity of products in their shopping cart and see updated totals.

## Preconditions

- [ ] User has at least one product in their shopping cart
- [ ] User is on the cart page or cart dropdown
- [ ] Product has sufficient stock for quantity increase

## Test Data

| Field            | Value  | Notes                     |
| ---------------- | ------ | ------------------------- |
| Initial Quantity | 2      | Starting quantity in cart |
| Updated Quantity | 5      | New quantity to set       |
| Product Price    | $29.99 | Example product price     |

## Test Steps

| Step | Action                                | Expected Result                               |
| ---- | ------------------------------------- | --------------------------------------------- |
| 1    | Navigate to shopping cart             | Cart page displays with existing items        |
| 2    | Locate quantity control for a product | Quantity input/selector is visible            |
| 3    | Note current quantity and total       | Current quantity is 2, subtotal is $59.98     |
| 4    | Change quantity from 2 to 5           | Quantity field accepts new value              |
| 5    | Click update button or trigger update | Update action is processed                    |
| 6    | Verify quantity update                | Quantity now shows 5                          |
| 7    | Check individual item total           | Item total updates to $149.95 (5 × $29.99)    |
| 8    | Verify cart subtotal update           | Cart subtotal reflects new quantity           |
| 9    | Check cart counter in header          | Header cart counter updates to new total      |
| 10   | Verify tax calculation update         | Tax amount recalculates based on new subtotal |
| 11   | Check final total                     | Grand total includes updated subtotal and tax |

## Expected Result

Product quantity updates successfully, all price calculations are accurate, cart totals reflect changes, and UI updates consistently across all cart displays.

## Test Environment

- **Browser**: All (Chrome, Firefox, Safari, Edge)
- **Device**: All (Desktop, Mobile, Tablet)
- **OS**: All
- **Resolution**: All standard resolutions

## Requirements Traceability

- **Requirement ID**: REQ-1.3
- **User Story**: As a customer, I want to modify quantities in my cart so that I can adjust my order before checkout

## Test Execution

- **Execution Date**: [To be filled during execution]
- **Executed By**: [To be filled during execution]
- **Test Result**: [Pass | Fail | Blocked | Skip]
- **Actual Result**: [What actually happened during execution]
- **Notes**: [Any additional observations or comments]
- **Defects Found**: [Link to bug reports if any]

## Attachments

- [ ] Screenshot of cart before quantity update
- [ ] Screenshot of quantity change process
- [ ] Screenshot of cart after quantity update
- [ ] Screenshot of updated totals
