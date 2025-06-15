# User Authentication Module

## Overview

This module handles user authentication, registration, profile management, and OAuth integration.

## Endpoints

### Health Check

| API Endpoint | HTTP Method |                   Description                   |
| ------------ | :---------: | :---------------------------------------------: |
| /api/health  |    `GET`    | Checks if the API server is running and healthy |

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "status": "UP",
>   "timestamp": "2025-06-16T10:15:30Z"
> }
> ```

### Registration

| API Endpoint          | HTTP Method |                 Description                 |
| --------------------- | :---------: | :-----------------------------------------: |
| [api/auth/register]() |   `POST`    | Registers a new user or responder in system |

> ### User Registration Request
>
> #### Request Body
>
> ```json
> {
>   "fullName": "Jane Doe",
>   "email": "user@example.com",
>   "password": "password123",
>   "phoneNumber": "+8801712345678",
>   "dateOfBirth": "1990-01-01",
>   "role": "USER"
> }
> ```

> ### Responder Registration Request
>
> #### Request Body
>
> ```json
> {
>   "fullName": "Officer John Smith",
>   "email": "officer@example.com",
>   "password": "password123",
>   "phoneNumber": "+8801712345678",
>   "dateOfBirth": "1990-01-01",
>   "role": "RESPONDER",
>   "responderType": "POLICE",
>   "badgeNumber": "POL-001"
> }
> ```

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Registration successful! Please check your email for verification.",
>   "userId": "12345"
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Email already registered"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Phone number already registered"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Role is required. Must be USER or RESPONDER"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Responder type is required for responder registration"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Badge number is required for responder registration"
> }
> ```

### Login

| API Endpoint                   | HTTP Method |                         Description                          |
| ------------------------------ | :---------: | :----------------------------------------------------------: |
| [api/auth/login]()             |   `POST`    | Authenticates user credentials and sends login code to email |
| [api/auth/verify-login-code]() |   `POST`    |     Verifies the login code and returns an access token      |

> ### Step 1: Initial Login Request
>
> #### Request Body
>
> ```json
> {
>   "email": "user@example.com",
>   "password": "password123"
> }
> ```

> ### Step 1: Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Login code sent to your email. Please check your inbox."
> }
> ```

> ### Step 2: Verify Login Code Request
>
> #### Request Body
>
> ```json
> {
>   "email": "user@example.com",
>   "loginCode": "123456"
> }
> ```

> ### Step 2: Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "role": "user",
>   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
>   "userId": "12345",
>   "fullName": "Jane Doe"
> }
> ```

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid email format"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid email or password"
> }
> ```
>
> #### Login Code Error Cases
>
> ```json
> {
>   "success": false,
>   "error": "Invalid email or login code"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Login code has expired. Please request a new login code."
> }
> ```

---

### Google OAuth Login

| API Endpoint           | HTTP Method |                  Description                  |
| ---------------------- | :---------: | :-------------------------------------------: |
| /api/auth/google/login |    `GET`    | Returns the URL for Google OAuth2 redirection |

> #### Request
>
> No request body needed

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "url": "/oauth2/authorize/google"
> }
> ```

| API Endpoint            | HTTP Method |                 Description                 |
| ----------------------- | :---------: | :-----------------------------------------: |
| /oauth2/callback/google |    `GET`    | OAuth2 callback after Google authentication |

> This endpoint is handled internally by Spring OAuth2 client and redirects to the success URL.

| API Endpoint    | HTTP Method |               Description               |
| --------------- | :---------: | :-------------------------------------: |
| /oauth2/success |    `GET`    | Success page after OAuth authentication |

> #### Response
>
> After successful authentication, the user is redirected to a success page that provides the JWT token.
> This token can be used for subsequent API calls just like the token received from regular login.
>
> Mobile apps should implement a handler for the deep link: `secureherai://auth?token={token}`

| API Endpoint              | HTTP Method |                  Description                   |
| ------------------------- | :---------: | :--------------------------------------------: |
| /api/auth/google/redirect |    `GET`    | Redirects to mobile app after OAuth completion |

> #### Request Parameters
>
> - `token`: The JWT token received after authentication
>
> #### Response
>
> Redirects to: `secureherai://auth?token={token}`

### Mobile OAuth Endpoints

| API Endpoint                   | HTTP Method |                 Description                  |
| ------------------------------ | :---------: | :------------------------------------------: |
| /api/auth/mobile/oauth-success |    `GET`    | Handles mobile app OAuth success redirection |

> #### Request Parameters
>
> - `token`: The JWT token received after authentication
>
> #### Response
>
> Redirects to the mobile app using custom URL scheme: `secureherai://auth?token={token}`

| API Endpoint                   | HTTP Method |              Description              |
| ------------------------------ | :---------: | :-----------------------------------: |
| /api/auth/mobile/test-redirect |    `GET`    | Test endpoint for mobile deep linking |

