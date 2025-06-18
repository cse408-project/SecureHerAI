# API Error Response Mapping

## Fixed Error Response Mapping

After implementing the fixes, here's what each test should return:

### Authentication Tests (Should return 401)

#### Test 14: Invalid Token Format
**Request**: `GET /api/contacts` with `Authorization: Bearer invalid_token_format`
**Expected Response**: 
```http
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error": "User not authenticated"
}
```
✅ **Status**: CORRECT

#### Test 14b: Malformed JWT Token  
**Request**: `GET /api/contacts` with `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.invalid_payload.invalid_signature`
**Expected Response**:
```http
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error": "User not authenticated"
}
```
✅ **Status**: CORRECT

#### Test 14c: Expired Token (User Not Found)
**Request**: `GET /api/contacts` with expired token pointing to deleted user
**Expected Response**:
```http
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error": "Invalid or expired authentication token"
}
```
🔧 **Status**: FIXED (was returning 400, now returns 401)

#### Test 15: Delete with Expired Token
**Request**: `DELETE /api/contacts/delete` with expired token
**Expected Response**:
```http
HTTP/1.1 401 Unauthorized
{
  "success": false,
  "error": "Invalid or expired authentication token"
}
```
🔧 **Status**: FIXED (was returning 403, now returns 401)

### Authorization Tests (Should return 403)

#### Test 16: Add Contact for Different User
**Request**: `POST /api/contacts/add` with valid token but different userId in request
**Expected Response**:
```http
HTTP/1.1 403 Forbidden
{
  "success": false,
  "error": "Cannot add contacts for another user"
}
```
🔧 **Status**: IMPROVED (more specific error message)

#### Test 17: Get Contacts for Different User
**Request**: `GET /api/contacts?userId=different-user-id` with valid token
**Expected Response**:
```http
HTTP/1.1 403 Forbidden
{
  "success": false,
  "error": "Cannot access another user's contacts"
}
```
🔧 **Status**: IMPROVED (more specific error message)

#### Test 18: Delete Contact for Different User
**Request**: `DELETE /api/contacts/delete` with valid token but different userId in request
**Expected Response**:
```http
HTTP/1.1 403 Forbidden
{
  "success": false,
  "error": "Cannot access another user's contacts"
}
```
🔧 **Status**: IMPROVED (more specific error message)

## Error Classification

### 401 Unauthorized (Authentication Issues)
- **When**: Missing, invalid, expired, or malformed tokens
- **Message**: "User not authenticated" or "Invalid or expired authentication token"
- **Meaning**: The request lacks valid authentication credentials

### 403 Forbidden (Authorization Issues)  
- **When**: Valid token but trying to access another user's resources
- **Message**: Specific to the operation (e.g., "Cannot access another user's contacts")
- **Meaning**: The request is authenticated but not authorized for this specific resource

### 400 Bad Request (Validation Issues)
- **When**: Invalid data format, validation failures, business logic errors
- **Message**: Specific to the validation error
- **Meaning**: The request is malformed or contains invalid data

## Key Improvements Made

1. **Consistent Authentication Handling**: All expired/invalid tokens now return 401
2. **Better Exception Handling**: `AuthenticationException` properly caught in all controllers
3. **Specific Error Messages**: More descriptive error messages for different scenarios
4. **Proper HTTP Status Codes**: Authentication vs Authorization errors properly distinguished

## Testing Instructions

After applying these fixes, re-run tests 14c, 15, 16, 17, and 18. You should now see:
- All authentication issues return **401** with appropriate messages
- All authorization issues return **403** with specific error messages
- No more generic "Access denied" messages
