# Authentication Fix for Contact API

## Problem
When making API requests to `/api/contacts/*` endpoints without an Authorization header, the server was returning:
- **HTTP 302 Found** with redirect to `/oauth2/authorize/google`
- This was incorrect behavior for API endpoints

## Root Cause
Spring Security was configured with OAuth2 login as the default authentication mechanism. When requests came to authenticated endpoints without proper JWT tokens, Spring Security redirected them to OAuth2 authorization instead of returning proper API error responses.

## Solution Implemented

### 1. Created Custom Authentication Entry Point
**File**: `ApiAuthenticationEntryPoint.java`
- Detects if the request is to an API endpoint (`/api/*`)
- For API requests: Returns `401 Unauthorized` with JSON error response
- For non-API requests: Maintains OAuth2 redirect behavior

### 2. Updated Security Configuration
**File**: `SecurityConfig.java`
- Added `ApiAuthenticationEntryPoint` as autowired dependency
- Configured exception handling to use the custom entry point
- This ensures API endpoints return proper HTTP status codes

### 3. Updated Test Cases
**File**: `con_not_test.http`
- Added quick authentication test at the top
- Fixed authentication error tests to expect 401 instead of 302
- Improved test documentation

## Expected Behavior After Fix

### Before Fix:
```http
POST /api/contacts/add
Content-Type: application/json
{ ... }

HTTP/1.1 302 Found
Location: http://localhost:8080/oauth2/authorize/google
```

### After Fix:
```http
POST /api/contacts/add
Content-Type: application/json
{ ... }

HTTP/1.1 401 Unauthorized
Content-Type: application/json
{"success": false, "error": "User not authenticated"}
```

## Testing Instructions
1. Start the Spring Boot application
2. Run the "QUICK AUTH TEST" in `con_not_test.http`
3. Expected response: `401 Unauthorized` with JSON body
4. Should NOT get `302 Found` redirect

## Implementation Details
- The fix maintains backward compatibility for web OAuth2 flows
- Only affects API endpoints (starting with `/api/`)
- Uses proper content-type headers for API responses
- Follows the same error response format as the rest of the API