> #### Response
>
> Returns an HTML page with a test link to verify mobile app deep linking functionality.

---

## Profile Management

### Get User Profile

| API Endpoint      | HTTP Method |            Description             |
| ----------------- | :---------: | :--------------------------------: |
| /api/user/profile |    `GET`    | Retrieves user profile information |

> #### Headers
>
> ```
> Authorization: Bearer {jwt_token}
> ```

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "user": {
>     "userId": "12345",
>     "fullName": "Jane Doe",
>     "email": "user@example.com",
>     "phone": "+8801712345678",
>     "profilePicture": "data:image/jpeg;base64,...",
>     "dateOfBirth": "1990-01-01",
>     "emailAlerts": true,
>     "smsAlerts": true,
>     "pushNotifications": true
>   }
> }
> ```

---

### Complete Profile (For OAuth Users)

| API Endpoint               | HTTP Method |                            Description                             |
| -------------------------- | :---------: | :----------------------------------------------------------------: |
| /api/user/complete-profile |   `POST`    | Completes the user profile after OAuth login with required details |

> #### Headers
>
> ```
> Authorization: Bearer {jwt_token}
> ```

> #### Request Body (Regular User)
>
> ```json
> {
>   "phoneNumber": "+8801712345678",
>   "dateOfBirth": "1990-01-01",
>   "role": "USER"
> }
> ```

> #### Request Body (Responder)
>
> ```json
> {
>   "phoneNumber": "+8801712345680",
>   "dateOfBirth": "1985-07-15",
>   "role": "RESPONDER",
>   "responderType": "POLICE",
>   "badgeNumber": "POL-2023"
> }
> ```

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
>   "message": "Profile completed successfully"
> }
> ```

> #### Response - Error Cases
>
> ```json
> {
>   "success": false,
>   "error": "Invalid phone number format"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Responder type is required for responder registration"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Badge number is required for responder registration"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Profile is already complete"
> }
> ```

---

### Update Profile

| API Endpoint      | HTTP Method |           Description            |
| ----------------- | :---------: | :------------------------------: |
| /api/user/profile |    `PUT`    | Updates user profile information |

> #### Headers
>
> ```
> Authorization: Bearer {jwt_token}
> ```

> #### Request Body (Regular User - All Possible Fields)
>
> ```json
> {
>   "fullName": "Jane Smith",
>   "phoneNumber": "+8801712345679",
>   "profilePicture": "data:image/jpeg;base64,...",
>   "dateOfBirth": "1990-02-15",
>   "emailAlerts": true,
>   "smsAlerts": true,
>   "pushNotifications": false
> }
> ```

> #### Request Body (Responder - All Possible Fields)
>
> ```json
> {
>   "fullName": "Officer John Smith",
>   "phoneNumber": "+8801712345699",
>   "profilePicture": "data:image/jpeg;base64,...",
>   "dateOfBirth": "1985-08-16",
>   "emailAlerts": true,
>   "smsAlerts": true,
>   "pushNotifications": true,
>   "status": "AVAILABLE", // AVAILABLE, BUSY, or OFF_DUTY
>   "responderType": "POLICE", // POLICE, MEDICAL, or FIRE
>   "badgeNumber": "POL-0012"
> }
> ```

> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "message": "Profile updated successfully"
> }
> ```

---

## Account Verification and Profile Completion

The system uses two separate flags to track user authentication and profile completion status:

### Account Verification (`isVerified`)

- An account is marked as verified when:

  - A user successfully logs in with an email verification code
  - A user registers through Google OAuth (automatically verified)
  - A user completes their profile (implicitly verified)

- Unverified accounts may be removed from the system after 7 days

### Profile Completion (`isProfileComplete`)

- A profile is considered complete when:

  - A user has provided all required profile information including phone number and date of birth
  - For responders, this also includes their responder type and badge number

- OAuth users initially have `isProfileComplete=false` and must call the complete-profile endpoint
- Regular users who register with all required information start with `isProfileComplete=true`

---

## Password Reset

### Forgot Password

| API Endpoint              | HTTP Method |                  Description                   |
| ------------------------- | :---------: | :--------------------------------------------: |
| /api/auth/forgot-password |   `POST`    | Sends a password reset email with a reset link |

> #### Request Body
>
> ```json
> {
>   "email": "user@example.com"
> }
> ```

> #### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Password reset instructions sent to your email"
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "Email not registered"
> }
> ```

### Reset Password

| API Endpoint             | HTTP Method |                Description                |
| ------------------------ | :---------: | :---------------------------------------: |
| /api/auth/reset-password |   `POST`    | Resets the user password with a new value |

> #### Request Body
>
> ```json
> {
>   "token": "78953b99-7376-495c-9ea9-bcaced3022df",
>   "newPassword": "password123"
> }
> ```

> #### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Password reset successful"
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid or expired reset token"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "New password does not meet requirements"
> }
> ```
