# User Authentication Module

## Overview

This module handles user authentication, registration, profile management, and OAuth integration.

## Endpoints

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

> #### Request Body
>
> ```json
> {
>   "phoneNumber": "+8801712345678",
>   "dateOfBirth": "1990-01-01"
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

> #### Request Body
>
> ```json
> {
>   "fullName": "Jane Smith",
>   "phoneNumber": "+8801712345679",
>   "profilePicture": "data:image/jpeg;base64,..."
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
