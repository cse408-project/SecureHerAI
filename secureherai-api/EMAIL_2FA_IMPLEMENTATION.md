# Email 2FA Login Implementation

## Overview

This implementation adds email-based two-factor authentication (2FA) to the login process. When users attempt to sign in, they now receive a 6-digit verification code via email that they must enter to complete the login process.

## Changes Made

### 1. Database Schema Updates

#### New Fields Added to `users` table:

- `login_code` (TEXT): Stores the temporary 6-digit verification code
- `login_code_expiry` (TIMESTAMPTZ): Stores when the login code expires (10 minutes from generation)

#### Migration Script:

- `database/migration_add_login_code.sql`: Run this script on existing databases to add the new columns

### 2. Entity Changes

#### User.java:

- Added `loginCode` and `loginCodeExpiry` fields
- Added corresponding getters and setters

### 3. Repository Changes

#### UserRepository.java:

- Added `findByLoginCode(String loginCode)` method

### 4. Service Layer Changes

#### AuthService.java:

- **Modified `login()` method**: Now generates a 6-digit code and sends it via email instead of immediately returning a JWT token
- **Added `verifyLoginCode()` method**: Validates the login code and returns JWT token upon successful verification

#### EmailService.java:

- **Added `sendLoginCodeEmail()` method**: Sends styled HTML email with the verification code

### 5. Controller Changes

#### AuthController.java:

- **Added `/api/auth/verify-login-code` endpoint**: New POST endpoint for verifying login codes

### 6. DTO Changes

#### AuthRequest.java:

- **Added `VerifyLoginCode` class**: New request DTO for login code verification

### 7. Documentation Updates

#### API.md:

- Updated login section to reflect the new two-step process

#### auth_test.http:

- Updated test cases to show the two-step login process

## New Login Flow

### Step 1: Initial Login Request

```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login code sent to your email. Please check your inbox."
}
```

### Step 2: Verify Login Code

```
POST /api/auth/verify-login-code
{
  "email": "user@example.com",
  "loginCode": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "12345",
  "fullName": "Jane Doe"
}
```

## Security Features

1. **Code Expiry**: Login codes expire after 10 minutes
2. **Single Use**: Codes are cleared after successful verification or expiry
3. **Code Format**: 6-digit numeric codes for user convenience
4. **Error Handling**: Proper error messages without revealing sensitive information
5. **Email Failure Handling**: If email sending fails, the code is cleared from the database

## Testing

Use the updated `auth_test.http` file to test the new login flow:

1. First, make a POST request to `/api/auth/login` with valid credentials
2. Check the email inbox for the 6-digit code
3. Make a POST request to `/api/auth/verify-login-code` with the email and received code
4. The response will contain the JWT token for authenticated requests

## Email Template

The login code email includes:

- Professional styling with HTML formatting
- Clear display of the 6-digit code
- Expiry information (10 minutes)
- Security notice about unauthorized access attempts
- Branded SecureHerAI messaging

## Migration Notes

For existing deployments:

1. Apply the database migration script: `database/migration_add_login_code.sql`
2. Ensure email service is properly configured in `application.properties`
3. Test the email delivery in your environment
4. Update any client applications to handle the new two-step login flow

## Future Enhancements

Potential improvements for future versions:

- Rate limiting for login code generation
- SMS-based verification as an alternative
- Remember device functionality
- Admin configuration for code expiry time
- Audit logging for login attempts
