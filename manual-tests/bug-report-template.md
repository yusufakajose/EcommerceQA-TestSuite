# Bug Report Template

## Bug Information
- **Bug ID**: BUG-[CATEGORY]-[NUMBER] (e.g., BUG-AUTH-001)
- **Bug Title**: [Brief descriptive title of the issue]
- **Reporter**: [Name of person reporting the bug]
- **Date Reported**: [YYYY-MM-DD]
- **Last Updated**: [YYYY-MM-DD]
- **Assigned To**: [Developer/Team assigned to fix]

## Classification
- **Severity**: [Critical | High | Medium | Low]
- **Priority**: [P1 | P2 | P3 | P4]
- **Bug Type**: [Functional | UI | Performance | Security | Usability | Compatibility]
- **Component**: [Authentication | Product Catalog | Shopping Cart | Checkout | Search | Profile]
- **Status**: [Open | In Progress | Resolved | Closed | Reopened | Deferred]

## Environment Information
- **Browser**: [Chrome | Firefox | Safari | Edge | Version]
- **Operating System**: [Windows | macOS | Linux | iOS | Android | Version]
- **Device**: [Desktop | Mobile | Tablet | Specific device model]
- **Screen Resolution**: [1920x1080 | 1366x768 | Mobile viewport]
- **Application Version**: [Version number or build]
- **Test Environment**: [Development | Staging | Production]

## Bug Description
### Summary
[Provide a clear, concise summary of the bug in 1-2 sentences]

### Detailed Description
[Provide a detailed description of the issue, including what functionality is affected and how it impacts the user experience]

## Steps to Reproduce
1. [First step to reproduce the issue]
2. [Second step to reproduce the issue]
3. [Continue with additional steps as needed]
4. [Final step that triggers the bug]

## Expected Result
[Describe what should happen when following the steps above]

## Actual Result
[Describe what actually happens when following the steps above]

## Test Data Used
| Field | Value | Notes |
|-------|-------|-------|
| [Data field 1] | [Value used] | [Any relevant notes] |
| [Data field 2] | [Value used] | [Any relevant notes] |

## Reproducibility
- **Frequency**: [Always | Sometimes | Rarely | Once]
- **Reproducible**: [Yes | No | Intermittent]
- **Conditions**: [Specific conditions under which bug occurs]

## Impact Assessment
### Business Impact
- **User Impact**: [How many users are affected]
- **Functional Impact**: [What functionality is broken or degraded]
- **Revenue Impact**: [Potential revenue loss if applicable]

### Technical Impact
- **System Impact**: [Effect on system performance or stability]
- **Data Impact**: [Any data corruption or loss concerns]
- **Integration Impact**: [Effect on other system components]

## Attachments
- [ ] **Screenshots**: [Attach relevant screenshots showing the issue]
- [ ] **Video Recording**: [Screen recording demonstrating the bug]
- [ ] **Log Files**: [Relevant application or browser console logs]
- [ ] **Network Traces**: [Network requests/responses if relevant]
- [ ] **Database Queries**: [SQL queries or database state if relevant]

## Additional Information
### Browser Console Errors
```
[Paste any JavaScript console errors here]
```

### Network Requests
```
[Paste relevant network request/response information]
```

### Related Issues
- **Related Bugs**: [Links to related bug reports]
- **Duplicate Of**: [Link if this is a duplicate]
- **Blocks**: [Issues that this bug blocks]
- **Blocked By**: [Issues that block this bug]

## Resolution Information
### Root Cause Analysis
[To be filled by developer - analysis of what caused the bug]

### Fix Description
[To be filled by developer - description of the fix implemented]

### Code Changes
[To be filled by developer - summary of code changes made]

### Testing Notes
[To be filled by tester - notes on verification testing]

## Verification
- **Verification Date**: [Date when fix was verified]
- **Verified By**: [Name of person who verified the fix]
- **Verification Result**: [Pass | Fail]
- **Verification Notes**: [Any notes from verification testing]

## Closure Information
- **Resolution**: [Fixed | Won't Fix | Duplicate | Not a Bug | Cannot Reproduce]
- **Closed Date**: [YYYY-MM-DD]
- **Closed By**: [Name of person closing the bug]
- **Closure Notes**: [Final notes on bug resolution]

---

## Severity Guidelines

### Critical (P1)
- System crashes or becomes completely unusable
- Data loss or corruption
- Security vulnerabilities
- Payment processing failures
- Complete feature breakdown affecting core functionality

### High (P2)
- Major feature not working as expected
- Significant user experience degradation
- Performance issues affecting usability
- Incorrect calculations or data display
- Authentication or authorization failures

### Medium (P3)
- Minor feature issues that don't block core functionality
- UI/UX issues that affect user experience but don't prevent task completion
- Performance issues that are noticeable but not blocking
- Cosmetic issues in important areas

### Low (P4)
- Minor cosmetic issues
- Spelling or grammar errors
- Minor UI alignment issues
- Enhancement requests
- Issues in rarely used features

## Bug Type Guidelines

### Functional
- Features not working according to requirements
- Incorrect business logic implementation
- Data processing errors
- Integration failures

### UI
- Visual display issues
- Layout problems
- Responsive design failures
- Accessibility issues

### Performance
- Slow response times
- Memory leaks
- High CPU usage
- Timeout issues

### Security
- Authentication bypasses
- Data exposure
- XSS vulnerabilities
- SQL injection possibilities

### Usability
- Confusing user interface
- Poor user experience
- Navigation issues
- Unclear error messages

### Compatibility
- Browser-specific issues
- Device-specific problems
- Operating system compatibility
- Version compatibility issues