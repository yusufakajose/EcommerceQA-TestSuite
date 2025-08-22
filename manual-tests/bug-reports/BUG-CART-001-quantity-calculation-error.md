# Bug Report: Shopping Cart Quantity Calculation Error

## Bug Information
- **Bug ID**: BUG-CART-001
- **Bug Title**: Shopping cart displays incorrect total when quantity exceeds 10
- **Reporter**: QA Testing Team
- **Date Reported**: 2024-01-15
- **Last Updated**: 2024-01-15
- **Assigned To**: Frontend Development Team

## Classification
- **Severity**: Medium
- **Priority**: P3
- **Bug Type**: Functional
- **Component**: Shopping Cart
- **Status**: Open

## Environment Information
- **Browser**: Firefox 121.0
- **Operating System**: macOS 14.2
- **Device**: Desktop
- **Screen Resolution**: 1440x900
- **Application Version**: v1.2.3
- **Test Environment**: Staging

## Bug Description
### Summary
Shopping cart calculates incorrect total price when product quantity is set to more than 10 items, showing a lower total than expected.

### Detailed Description
When a user adds more than 10 units of any product to their shopping cart, the total price calculation becomes incorrect. The cart appears to calculate the total as if only 10 items were added, regardless of the actual quantity selected. This results in customers potentially being charged less than they should be, which could lead to revenue loss and inventory discrepancies.

## Steps to Reproduce
1. Navigate to any product detail page
2. Select quantity of 15 for a product priced at $29.99
3. Click "Add to Cart" button
4. Navigate to shopping cart page
5. Observe the quantity shows 15 items
6. Check the item total and cart subtotal

## Expected Result
- Item total should be: 15 × $29.99 = $449.85
- Cart subtotal should reflect $449.85 (plus tax if applicable)

## Actual Result
- Item total shows: $299.90 (appears to calculate as 10 × $29.99)
- Cart subtotal shows $299.90 instead of the correct $449.85
- Quantity display correctly shows 15 items

## Test Data Used
| Field | Value | Notes |
|-------|-------|-------|
| Product | Sample T-Shirt | Any product can reproduce this |
| Unit Price | $29.99 | Standard product price |
| Quantity | 15 | Any quantity > 10 triggers the bug |
| Expected Total | $449.85 | 15 × $29.99 |
| Actual Total | $299.90 | Incorrect calculation |

## Reproducibility
- **Frequency**: Always
- **Reproducible**: Yes
- **Conditions**: Occurs when quantity > 10 for any product

## Impact Assessment
### Business Impact
- **User Impact**: Customers may be undercharged, leading to revenue loss
- **Functional Impact**: Cart calculation functionality is unreliable
- **Revenue Impact**: Potential significant revenue loss on bulk orders

### Technical Impact
- **System Impact**: Cart calculation logic has boundary condition bug
- **Data Impact**: Order totals may be incorrect in database
- **Integration Impact**: May affect checkout and payment processing

## Attachments
- [x] **Screenshots**: Cart page showing incorrect total calculation
- [x] **Video Recording**: Step-by-step reproduction of the issue
- [ ] **Log Files**: Browser console logs captured
- [x] **Network Traces**: Cart update API calls captured
- [ ] **Database Queries**: Cart data investigation needed

## Additional Information
### Browser Console Errors
```
No JavaScript errors in console
```

### Network Requests
```
Request: PUT /api/cart/update
{
  "productId": "12345",
  "quantity": 15,
  "unitPrice": 29.99
}

Response: 200 OK
{
  "itemTotal": 299.90,
  "quantity": 15,
  "message": "Cart updated successfully"
}
```

### Related Issues
- **Related Bugs**: May be related to checkout calculation issues
- **Duplicate Of**: N/A
- **Blocks**: Accurate order processing
- **Blocked By**: None

## Resolution Information
### Root Cause Analysis
[To be filled by developer - likely a JavaScript calculation bug with quantities > 10]

### Fix Description
[To be filled by developer]

### Code Changes
[To be filled by developer]

### Testing Notes
[To be filled by tester - need to test various quantities and price points]

## Verification
- **Verification Date**: [Pending fix]
- **Verified By**: [Pending]
- **Verification Result**: [Pending]
- **Verification Notes**: [Test with quantities 11, 15, 20, 50, 100]

## Closure Information
- **Resolution**: [Pending]
- **Closed Date**: [Pending]
- **Closed By**: [Pending]
- **Closure Notes**: [Pending]