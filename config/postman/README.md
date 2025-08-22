# Postman API Testing Collections

## Overview

This directory contains comprehensive Postman collections for testing the e-commerce API across different environments. The collections are organized by functional areas and include automated test scripts, environment configurations, and authentication workflows.

## Collection Structure

### Main Collections

#### 1. User Management API (`user-management.postman_collection.json`)
- **Authentication**: Registration, login, logout, token refresh
- **Profile Management**: Get profile, update profile, change password, delete account
- **Password Reset**: Request reset, reset password workflow

**Endpoints Covered**: 8 endpoints with comprehensive test scenarios

#### 2. Product Catalog API (`product-catalog.postman_collection.json`)
- **Products**: CRUD operations, product listing with pagination
- **Search**: Product search by name, filtering, sorting
- **Categories**: Category management and product categorization
- **Reviews**: Product reviews and ratings

**Endpoints Covered**: 12 endpoints with search and filtering capabilities

#### 3. Order Processing API (`order-processing.postman_collection.json`)
- **Shopping Cart**: Add/remove items, update quantities, cart calculations
- **Checkout Process**: Order creation, payment processing
- **Order Management**: Order tracking, status updates, order history

**Endpoints Covered**: 10 endpoints covering complete order workflow

#### 4. Complete API Suite (`ecommerce-api-complete.postman_collection.json`)
- **Health Checks**: API status, database connectivity, version information
- **Global Scripts**: Pre-request and test scripts for all collections
- **Error Handling**: Comprehensive error validation and logging

**Features**: Global authentication, rate limiting, debug logging

### Workflow Collections

#### Authentication Workflow (`workflows/authentication-workflow.postman_collection.json`)
- **Setup Authentication**: Complete user registration and login workflow
- **Admin Setup**: Admin user authentication (environment-specific)
- **Verification**: Authentication token validation
- **Cleanup**: Logout and test data cleanup

**Purpose**: Automated setup for API testing sessions

## Environment Configurations

### Development Environment (`environments/development.postman_environment.json`)
- **Base URL**: `http://localhost:3000`
- **API URL**: `http://localhost:3001/api`
- **Features**: Debug mode enabled, lower timeouts, test data cleanup
- **Security**: Relaxed settings for local development

### Staging Environment (`environments/staging.postman_environment.json`)
- **Base URL**: `https://staging.ecommerce-app.com`
- **API URL**: `https://staging-api.ecommerce-app.com/api`
- **Features**: SSL verification, moderate timeouts, staging-specific test data
- **Security**: Enhanced security settings, limited admin access

### Production Environment (`environments/production.postman_environment.json`)
- **Base URL**: `https://ecommerce-app.com`
- **API URL**: `https://api.ecommerce-app.com/api`
- **Features**: Strict SSL verification, high timeouts, rate limiting
- **Security**: Maximum security, admin operations disabled, read-only testing

## Authentication Workflows

### Standard User Authentication
1. **Register Test User**: Creates unique test user with generated data
2. **Login**: Authenticates user and stores auth token
3. **Token Storage**: Automatically stores token for subsequent requests
4. **Verification**: Validates authentication is working

### Admin Authentication (Development/Staging Only)
1. **Admin Login**: Authenticates admin user (environment-specific)
2. **Admin Token Storage**: Stores admin token for privileged operations
3. **Permission Verification**: Validates admin permissions

### Token Management
- **Automatic Token Storage**: Tokens stored in environment variables
- **Token Refresh**: Automatic token refresh when needed
- **Token Cleanup**: Automatic cleanup on logout or test completion

## Usage Instructions

### Setting Up Collections

1. **Import Collections**:
   ```bash
   # Import all collections into Postman
   - user-management.postman_collection.json
   - product-catalog.postman_collection.json
   - order-processing.postman_collection.json
   - ecommerce-api-complete.postman_collection.json
   ```

2. **Import Environments**:
   ```bash
   # Import environment configurations
   - development.postman_environment.json
   - staging.postman_environment.json
   - production.postman_environment.json
   ```

3. **Select Environment**: Choose appropriate environment in Postman

### Running Tests

