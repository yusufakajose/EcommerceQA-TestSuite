# Test Case: User Login with Valid Credentials

## Test Case Information

- **Test Case ID**: TC-AUTH-002
- **Test Case Title**: User Login with Valid Credentials
- **Category**: Authentication
- **Priority**: Critical
- **Test Type**: Functional
- **Created By**: QA Team
- **Created Date**: 2024-01-15
- **Last Updated**: 2024-01-15

## Test Description

Verify that a registered user can successfully log in with valid credentials and access their account.

## Preconditions

- [ ] User has a registered account
- [ ] User is on the login page
- [ ] User is not currently logged in

## Test Data

| Field    | Value                     | Notes                            |
| -------- | ------------------------- | -------------------------------- |
| Email    | john.doe.test@example.com | Valid registered email           |
| Password | SecurePass123!            | Correct password for the account |

## Test Steps

| Step | Action                                        | Expected Result                                        |
| ---- | --------------------------------------------- | ------------------------------------------------------ |
| 1    | Navigate to login page                        | Login form is displayed with email and password fields |
| 2    | Enter valid email "john.doe.test@example.com" | Email field accepts input                              |
| 3    | Enter correct password "SecurePass123!"       | Password field accepts input (masked)                  |
| 4    | Click "Login" button                          | Form submits and user is authenticated                 |
| 5    | Verify successful login                       | User is redirected to dashboard/home page              |
| 6    | Check user profile/account menu               | User's name or email is displayed in header            |
| 7    | Verify session persistence                    | Refresh page - user remains logged in                  |

## Expected Result

User is successfully authenticated and redirected to the main application with access to personalized features.

## Test Environment

- **Browser**: All (Chrome, Firefox, Safari, Edge)
- **Device**: All (Desktop, Mobile, Tablet)
- **OS**: All
- **Resolution**: All standard resolutions

## Requirements Traceability

- **Requirement ID**: REQ-1.3
- **User Story**: As a registered user, I want to log in to my account so that I can access my personal information and order history

## Test Execution

- **Execution Date**: [To be filled during execution]
- **Executed By**: [To be filled during execution]
- **Test Result**: [Pass | Fail | Blocked | Skip]
- **Actual Result**: [What actually happened during execution]
- **Notes**: [Any additional observations or comments]
- **Defects Found**: [Link to bug reports if any]

## Attachments

- [ ] Screenshot of login form
- [ ] Screenshot of successful login (dashboard)
- [ ] Screenshot of user profile menu
