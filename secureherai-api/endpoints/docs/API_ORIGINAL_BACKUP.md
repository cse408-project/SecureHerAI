# <div align="center">SecureHerAI API Documentation</div>

### <div align="center"> Women's Safety Application </div>

<div align="center">1. 2005009 - Ahmed Nur Swapnil </div>
<div align="center">2. 2005022 - Ekramul Haque Amin </div>
<div align="center">3. 2005025 - Sonia Khatun </div>

---

## Index

- [SecureHerAI API Documentation](#secureherai-api-documentation)
  - [ Women's Safety Application ](#-womens-safety-application-)
  - [Index](#index)
  - [API Status Codes](#api-status-codes)
  - [Core Features](#core-features)
  - [Optional Features](#optional-features)
  - [Modules](#modules)
  - [User Authentication Module](#user-authentication-module)
    - [Login](#login)
    - [Google OAuth Login](#google-oauth-login)
    - [Register](#register)
    - [Password Reset](#password-reset)
    - [Profile Management](#profile-management)
    - [Complete Profile (For OAuth Users)](#complete-profile-for-oauth-users)
    - [Update Profile](#update-profile)
  - [SOS Alert System Module](#sos-alert-system-module)
    - [Trigger SOS Alert](#trigger-sos-alert)
    - [Voice Command Detection](#voice-command-detection)
    - [Cancel SOS Alert](#cancel-sos-alert)
    - [Get Active Alerts](#get-active-alerts)
  - [Fake Alert Detection Module](#fake-alert-detection-module)
    - [Verify Alert](#verify-alert)
    - [Get Alert Status](#get-alert-status)
  - [Map \& Route Tracking Module](#map--route-tracking-module)
    - [Start Journey Tracking](#start-journey-tracking)
    - [Update Location](#update-location)
    - [End Journey Tracking](#end-journey-tracking)
    - [Get Responder Location](#get-responder-location)
    - [Get ETA](#get-eta)
  - [Heat Map Module](#heat-map-module)
    - [Get Heat Map Data](#get-heat-map-data)
    - [Get Safe Routes](#get-safe-routes)
    - [Report Area Safety](#report-area-safety)
    - [Get Risk Assessment](#get-risk-assessment)
  - [Contacts \& Notification Module](#contacts--notification-module)
    - [Add Trusted Contact](#add-trusted-contact)
    - [Get Trusted Contacts](#get-trusted-contacts)
    - [Delete Trusted Contact](#delete-trusted-contact)
    - [Update Notification Preferences](#update-notification-preferences)
  - [Incident Report Module](#incident-report-module)
    - [Submit Incident Report](#submit-incident-report)
    - [Get User Reports](#get-user-reports)
    - [Get Report Details](#get-report-details)
    - [Upload Evidence](#upload-evidence)
    - [Update Report Visibility](#update-report-visibility)
  - [Responder Module](#responder-module)
    - [Accept/Reject Alert](#acceptreject-alert)
    - [View User Location](#view-user-location)
    - [Contact User](#contact-user)
    - [View Evidence](#view-evidence)
    - [Update Alert Status](#update-alert-status)
    - [Get Assigned Alerts](#get-assigned-alerts)
    - [Update Responder Status](#update-responder-status)
    - [Submit Incident Report](#submit-incident-report-1)
  - [Admin Module](#admin-module)
    - [Get All Alerts](#get-all-alerts)
    - [Get Alert Statistics](#get-alert-statistics)
    - [Manage Reports](#manage-reports)
    - [Update System Settings](#update-system-settings)
  - [AI Chat Helper (Optional)](#ai-chat-helper-optional)

## API Status Codes

| Status Code | Description                                      |
| ----------- | ------------------------------------------------ |
| 200         | Success                                          |
| 201         | Created                                          |
| 400         | Bad Request - Invalid input parameters           |
| 401         | Unauthorized - Invalid or missing authentication |
| 403         | Forbidden - Insufficient permissions             |
| 404         | Not Found - Resource doesn't exist               |
| 409         | Conflict - Resource already exists               |
| 422         | Unprocessable Entity - Validation error          |
| 429         | Too Many Requests - Rate limit exceeded          |
| 500         | Internal Server Error                            |

## Core Features

1. SOS Alert System (AI-Powered)

   - AI-driven emergency alert system
   - Real-time distress monitoring
   - Automatic alerts with location and timestamps
   - Notifications to police and trusted contacts
   - AI-generated preliminary incident reports
   - Manual one-tap emergency button

2. Fake Alert Detection (AI-Powered)

   - AI-based verification of alert authenticity
   - Audio/video/image/location/metadata analysis
   - Flagging and reviewing of suspicious alerts
   - Basic metadata verification

3. Map Route Tracking & Communication

   - Live tracking of victim and responder locations
   - Encrypted communication channel
   - Estimated arrival times and status updates
   - Offline capabilities with cached locations
   - Embedded panic button

4. Heat Map (AI-Powered)
   - AI-based safety intelligence
   - Historical incident analysis
   - Color-coded risk indicators
   - Safe route suggestions
   - Real-time danger zone alerts
   - Customizable risk thresholds

## Optional Features

1. Contacts & Notification

   - Trusted contacts management
   - Flexible notification methods
   - Automatic emergency messaging
   - Alert validation assistance

2. Report System

   - Incident reporting with evidence
   - Public/private visibility options
   - Connected incident tracking

3. AI Chat Helper (AI/Optional)
   - Real-time guidance and support
   - Safety tips and procedures
   - Feature navigation assistance
   - Emotional support and resource connection

---

## Modules

## User Authentication Module

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
>
>  </br>

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
>
> <br>

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
>
>  </br>

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
>
> <br>

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

---

## SOS Alert System Module

### Trigger SOS Alert

| API Endpoint     | HTTP Method |                Description                |
| ---------------- | :---------: | :---------------------------------------: |
| /api/sos/trigger |   `POST`    | Triggers the SOS alert with user location |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "message": "Need help!",
>   "alertType": "emergency"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "alertId": "abc123",
>   "message": "SOS alert triggered successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid location data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Voice Command Detection

| API Endpoint           | HTTP Method |             Description             |
| ---------------------- | :---------: | :---------------------------------: |
| /api/sos/voice-command |   `POST`    | Detects voice command for SOS alert |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "audioData": "base64-encoded-audio",
>   "language": "en-US"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "SOS alert triggered successfully via voice command."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid audio data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Cancel SOS Alert

| API Endpoint    | HTTP Method |         Description          |
| --------------- | :---------: | :--------------------------: |
| /api/sos/cancel |   `POST`    | Cancels the active SOS alert |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "alertId": "abc123"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "SOS alert canceled successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Active Alerts

| API Endpoint           | HTTP Method |               Description               |
| ---------------------- | :---------: | :-------------------------------------: |
| /api/sos/active-alerts |    `GET`    | Retrieves the list of active SOS alerts |

> #### Request Parameters
>
> - `userId`: The ID of the user
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "alerts": [
>     {
>       "alertId": "abc123",
>       "timestamp": "2023-10-01T12:00:00Z",
>       "location": {
>         "latitude": 23.8103,
>         "longitude": 90.4125
>       },
>       "status": "active"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

## Fake Alert Detection Module

### Verify Alert

| API Endpoint      | HTTP Method |              Description              |
| ----------------- | :---------: | :-----------------------------------: |
| /api/alert/verify |   `POST`    | Verifies the authenticity of an alert |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "userId": "12345",
>   "verificationMethod": "audio"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Alert verified as genuine."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Alert Status

| API Endpoint      | HTTP Method |               Description                |
| ----------------- | :---------: | :--------------------------------------: |
| /api/alert/status |    `GET`    | Retrieves the status of a specific alert |

> #### Request Parameters
>
> - `alertId`: The ID of the alert
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "status": "verified"
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

## Map & Route Tracking Module

### Start Journey Tracking

| API Endpoint     | HTTP Method |            Description             |
| ---------------- | :---------: | :--------------------------------: |
| /api/route/start |   `POST`    | Starts tracking the user's journey |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "destination": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   }
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Journey tracking started.",
>   "trackingId": "track123"
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid destination data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Update Location

| API Endpoint      | HTTP Method |             Description             |
| ----------------- | :---------: | :---------------------------------: |
| /api/route/update |   `POST`    | Updates the user's current location |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "trackingId": "track123"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Location updated successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid location data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### End Journey Tracking

| API Endpoint   | HTTP Method |           Description            |
| -------------- | :---------: | :------------------------------: |
| /api/route/end |   `POST`    | Ends the user's journey tracking |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "trackingId": "track123"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Journey tracking ended."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid tracking ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Responder Location

| API Endpoint                  | HTTP Method |                   Description                   |
| ----------------------------- | :---------: | :---------------------------------------------: |
| /api/route/responder-location |    `GET`    | Retrieves the current location of the responder |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `alertId`: The ID of the alert
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "responderLocation": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   }
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get ETA

| API Endpoint   | HTTP Method |                 Description                  |
| -------------- | :---------: | :------------------------------------------: |
| /api/route/eta |    `GET`    | Calculates and retrieves the ETA to the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `destination`: The destination coordinates
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "eta": "15 minutes"
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid destination data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

## Heat Map Module

### Get Heat Map Data

| API Endpoint      | HTTP Method |               Description                |
| ----------------- | :---------: | :--------------------------------------: |
| /api/heatmap/data |    `GET`    | Retrieves the heat map data for the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `timeRange`: The time range for the heat map data
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "heatmap": {
>     "2023-10-01": {
>       "latitude": 23.8103,
>       "longitude": 90.4125,
>       "intensity": 0.8
>     }
>   }
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid time range"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Safe Routes

| API Endpoint             | HTTP Method |              Description               |
| ------------------------ | :---------: | :------------------------------------: |
| /api/heatmap/safe-routes |    `GET`    | Retrieves the safe routes for the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `destination`: The destination coordinates
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "routes": [
>     {
>       "routeId": "route123",
>       "path": [
>         {
>           "latitude": 23.8103,
>           "longitude": 90.4125
>         }
>       ],
>       "safetyScore": 0.9
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid destination data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Report Area Safety

| API Endpoint        | HTTP Method |              Description              |
| ------------------- | :---------: | :-----------------------------------: |
| /api/heatmap/report |   `POST`    | Reports the safety of a specific area |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "safetyScore": 0.7,
>   "comments": "This area feels unsafe due to lack of streetlights."
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Area safety reported successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid location data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Risk Assessment

| API Endpoint                 | HTTP Method |                Description                 |
| ---------------------------- | :---------: | :----------------------------------------: |
| /api/heatmap/risk-assessment |    `GET`    | Retrieves the risk assessment for the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
> - `location`: The location coordinates
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "riskLevel": "high",
>   "advice": "Avoid this area if possible."
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid location data"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

## Contacts & Notification Module

### Add Trusted Contact

| API Endpoint      | HTTP Method |             Description             |
| ----------------- | :---------: | :---------------------------------: |
| /api/contacts/add |   `POST`    | Adds a trusted contact for the user |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "contact": {
>     "name": "John Doe",
>     "phone": "+8801712345678",
>     "relationship": "friend"
>   }
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Trusted contact added successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid phone number format"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Trusted Contacts

| API Endpoint  | HTTP Method |              Description               |
| ------------- | :---------: | :------------------------------------: |
| /api/contacts |    `GET`    | Retrieves the list of trusted contacts |

> #### Request Parameters
>
> - `userId`: The ID of the user
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "contacts": [
>     {
>       "contactId": "cont123",
>       "name": "John Doe",
>       "phone": "+8801712345678",
>       "relationship": "friend"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Delete Trusted Contact

| API Endpoint         | HTTP Method |        Description        |
| -------------------- | :---------: | :-----------------------: |
| /api/contacts/delete |  `DELETE`   | Deletes a trusted contact |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "contactId": "cont123"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Trusted contact deleted successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid contact ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Update Notification Preferences

| API Endpoint                          | HTTP Method |                    Description                    |
| ------------------------------------- | :---------: | :-----------------------------------------------: |
| /api/notifications/update-preferences |    `PUT`    | Updates the notification preferences for the user |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "preferences": {
>     "emailAlerts": true,
>     "smsAlerts": false,
>     "pushNotifications": true
>   }
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Notification preferences updated successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid notification preference value"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

## Incident Report Module

### Submit Incident Report

| API Endpoint       | HTTP Method |          Description          |
| ------------------ | :---------: | :---------------------------: |
| /api/report/submit |   `POST`    | Submits a new incident report |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "incidentType": "theft",
>   "description": "My bag was stolen.",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "evidence": ["data:image/jpeg;base64,..."]
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 201 (`Created`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "reportId": "report123",
>   "message": "Incident report submitted successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid incident type"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get User Reports

| API Endpoint             | HTTP Method |                     Description                     |
| ------------------------ | :---------: | :-------------------------------------------------: |
| /api/report/user-reports |    `GET`    | Retrieves the list of reports submitted by the user |

> #### Request Parameters
>
> - `userId`: The ID of the user
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "reports": [
>     {
>       "reportId": "report123",
>       "incidentType": "theft",
>       "status": "pending",
>       "timestamp": "2023-10-01T12:00:00Z"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Report Details

| API Endpoint        | HTTP Method |                Description                 |
| ------------------- | :---------: | :----------------------------------------: |
| /api/report/details |    `GET`    | Retrieves the details of a specific report |

> #### Request Parameters
>
> - `reportId`: The ID of the report
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "report": {
>     "reportId": "report123",
>     "incidentType": "theft",
>     "description": "My bag was stolen.",
>     "location": {
>       "latitude": 23.8103,
>       "longitude": 90.4125
>     },
>     "status": "pending",
>     "timestamp": "2023-10-01T12:00:00Z",
>     "evidence": ["data:image/jpeg;base64,..."]
>   }
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid report ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Upload Evidence

| API Endpoint                | HTTP Method |              Description               |
| --------------------------- | :---------: | :------------------------------------: |
| /api/report/upload-evidence |   `POST`    | Uploads evidence for a specific report |

> #### Request Body
>
> ```json
> {
>   "reportId": "report123",
>   "evidence": ["data:image/jpeg;base64,..."]
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Evidence uploaded successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid report ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Update Report Visibility

| API Endpoint                  | HTTP Method |            Description             |
| ----------------------------- | :---------: | :--------------------------------: |
| /api/report/update-visibility |    `PUT`    | Updates the visibility of a report |

> #### Request Body
>
> ```json
> {
>   "reportId": "report123",
>   "isVisible": false
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Report visibility updated."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid report ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

## Responder Module

### Accept/Reject Alert

| API Endpoint                  | HTTP Method |                  Description                  |
| ----------------------------- | :---------: | :-------------------------------------------: |
| /api/responder/alert-response |   `POST`    | Responds to an incoming alert (accept/reject) |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "userId": "responder123",
>   "response": "accept"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Alert response recorded."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### View User Location

| API Endpoint                 | HTTP Method |                      Description                       |
| ---------------------------- | :---------: | :----------------------------------------------------: |
| /api/responder/user-location |    `GET`    | Retrieves the current location of the user in distress |

> #### Request Parameters
>
> - `alertId`: The ID of the alert
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   }
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Contact User

| API Endpoint                | HTTP Method |          Description          |
| --------------------------- | :---------: | :---------------------------: |
| /api/responder/contact-user |   `POST`    | Contacts the user in distress |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "userId": "responder123",
>   "message": "Help is on the way!"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Contact message sent to the user."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### View Evidence

| API Endpoint            | HTTP Method |                 Description                 |
| ----------------------- | :---------: | :-----------------------------------------: |
| /api/responder/evidence |    `GET`    | Retrieves the evidence for a specific alert |

> #### Request Parameters
>
> - `alertId`: The ID of the alert
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "evidence": ["data:image/jpeg;base64,..."]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Update Alert Status

| API Endpoint                       | HTTP Method |          Description           |
| ---------------------------------- | :---------: | :----------------------------: |
| /api/responder/update-alert-status |    `PUT`    | Updates the status of an alert |

> #### Request Body
>
> ```json
> {
>   "alertId": "abc123",
>   "status": "in_progress"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Alert status updated."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Get Assigned Alerts

| API Endpoint                   | HTTP Method |                      Description                       |
| ------------------------------ | :---------: | :----------------------------------------------------: |
| /api/responder/assigned-alerts |    `GET`    | Retrieves the list of alerts assigned to the responder |

> #### Request Parameters
>
> - `userId`: The ID of the responder
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "alerts": [
>     {
>       "alertId": "abc123",
>       "incidentType": "theft",
>       "status": "pending",
>       "timestamp": "2023-10-01T12:00:00Z"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Update Responder Status

| API Endpoint                 | HTTP Method |            Description            |
| ---------------------------- | :---------: | :-------------------------------: |
| /api/responder/update-status |    `PUT`    | Updates the status of a responder |

> #### Request Body
>
> ```json
> {
>   "userId": "responder123",
>   "status": "available"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "Responder status updated."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid user ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

### Submit Incident Report

| API Endpoint                 | HTTP Method |                   Description                    |
| ---------------------------- | :---------: | :----------------------------------------------: |
| /api/responder/submit-report |   `POST`    | Submits an incident report on behalf of the user |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "incidentType": "theft",
>   "description": "My bag was stolen.",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "evidence": ["data:image/jpeg;base64,..."]
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 201 (`Created`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "reportId": "report123",
>   "message": "Incident report submitted successfully."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid incident type"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```

---

## Admin Module

### Get All Alerts

| API Endpoint      | HTTP Method |           Description            |
| ----------------- | :---------: | :------------------------------: |
| /api/admin/alerts |    `GET`    | Retrieves the list of all alerts |

> #### Request Parameters
>
> - `status`: (optional) Filter by alert status
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "alerts": [
>     {
>       "alertId": "abc123",
>       "userId": "12345",
>       "status": "active",
>       "timestamp": "2023-10-01T12:00:00Z"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Admin not authenticated"
> }
> ```

---

### Get Alert Statistics

| API Endpoint                | HTTP Method |           Description           |
| --------------------------- | :---------: | :-----------------------------: |
| /api/admin/alert-statistics |    `GET`    | Retrieves statistics for alerts |

> #### Request Parameters
>
> - `timeRange`: (optional) Filter by time range
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "statistics": {
>     "totalAlerts": 100,
>     "activeAlerts": 10,
>     "resolvedAlerts": 90
>   }
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Admin not authenticated"
> }
> ```

---

### Manage Reports

| API Endpoint       | HTTP Method |                Description                 |
| ------------------ | :---------: | :----------------------------------------: |
| /api/admin/reports |    `GET`    | Retrieves the list of all incident reports |

> #### Request Parameters
>
> - `status`: (optional) Filter by report status
>
> #### Response - Success
>
> ```json
> {
>   "success": true,
>   "reports": [
>     {
>       "reportId": "report123",
>       "userId": "12345",
>       "status": "pending",
>       "timestamp": "2023-10-01T12:00:00Z"
>     }
>   ]
> }
> ```

> #### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Admin not authenticated"
> }
> ```

---

### Update System Settings

| API Endpoint        | HTTP Method |         Description         |
| ------------------- | :---------: | :-------------------------: |
| /api/admin/settings |    `PUT`    | Updates the system settings |

> #### Request Body
>
> ```json
> {
>   "settingName": "maxAlertRadius",
>   "settingValue": "500"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "message": "System settings updated."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid setting value"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Admin not authenticated"
> }
> ```

---

## AI Chat Helper (Optional)

### Chat with AI

| API Endpoint | HTTP Method |              Description              |
| ------------ | :---------: | :-----------------------------------: |
| /api/ai/chat |   `POST`    | Sends a message to the AI chat helper |

> #### Request Body
>
> ```json
> {
>   "userId": "12345",
>   "message": "What should I do in an emergency?"
> }
> ```
>
>  </br>

> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "response": "In an emergency, try to remain calm and call for help immediately."
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid user ID"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "User not authenticated"
> }
> ```