#### Manual Execution
1. **Setup Authentication**: Run authentication workflow first
2. **Run Collections**: Execute collections in any order
3. **Review Results**: Check test results and response data
4. **Cleanup**: Run cleanup workflow when finished

#### Automated Execution (Newman)
```bash
# Run complete test suite
newman run ecommerce-api-complete.postman_collection.json \
  -e development.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export reports/api-test-report.html

# Run specific collection
newman run user-management.postman_collection.json \
  -e development.postman_environment.json

# Run with data file
newman run product-catalog.postman_collection.json \
  -e staging.postman_environment.json \
  -d test-data.csv
```

## Test Data Management

### Dynamic Data Generation
- **Unique Emails**: Automatically generated using timestamps
- **Random Data**: Uses Postman's built-in random data generators
- **Environment Variables**: Stores generated data for reuse across requests

### Static Test Data
- **Product IDs**: Pre-configured product IDs for consistent testing
- **Category IDs**: Standard category IDs across environments
- **Test Credentials**: Environment-specific test user credentials

### Data Cleanup
- **Automatic Cleanup**: Test data cleaned up after test completion
- **Environment-Specific**: Different cleanup strategies per environment
- **Manual Cleanup**: Manual cleanup options for development

## Security Considerations

### Development Environment
- **Relaxed Security**: Allows test data creation and deletion
- **Debug Mode**: Detailed logging and error information
- **Admin Access**: Full admin operations available

### Staging Environment
- **Moderate Security**: Limited admin operations
- **SSL Verification**: Enforced SSL certificate validation
- **Test Data Isolation**: Separate test data from production-like data

### Production Environment
- **Maximum Security**: Read-only operations only
- **No Admin Operations**: Admin endpoints disabled for safety
- **Rate Limiting**: Enforced delays between requests
- **SSL Required**: Strict SSL verification

## Error Handling

### Global Error Handling
- **Status Code Validation**: Automatic validation of expected status codes
- **Response Time Monitoring**: Alerts for slow responses
- **Server Error Detection**: Automatic detection of 5xx errors
- **JSON Validation**: Validates response structure

### Request-Specific Handling
- **Authentication Errors**: Automatic token refresh on 401 errors
- **Rate Limiting**: Automatic retry with backoff on 429 errors
- **Network Errors**: Graceful handling of network failures
- **Validation Errors**: Detailed validation error reporting

## Best Practices

### Collection Organization
1. **Logical Grouping**: Collections organized by functional areas
2. **Descriptive Names**: Clear, descriptive names for all requests
3. **Comprehensive Documentation**: Detailed descriptions for all endpoints
4. **Consistent Structure**: Standardized request/response patterns

### Test Script Guidelines
1. **Comprehensive Validation**: Test status codes, response structure, and business logic
2. **Data Validation**: Validate data types, formats, and constraints
3. **Error Scenarios**: Include negative test cases
4. **Performance Testing**: Monitor response times and performance

### Environment Management
1. **Environment Isolation**: Separate configurations for each environment
2. **Security Awareness**: Different security levels per environment
3. **Data Management**: Appropriate data handling for each environment
4. **Configuration Management**: Centralized configuration management

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Verify environment variables are set correctly
   - Check if auth token is expired
   - Ensure user credentials are valid for the environment

2. **Environment Configuration**:
   - Verify base_url is correct for the environment
   - Check SSL settings for HTTPS environments
   - Ensure API version matches the deployed version

3. **Test Data Issues**:
   - Verify product IDs exist in the target environment
   - Check if test users have proper permissions
   - Ensure test data is not conflicting with existing data

4. **Network Issues**:
   - Check if API server is running and accessible
   - Verify firewall and network connectivity
   - Check for rate limiting or IP blocking

### Debug Mode

Enable debug mode in environment variables:
```json
{
  "key": "debug_mode",
  "value": "true"
}
```

This will provide detailed logging of:
- Request/response details
- Authentication token status
- Environment variable values
- Test execution flow

## Integration with Newman

The collections are designed to work seamlessly with Newman for automated execution:

```bash
# Install Newman
npm install -g newman

# Run collections with Newman
npm run test:api
npm run test:api:dev
npm run test:api:staging
```

See the main project README for complete Newman integration instructions.