# Authentication Token Handling Fix

## Problem
When using expired/invalid tokens, the API was returning:
- **HTTP 400 Bad Request** with "User not found" error
- This should be **HTTP 401 Unauthorized** for authentication issues

## Root Cause Analysis
The issue occurred because:
1. The expired token was still being processed by JWT validation
2. The token contained a user ID for a user that no longer exists in the database
3. The service treated "user not found" as a business logic error (400) instead of an authentication error (401)

## Solution Implemented

### 1. Created Custom Authentication Exception
**File**: `AuthenticationException.java`
- Custom exception for authentication-related errors
- Allows service layer to signal authentication problems to controller

### 2. Enhanced JWT Token Validation
**File**: `ContactController.java`
- Added proper try-catch blocks around JWT operations
- Better separation of JWT validation vs user extraction
- Catches JWT exceptions and converts to 401 responses

### 3. Updated Service Layer Logic
**File**: `ContactService.java`
- When user is not found for a valid token, throw `AuthenticationException`
- This indicates the token refers to a non-existent user (authentication issue)

### 4. Enhanced Test Cases
**File**: `con_not_test.http`
- Added multiple types of invalid tokens for testing:
  - `@invalidToken` - clearly invalid format
  - `@malformedToken` - JWT format but invalid content
  - `@expiredToken` - expired or pointing to deleted user
- Added separate test cases for each scenario

## Expected Behavior After Fix

### Before Fix:
```http
GET /api/contacts
Authorization: Bearer expired_token

HTTP/1.1 400 Bad Request
{"success": false, "error": "User not found"}
```

### After Fix:
```http
GET /api/contacts  
Authorization: Bearer expired_token

HTTP/1.1 401 Unauthorized
{"success": false, "error": "Invalid or expired authentication token"}
```

## Test Scenarios Covered

1. **No Authorization Header**: 401 with JSON response (not 302 redirect)
2. **Invalid Token Format**: 401 with appropriate error message
3. **Malformed JWT**: 401 with appropriate error message  
4. **Expired/Non-existent User Token**: 401 with appropriate error message
5. **Valid Token**: 200 with proper response

## Security Benefits

1. **Consistent Error Responses**: All authentication issues return 401
2. **No Information Leakage**: Doesn't reveal whether user exists or not
3. **Proper HTTP Status Codes**: Follows REST API conventions
4. **Better Client Handling**: Clients can properly handle auth errors

## Testing Instructions

Run these tests in sequence in `con_not_test.http`:
1. Test 14: Invalid token format
2. Test 14b: Malformed JWT token  
3. Test 14c: Expired/deleted user token

All should return **401 Unauthorized** with JSON error response.
