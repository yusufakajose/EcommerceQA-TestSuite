# Test Case: User Login with Invalid Credentials

## Test Case Information
- **Test Case ID**: TC-AUTH-003
- **Test Case Title**: User Login with Invalid Credentials
- **Category**: Authentication
- **Priority**: High
- **Test Type**: Functional
- **Created By**: QA Team
- **Created Date**: 2024-01-15
- **Last Updated**: 2024-01-15

## Test Description
Verify that the system properly handles login attempts with invalid credentials and displays appropriate error messages.

## Preconditions
- [ ] User is on the login page
- [ ] Login form is fully loaded and functional

## Test Data
| Field | Value | Notes |
|-------|-------|-------|
| Email | invalid.user@example.com | Non-existent email |
| Password | WrongPassword123! | Incorrect password |

## Test Steps
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to login page | Login form is displayed |
| 2 | Enter non-existent email "invalid.user@example.com" | Email field accepts input |
| 3 | Enter incorrect password "WrongPassword123!" | Password field accepts input (masked) |
| 4 | Click "Login" button | Form submits |
| 5 | Verify error message is displayed | "Invalid email or password" error message appears |
| 6 | Verify user remains on login page | User is not redirected, stays on login form |
| 7 | Verify form fields are cleared or retain values | Password field is cleared, email may be retained |
| 8 | Verify no sensitive information is exposed | Error message doesn't specify which field is incorrect |

## Expected Result
System displays generic error message without revealing whether email or password is incorrect, user remains on login page, and no authentication is granted.

## Test Environment
- **Browser**: All (Chrome, Firefox, Safari, Edge)
- **Device**: All (Desktop, Mobile, Tablet)
- **OS**: All
- **Resolution**: All standard resolutions

## Requirements Traceability
- **Requirement ID**: REQ-1.1
- **User Story**: As a system, I want to prevent unauthorized access by validating credentials and showing appropriate error messages

## Test Execution
- **Execution Date**: [To be filled during execution]
- **Executed By**: [To be filled during execution]
- **Test Result**: [Pass | Fail | Blocked | Skip]
- **Actual Result**: [What actually happened during execution]
- **Notes**: [Any additional observations or comments]
- **Defects Found**: [Link to bug reports if any]

## Attachments
- [ ] Screenshot of login form with invalid data
- [ ] Screenshot of error message
- [ ] Screenshot showing user remains on login page