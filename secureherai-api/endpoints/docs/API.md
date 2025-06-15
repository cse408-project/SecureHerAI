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
    - [Register](#register)
    - [Password Reset](#password-reset)
    - [Profile Management](#profile-management)
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

### Register

| API Endpoint          | HTTP Method |         Description          |
| --------------------- | :---------: | :--------------------------: |
| [api/auth/register]() |   `POST`    | Registers a new user account |

> ### Request - User Registration
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
>
> ### Request - Responder Registration
>
> #### Request Body
>
> ```json
> {
>   "fullName": "Officer John Smith",
>   "email": "john.smith@police.gov.bd",
>   "password": "password123",
>   "phoneNumber": "+8801712345678",
>   "dateOfBirth": "1985-03-20",
>   "role": "RESPONDER",
>   "responderType": "POLICE",
>   "badgeNumber": "POL-001"
> }
> ```
>
> #### Responder Types:
> - `POLICE` - Police Officer
> - `MEDICAL` - Medical Professional
> - `FIRE` - Fire Department
> - `SECURITY` - Security Personnel
> - `OTHER` - Other Emergency Responder
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
>   "message": "User registered successfully"
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 409 (`Conflict`)
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
>   "error": "Badge number already registered"
> }
> ```
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Password must be at least 8 characters long"
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

---

### Password Reset

| API Endpoint                 | HTTP Method |           Description            |
| ---------------------------- | :---------: | :------------------------------: |
| [api/auth/forgot-password]() |   `POST`    | Initiates password reset process |

> ### Request
>
> #### Request Body
>
> ```json
> {
>   "email": "user@example.com"
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
>   "message": "Password reset instructions sent to your email"
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "Email not found"
> }
> ```

| API Endpoint                | HTTP Method |                  Description                   |
| --------------------------- | :---------: | :--------------------------------------------: |
| [api/auth/reset-password]() |   `POST`    | Completes password reset with token from email |

> ### Request
>
> #### Request Body
>
> ```json
> {
>   "token": "reset_token_from_email",
>   "newPassword": "new_password123"
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
>   "message": "Password reset successful"
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
>   "error": "Invalid or expired token"
> }
> ```

---

### Profile Management

| API Endpoint         | HTTP Method |            Description             |
| -------------------- | :---------: | :--------------------------------: |
| [api/user/profile]() |    `GET`    | Retrieves user profile information (role-based response) |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
>  </br>

> ### Response - Success (USER role)
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "data": {
>     "userId": "12345",
>     "fullName": "Jane Doe",
>     "email": "user@example.com",
>     "phoneNumber": "+8801712345678",
>     "profilePicture": "base64_encoded_image_data",
>     "dateOfBirth": "1990-01-01",
>     "role": "USER",
>     "notificationPreferences": {
>       "emailAlerts": true,
>       "smsAlerts": true,
>       "pushNotifications": true
>     }
>   }
> }
> ```

> ### Response - Success (RESPONDER role)
>
> #### Response Code: 200 (`OK`)
>
> #### Response Body
>
> ```json
> {
>   "success": true,
>   "data": {
>     "userId": "67890",
>     "fullName": "Officer John Smith",
>     "email": "officer@police.gov.bd",
>     "phoneNumber": "+8801712345678",
>     "profilePicture": "base64_encoded_image_data",
>     "dateOfBirth": "1985-03-20",
>     "role": "RESPONDER",
>     "notificationPreferences": {
>       "emailAlerts": true,
>       "smsAlerts": true,
>       "pushNotifications": true
>     },
>     "responderInfo": {
>       "responderType": "POLICE",
>       "badgeNumber": "POL-001",
>       "status": "AVAILABLE",
>       "isActive": true,
>       "lastStatusUpdate": "2025-06-15T10:30:00Z"
>     }
>   }
> }
> ```
>
> <br>

> ### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Authentication token is invalid or expired"
> }
> ```

---

### Update Profile

| API Endpoint         | HTTP Method |           Description            |
| -------------------- | :---------: | :------------------------------: |
| [api/user/profile]() |    `PUT`    | Updates user profile information (includes responder status for responders) |

> ### Request - User Profile Update
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "fullName": "Jane Smith",
>   "phoneNumber": "+8801712345679",
>   "profilePicture": "base64_encoded_image_data"
> }
> ```

> ### Request - Responder Status Update
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "status": "AVAILABLE"
> }
> ```
>
> #### Available Status Values:
> - `AVAILABLE` - Responder is available for new alerts
> - `BUSY` - Responder is currently handling an alert
> - `OFF_DUTY` - Responder is not available

> ### Request - Combined Profile and Status Update (Responders)
>
> #### Request Body
>
> ```json
> {
>   "fullName": "Officer John Smith Updated",
>   "phoneNumber": "+8801712345679", 
>   "profilePicture": "base64_encoded_image_data",
>   "status": "BUSY"
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
>   "message": "Profile updated successfully"
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
> ```json
> {
>   "success": false,
>   "error": "Invalid status. Must be AVAILABLE, BUSY, or OFF_DUTY"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Phone number already in use"
> }
> ```
>
> ```json
> {
>   "success": false,
>   "error": "Responder profile not found"
> }
> ```
>
> #### Response Code: 413 (`Payload Too Large`)
>
> ```json
> {
>   "success": false,
>   "error": "Profile picture exceeds maximum allowed size of 2MB"
> }
> ```

---

## SOS Alert System Module

### Trigger SOS Alert

| API Endpoint        | HTTP Method |                   Description                   |
| ------------------- | :---------: | :---------------------------------------------: |
| [api/sos/trigger]() |   `POST`    | Triggers an SOS alert with location information |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "latitude": 23.7915,
>   "longitude": 90.4023,
>   "triggerMethod": "manual", // manual, voice, automatic
>   "audioRecording": "base64_encoded_audio", // optional
>   "alertMessage": "I feel unsafe near Gulshan 2" // optional
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
>   "alertId": "sos-123456",
>   "timestamp": "2025-05-13T14:30:45Z",
>   "message": "SOS alert triggered successfully. Help is on the way.",
>   "notifiedContacts": [
>     {
>       "name": "John Doe",
>       "status": "notified"
>     },
>     {
>       "name": "Emergency Services",
>       "status": "dispatched"
>     }
>   ]
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid location coordinates"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid or expired token"
> }
> ```
>
> #### Response Code: 429 (`Too Many Requests`)
>
> ```json
> {
>   "success": false,
>   "reportId": "misuse-789",
>   "error": "Request detected as potential misuse"
> }
> ```

---

### Voice Command Detection

| API Endpoint               | HTTP Method |              Description              |
| -------------------------- | :---------: | :-----------------------------------: |
| [api/sos/voice-analysis]() |   `POST`    | Analyzes audio for emergency keywords |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "audioData": "base64_encoded_audio",
>   "language": "en-US",
>   "context": {
>     "location": {
>       "latitude": 23.7915,
>       "longitude": 90.4023
>     },
>     "timestamp": "2025-05-13T14:30:45Z"
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
>   "transcription": "I need help, there's an emergency",
>   "detectedKeywords": ["help", "emergency", "danger"],
>   "primaryEmotion": "fear",
>   "confidence": 0.85,
>   "intensity": 0.85,
>   "secondaryEmotions": ["anxiety", "distress"],
>   "sentimentScore": -0.8,
>   "action": "trigger_sos",
>   "analysisDetails": {
>     "language": "en-US",
>     "processingTime": "0.5s"
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid or missing audio data"
> }
> ```
>
> #### Response Code: 422 (`Unprocessable Entity`)
>
> ```json
> {
>   "success": false,
>   "error": "Audio quality too low for analysis"
> }
> ```

---

### Cancel SOS Alert

| API Endpoint                 | HTTP Method |         Description         |
| ---------------------------- | :---------: | :-------------------------: |
| [api/sos/cancel/{alertId}]() |   `POST`    | Cancels an active SOS alert |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "reason": "False alarm",
>   "additionalInfo": "Accidentally triggered" // optional
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
>   "message": "SOS alert canceled successfully",
>   "alertId": "sos-123456",
>   "notifiedContacts": [
>     {
>       "name": "John Doe",
>       "status": "notified_of_cancellation"
>     },
>     {
>       "name": "Emergency Services",
>       "status": "canceled"
>     }
>   ]
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "Alert ID not found or already expired"
> }
> ```
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "error": "You don't have permission to cancel this alert"
> }
> ```

---

### Get Active Alerts

| API Endpoint       | HTTP Method |          Description          |
| ------------------ | :---------: | :---------------------------: |
| [api/sos/active]() |    `GET`    | Gets user's active SOS alerts |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
>   "activeAlerts": [
>     {
>       "alertId": "sos-123456",
>       "timestamp": "2025-05-13T14:30:45Z",
>       "location": {
>         "latitude": 23.7915,
>         "longitude": 90.4023,
>         "address": "Gulshan Avenue, Dhaka"
>       },
>       "respondersAssigned": true,
>       "eta": "5 minutes",
>       "status": "help_dispatched"
>     }
>   ]
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Authentication required"
> }
> ```

---

## Fake Alert Detection Module

### Verify Alert

| API Endpoint                    | HTTP Method |              Description              |
| ------------------------------- | :---------: | :-----------------------------------: |
| [api/alerts/verify/{alertId}]() |   `POST`    | Verifies the authenticity of an alert |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "verificationMethod": "voice_recognition", // voice_recognition, location_history, ai_analysis
>   "additionalData": {
>     "voiceSample": "base64_encoded_audio", // if using voice verification
>     "locationHistory": [
>       {
>         "latitude": 23.7915,
>         "longitude": 90.4023,
>         "timestamp": "2025-05-13T14:28:45Z"
>       }
>     ] // if using location history
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
>   "verified": true,
>   "confidence": 0.95,
>   "analysisDetails": {
>     "voiceMatch": "confirmed",
>     "locationConsistency": "confirmed",
>     "patternAnalysis": "genuine_emergency"
>   }
> }
> ```

> ### Response - Error
>
> #### Response Code: 400 (`Bad Request`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "invalid_verification_method",
>   "message": "The provided verification method is not supported",
>   "supportedMethods": ["voice_recognition", "location_history", "ai_analysis"]
> }
> ```
>
> #### Response Code: 404 (`Not Found`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "alert_not_found",
>   "message": "The specified alert ID does not exist or has expired"
> }
> ```

---

### Get Alert Status

| API Endpoint                    | HTTP Method |             Description              |
| ------------------------------- | :---------: | :----------------------------------: |
| [api/alerts/status/{alertId}]() |    `GET`    | Gets verification status of an alert |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
>   "alertId": "sos-123456",
>   "status": "verified",
>   "verificationDetails": {
>     "method": "ai_analysis",
>     "timestamp": "2025-05-13T14:35:20Z",
>     "confidence": 0.95
>   },
>   "activeResponders": 2,
>   "estimatedArrivalTime": "2025-05-13T14:40:00Z"
> }
> ```

> ### Response - Error
>
> #### Response Code: 403 (`Forbidden`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "access_denied",
>   "message": "You do not have permission to access this alert"
> }
> ```

---

## Map & Route Tracking Module

### Start Journey Tracking

| API Endpoint           | HTTP Method |       Description       |
| ---------------------- | :---------: | :---------------------: |
| [api/tracking/start]() |   `POST`    | Starts journey tracking |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "startLocation": {
>     "latitude": 23.7915,
>     "longitude": 90.4023,
>     "address": "Gulshan Avenue, Dhaka"
>   },
>   "destination": {
>     "latitude": 23.8103,
>     "longitude": 90.4125,
>     "address": "Banani, Dhaka"
>   },
>   "estimatedArrivalTime": "2025-05-13T15:30:00Z",
>   "shareWith": ["contact_id_1", "contact_id_2"] // optional
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
>   "trackingId": "trip-123456",
>   "sharingUrl": "https://secureher.com/track/abc123",
>   "notifiedContacts": [
>     {
>       "name": "John Doe",
>       "status": "notified"
>     }
>   ],
>   "safeRouteRecommendation": {
>     "routePolyline": "encoded_polyline_string",
>     "safetyRating": 4.5,
>     "estimatedTime": "25 minutes"
>   }
> }
> ```

> ### Response - Error
>
> #### Response Code: 400 (`Bad Request`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "Invalid destination address provided."
> }
> ```

---

### Update Location

| API Endpoint                     | HTTP Method |                   Description                    |
| -------------------------------- | :---------: | :----------------------------------------------: |
| [api/tracking/update-location]() |   `POST`    | Updates current location during journey tracking |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "trackingId": "trip-123456",
>   "latitude": 23.8012,
>   "longitude": 90.409,
>   "timestamp": "2025-05-13T14:45:20Z"
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
>   "updatedEta": "2025-05-13T15:35:00Z",
>   "remainingDistance": "1.2 km",
>   "safetyStatus": {
>     "currentAreaRating": 4.2,
>     "warnings": [] // empty if no warnings
>   }
> }
> ```

> ### Response - Error
>
> #### Response Code: 404 (`Not Found`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "Tracking ID not found."
> }
> ```

---

### End Journey Tracking

| API Endpoint         | HTTP Method |      Description      |
| -------------------- | :---------: | :-------------------: |
| [api/tracking/end]() |   `POST`    | Ends journey tracking |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "trackingId": "trip-123456",
>   "endLocation": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "arrived": true,
>   "feedback": {
>     "safetyRating": 5,
>     "comments": "Felt safe throughout the journey"
>   } // optional
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
>   "message": "Journey tracking ended successfully",
>   "notifiedContacts": [
>     {
>       "name": "John Doe",
>       "status": "notified_of_arrival"
>     }
>   ],
>   "journeySummary": {
>     "startTime": "2025-05-13T14:30:00Z",
>     "endTime": "2025-05-13T15:02:15Z",
>     "totalDistance": "3.5 km",
>     "averageSafetyRating": 4.3
>   }
> }
> ```

> ### Response - Error
>
> #### Response Code: 403 (`Forbidden`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "User not authorized to end this journey."
> }
> ```

---

### Get Responder Location

| API Endpoint                         | HTTP Method |             Description              |
| ------------------------------------ | :---------: | :----------------------------------: |
| [api/tracking/responder/{alertId}]() |    `GET`    | Gets location of emergency responder |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
>   "responderInfo": {
>     "id": "responder-789",
>     "name": "Officer Khan",
>     "type": "Police",
>     "location": {
>       "latitude": 23.795,
>       "longitude": 90.408
>     },
>     "eta": "3 minutes",
>     "status": "en_route"
>   }
> }
> ```

> ### Response - Error
>
> #### Response Code: 400 (`Bad Request`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "Invalid alert ID."
> }
> ```

---

### Get ETA

| API Endpoint                      | HTTP Method |          Description           |
| --------------------------------- | :---------: | :----------------------------: |
| [api/tracking/eta/{trackingId}]() |    `GET`    | Gets estimated time of arrival |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
>   "etaInfo": {
>     "originalEta": "2025-05-13T15:30:00Z",
>     "currentEta": "2025-05-13T15:35:00Z",
>     "delay": "5 minutes",
>     "remainingDistance": "1.2 km",
>     "remainingTime": "20 minutes"
>   }
> }
> ```

> ### Response - Error
>
> #### Response Code: 404 (`Not Found`)
>
> #### Response Body
>
> ```json
> {
>   "success": false,
>   "error": "Tracking ID not found."
> }
> ```

---

## Heat Map Module

### Get Heat Map Data

| API Endpoint         | HTTP Method |              Description               |
| -------------------- | :---------: | :------------------------------------: |
| [api/heatmap/data]() |    `GET`    | Gets safety heat map data for a region |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> centerLat=23.7915
> centerLng=90.4023
> radius=1000
> timeRange=7d
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
>   "heatMapData": {
>     "center": {
>       "latitude": 23.7915,
>       "longitude": 90.4023
>     },
>     "radius": 1000,
>     "timeRange": "7d",
>     "riskZones": [
>       {
>         "latitude": 23.792,
>         "longitude": 90.403,
>         "riskLevel": "high",
>         "incidentCount": 5,
>         "lastIncident": "2025-05-12T22:30:00Z"
>       },
>       {
>         "latitude": 23.791,
>         "longitude": 90.4015,
>         "riskLevel": "medium",
>         "incidentCount": 2,
>         "lastIncident": "2025-05-11T19:15:00Z"
>       }
>     ],
>     "safetyScore": 3.5,
>     "lastUpdated": "2025-05-13T14:00:00Z"
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid radius value. Must be between 100 and 5000 meters"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Authentication token is invalid or expired"
> }
> ```

---

### Get Safe Routes

| API Endpoint                | HTTP Method |                    Description                    |
| --------------------------- | :---------: | :-----------------------------------------------: |
| [api/heatmap/safe-routes]() |    `GET`    | Gets safe route suggestions between two locations |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> startLat=23.7915
> startLng=90.4023
> endLat=23.8103
> endLng=90.4125
> travelMode=walking
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
>   "routes": [
>     {
>       "id": "route-1",
>       "polyline": "encoded_polyline_string",
>       "safetyRating": 4.8,
>       "distance": "3.5 km",
>       "duration": "30 minutes",
>       "riskAreas": []
>     },
>     {
>       "id": "route-2",
>       "polyline": "encoded_polyline_string",
>       "safetyRating": 4.2,
>       "distance": "3.1 km",
>       "duration": "25 minutes",
>       "riskAreas": [
>         {
>           "latitude": 23.8012,
>           "longitude": 90.409,
>           "riskLevel": "medium",
>           "description": "Low visibility area"
>         }
>       ]
>     }
>   ]
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid travel mode. Supported modes: walking, driving, cycling"
> }
> ```
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "No safe routes found between the specified locations"
> }
> ```

---

### Report Area Safety

| API Endpoint                  | HTTP Method |           Description            |
| ----------------------------- | :---------: | :------------------------------: |
| [api/heatmap/report-safety]() |   `POST`    | Submit safety rating for an area |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "latitude": 23.8012,
>   "longitude": 90.409,
>   "safetyRating": 2,
>   "comment": "Poor lighting at night",
>   "timeOfDay": "night",
>   "categories": ["lighting", "isolation"]
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
>   "message": "Safety report submitted successfully",
>   "reportId": "report-123456",
>   "updatedAreaRating": 2.5,
>   "contributionPoints": 5
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid safety rating. Must be between 1 and 5"
> }
> ```
>
> #### Response Code: 429 (`Too Many Requests`)
>
> ```json
> {
>   "success": false,
>   "error": "Too many reports submitted. Please try again in 1 hour"
> }
> ```

---

### Get Risk Assessment

| API Endpoint                    | HTTP Method |                Description                |
| ------------------------------- | :---------: | :---------------------------------------: |
| [api/heatmap/risk-assessment]() |   `POST`    | Get risk assessment for a planned journey |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "startLocation": {
>     "latitude": 23.7915,
>     "longitude": 90.4023
>   },
>   "destination": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "travelMode": "walking",
>   "plannedTime": "2025-05-13T22:00:00Z" // optional
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
>   "overallRisk": "medium",
>   "riskScore": 3.2,
>   "riskFactors": [
>     {
>       "factor": "time_of_day",
>       "risk": "high",
>       "description": "Late night travel increases risk"
>     },
>     {
>       "factor": "route_safety",
>       "risk": "medium",
>       "description": "Parts of the route have low lighting"
>     },
>     {
>       "factor": "incident_history",
>       "risk": "low",
>       "description": "Few reported incidents in the past month"
>     }
>   ],
>   "recommendations": [
>     "Consider taking a safer alternative route",
>     "Travel with a companion if possible",
>     "Share your journey with trusted contacts"
>   ],
>   "saferAlternatives": {
>     "routes": ["route-1", "route-3"],
>     "timeOfDay": ["morning", "afternoon"]
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid coordinates. Start and destination locations must be within supported area"
> }
> ```
>
> #### Response Code: 503 (`Service Unavailable`)
>
> ```json
> {
>   "success": false,
>   "error": "Risk assessment service temporarily unavailable. Please try again later"
> }
> ```

---

## Contacts & Notification Module

### Add Trusted Contact

| API Endpoint         | HTTP Method |           Description            |
| -------------------- | :---------: | :------------------------------: |
| [api/contacts/add]() |   `POST`    | Adds a trusted emergency contact |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "name": "John Doe",
>   "relationship": "Brother",
>   "phoneNumber": "+8801812345678",
>   "email": "john@example.com", // optional
>   "notificationPreferences": {
>     "sms": true,
>     "email": true,
>     "push": true
>   },
>   "shareLocation": true
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
>   "message": "Contact added successfully",
>   "contactId": "contact-123456",
>   "invitationSent": true
> }
> ```
>
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
> #### Response Code: 409 (`Conflict`)
>
> ```json
> {
>   "success": false,
>   "error": "Contact with this phone number already exists"
> }
> ```

---

### Get Trusted Contacts

| API Endpoint          | HTTP Method |         Description          |
| --------------------- | :---------: | :--------------------------: |
| [api/contacts/list]() |    `GET`    | Gets user's trusted contacts |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
>   "contacts": [
>     {
>       "id": "contact-123456",
>       "name": "John Doe",
>       "relationship": "Brother",
>       "phoneNumber": "+8801812345678",
>       "email": "john@example.com",
>       "notificationPreferences": {
>         "sms": true,
>         "email": true,
>         "push": true
>       },
>       "shareLocation": true,
>       "status": "active"
>     },
>     {
>       "id": "contact-123457",
>       "name": "Emergency Services",
>       "relationship": "Emergency",
>       "phoneNumber": "999",
>       "notificationPreferences": {
>         "sms": true,
>         "email": false,
>         "push": false
>       },
>       "shareLocation": true,
>       "status": "active"
>     }
>   ]
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Authentication token is invalid or expired"
> }
> ```

---

### Delete Trusted Contact

| API Endpoint                        | HTTP Method |        Description        |
| ----------------------------------- | :---------: | :-----------------------: |
| [api/contacts/delete/{contactId}]() |  `DELETE`   | Removes a trusted contact |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
>   "message": "Contact removed successfully"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "Contact not found"
> }
> ```
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "error": "Cannot delete emergency services contact"
> }
> ```

---

### Update Notification Preferences

| API Endpoint                      | HTTP Method |           Description            |
| --------------------------------- | :---------: | :------------------------------: |
| [api/notifications/preferences]() |    `PUT`    | Updates notification preferences |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "emailAlerts": true,
>   "smsAlerts": true,
>   "pushNotifications": true,
>   "journeyUpdates": {
>     "start": true,
>     "end": true,
>     "deviation": true
>   },
>   "safetyAlerts": {
>     "highRiskArea": true,
>     "journeyDelay": true
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
>   "message": "Notification preferences updated successfully"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "At least one notification method must be enabled"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Authentication token is invalid or expired"
> }
> ```

---

## Incident Report Module

### Submit Incident Report

| API Endpoint           | HTTP Method |          Description          |
| ---------------------- | :---------: | :---------------------------: |
| [api/reports/submit]() |   `POST`    | Submits a new incident report |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "incidentType": "harassment",
>   "description": "Verbal harassment while walking on Gulshan Avenue",
>   "location": {
>     "latitude": 23.7915,
>     "longitude": 90.4023,
>     "address": "Gulshan Avenue, Dhaka"
>   },
>   "incidentTime": "2025-05-12T18:30:00Z",
>   "visibility": "public", // public, officials_only, private
>   "anonymous": false,
>   "evidenceFiles": [] // Will be uploaded separately
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
>   "message": "Incident report submitted successfully",
>   "reportId": "report-123456",
>   "submissionTime": "2025-05-12T19:15:30Z",
>   "status": "submitted"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid incident type. Supported types: harassment, theft, assault, other"
> }
> ```
>
> #### Response Code: 429 (`Too Many Requests`)
>
> ```json
> {
>   "success": false,
>   "error": "Too many reports submitted. Please try again in 24 hours"
> }
> ```

---

### Get User Reports

| API Endpoint         | HTTP Method |              Description               |
| -------------------- | :---------: | :------------------------------------: |
| [api/reports/user]() |    `GET`    | Gets all reports submitted by the user |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> status=all (or submitted, under_review, resolved)
> page=1
> limit=10
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
>   "reports": [
>     {
>       "reportId": "report-123456",
>       "incidentType": "harassment",
>       "description": "Verbal harassment while walking on Gulshan Avenue",
>       "location": {
>         "address": "Gulshan Avenue, Dhaka"
>       },
>       "incidentTime": "2025-05-12T18:30:00Z",
>       "submissionTime": "2025-05-12T19:15:30Z",
>       "status": "under_review",
>       "visibility": "public",
>       "hasEvidence": false
>     },
>     {
>       "reportId": "report-123457",
>       "incidentType": "theft",
>       "description": "Phone snatching incident near Banani",
>       "location": {
>         "address": "Banani Road 11, Dhaka"
>       },
>       "incidentTime": "2025-05-10T16:15:00Z",
>       "submissionTime": "2025-05-10T17:30:25Z",
>       "status": "resolved",
>       "visibility": "officials_only",
>       "hasEvidence": true
>     }
>   ],
>   "pagination": {
>     "total": 2,
>     "page": 1,
>     "limit": 10,
>     "totalPages": 1
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid status filter. Supported values: all, submitted, under_review, resolved"
> }
> ```
>
> #### Response Code: 401 (`Unauthorized`)
>
> ```json
> {
>   "success": false,
>   "error": "Authentication token is invalid or expired"
> }
> ```

---

### Get Report Details

| API Endpoint               | HTTP Method |                    Description                    |
| -------------------------- | :---------: | :-----------------------------------------------: |
| [api/reports/{reportId}]() |    `GET`    | Gets detailed information about a specific report |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
>   "report": {
>     "reportId": "report-123456",
>     "incidentType": "harassment",
>     "description": "Verbal harassment while walking on Gulshan Avenue",
>     "location": {
>       "latitude": 23.7915,
>       "longitude": 90.4023,
>       "address": "Gulshan Avenue, Dhaka"
>     },
>     "incidentTime": "2025-05-12T18:30:00Z",
>     "submissionTime": "2025-05-12T19:15:30Z",
>     "status": "under_review",
>     "visibility": "public",
>     "hasEvidence": false,
>     "evidenceFiles": [],
>     "comments": [
>       {
>         "id": "comment-789",
>         "author": "Police Department",
>         "text": "Thank you for reporting. We've increased patrols in this area.",
>         "timestamp": "2025-05-13T10:25:12Z",
>         "isOfficial": true
>       }
>     ],
>     "actions": [
>       {
>         "type": "status_change",
>         "from": "submitted",
>         "to": "under_review",
>         "timestamp": "2025-05-12T20:05:45Z",
>         "by": "admin"
>       }
>     ],
>     "relatedReports": 3
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "Report not found or access denied"
> }
> ```
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "error": "You don't have permission to view this report"
> }
> ```

---

### Upload Evidence

| API Endpoint                               | HTTP Method |               Description               |
| ------------------------------------------ | :---------: | :-------------------------------------: |
| [api/reports/{reportId}/upload-evidence]() |   `POST`    | Uploads evidence for an incident report |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> Content-Type: multipart/form-data
> ```
>
> #### Form Data
>
> ```
> file: [binary data]
> type: image
> description: "Photo of the location where the incident occurred"
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
>   "message": "Evidence uploaded successfully",
>   "evidenceId": "evidence-456",
>   "fileUrl": "https://secureher.com/evidence/view/456"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid file type. Supported types: jpg, png, mp4, mp3"
> }
> ```
>
> #### Response Code: 413 (`Payload Too Large`)
>
> ```json
> {
>   "success": false,
>   "error": "File size exceeds maximum limit of 10MB"
> }
> ```

---

### Update Report Visibility

| API Endpoint                                 | HTTP Method |          Description           |
| -------------------------------------------- | :---------: | :----------------------------: |
| [api/reports/{reportId}/update-visibility]() |    `PUT`    | Updates visibility of a report |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "visibility": "officials_only",
>   "reason": "Sensitive information" // optional
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
>   "message": "Report visibility updated successfully",
>   "currentVisibility": "officials_only"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid visibility value. Supported values: public, officials_only, private"
> }
> ```
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "error": "Cannot change visibility of a resolved report"
> }
> ```

---

## Responder Module

> **Note**: Responder profile management (GET/PUT responder profile and status updates) has been consolidated into the unified `api/user/profile` endpoints. See the [Profile Management](#profile-management) section above for details.

### Accept/Reject Alert

| API Endpoint                   | HTTP Method | Description                       |
| ------------------------------ | :---------: | --------------------------------- |
| [api/responder/alert/action]() |   `POST`    | Accept or reject an alert request |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "alertId": "alert123",
>   "action": "accept", // or "reject"
>   "responderId": "resp123",
>   "reason": "On my way" // Optional for reject
> }
> ```
>
> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> ```json
> {
>   "success": true,
>   "message": "Alert accepted successfully",
>   "alertStatus": "accepted",
>   "eta": "5 minutes"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid action. Supported values: accept, reject"
> }
> ```
>
> #### Response Code: 409 (`Conflict`)
>
> ```json
> {
>   "success": false,
>   "error": "Alert has already been assigned to another responder"
> }
> ```

---

### View User Location

| API Endpoint                     | HTTP Method | Description                          |
| -------------------------------- | :---------: | ------------------------------------ |
| [api/responder/alert/location]() |    `GET`    | Get the location of user in distress |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> alertId=alert123
> ```
>
> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> ```json
> {
>   "success": true,
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125,
>     "address": "Dhaka, Bangladesh",
>     "lastUpdated": "2024-03-20T10:30:00Z",
>     "accuracy": "10m"
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "Alert not found or location data unavailable"
> }
> ```
>
> #### Response Code: 410 (`Gone`)
>
> ```json
> {
>   "success": false,
>   "error": "Location data has expired. Please request user to update their location"
> }
> ```

---

### Contact User

| API Endpoint                    | HTTP Method | Description                            |
| ------------------------------- | :---------: | -------------------------------------- |
| [api/responder/alert/contact]() |   `POST`    | Initiate contact with user in distress |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "alertId": "alert123",
>   "responderId": "resp123",
>   "message": "Help is on the way",
>   "contactMethod": "voice", // or "text"
>   "priority": "high"
> }
> ```
>
> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> ```json
> {
>   "success": true,
>   "message": "Contact initiated successfully",
>   "sessionId": "session123",
>   "connectionStatus": "connected"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid contact method. Supported methods: voice, text"
> }
> ```
>
> #### Response Code: 503 (`Service Unavailable`)
>
> ```json
> {
>   "success": false,
>   "error": "Communication service temporarily unavailable"
> }
> ```

---

### View Evidence

| API Endpoint                     | HTTP Method | Description                       |
| -------------------------------- | :---------: | --------------------------------- |
| [api/responder/alert/evidence]() |    `GET`    | Get evidence related to the alert |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> alertId=alert123
> ```
>
> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> ```json
> {
>   "success": true,
>   "evidence": {
>     "images": ["url1", "url2"],
>     "audio": ["url1"],
>     "video": ["url1"],
>     "locationHistory": [
>       {
>         "timestamp": "2024-03-20T10:30:00Z",
>         "coordinates": {
>           "latitude": 23.8103,
>           "longitude": 90.4125
>         }
>       }
>     ],
>     "metadata": {
>       "deviceInfo": "iPhone 12",
>       "networkType": "4G",
>       "batteryLevel": 85
>     }
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 404 (`Not Found`)
>
> ```json
> {
>   "success": false,
>   "error": "No evidence available for this alert"
> }
> ```
>
> #### Response Code: 410 (`Gone`)
>
> ```json
> {
>   "success": false,
>   "error": "Evidence has expired and is no longer available"
> }
> ```

---

### Update Alert Status

| API Endpoint                   | HTTP Method | Description                   |
| ------------------------------ | :---------: | ----------------------------- |
| [api/responder/alert/status]() |    `PUT`    | Update the status of an alert |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "alertId": "alert123",
>   "status": "in_progress", // in_progress, resolved, escalated
>   "responderId": "resp123",
>   "notes": "Arrived at scene",
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   }
> }
> ```
>
> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> ```json
> {
>   "success": true,
>   "message": "Alert status updated successfully",
>   "currentStatus": "in_progress",
>   "timestamp": "2024-03-20T10:35:00Z"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid status. Supported values: in_progress, resolved, escalated"
> }
> ```
>
> #### Response Code: 409 (`Conflict`)
>
> ```json
> {
>   "success": false,
>   "error": "Cannot update status of a resolved alert"
> }
> ```

---

### Get Assigned Alerts

| API Endpoint             | HTTP Method | Description                          |
| ------------------------ | :---------: | ------------------------------------ |
| [api/responder/alerts]() |    `GET`    | Get all alerts assigned to responder |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> status=active
> page=1
> limit=10
> ```
>
> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> ```json
> {
>   "success": true,
>   "alerts": [
>     {
>       "alertId": "alert123",
>       "userId": "user456",
>       "status": "active",
>       "priority": "high",
>       "location": {
>         "latitude": 23.8103,
>         "longitude": 90.4125,
>         "address": "Dhaka, Bangladesh"
>       },
>       "timestamp": "2024-03-20T10:30:00Z",
>       "eta": "5 minutes",
>       "hasEvidence": true
>     }
>   ],
>   "pagination": {
>     "total": 1,
>     "page": 1,
>     "limit": 10
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid status filter. Supported values: active, resolved, all"
> }
> ```
>
> #### Response Code: 429 (`Too Many Requests`)
>
> ```json
> {
>   "success": false,
>   "error": "Too many requests. Please try again in 1 minute"
> }
> ```

---

### Update Responder Status

| API Endpoint             | HTTP Method | Description                            |
| ------------------------ | :---------: | -------------------------------------- |
| [api/responder/status]() |    `PUT`    | Update responder's availability status |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "responderId": "resp123",
>   "status": "available", // available, busy, off_duty
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "currentAssignment": "alert123" // optional
> }
> ```
>
> ### Response - Success
>
> #### Response Code: 200 (`OK`)
>
> ```json
> {
>   "success": true,
>   "message": "Status updated successfully",
>   "currentStatus": "available",
>   "lastUpdated": "2024-03-20T10:30:00Z"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid status. Supported values: available, busy, off_duty"
> }
> ```
>
> #### Response Code: 409 (`Conflict`)
>
> ```json
> {
>   "success": false,
>   "error": "Cannot go off-duty while handling active alerts"
> }
> ```

---

### Submit Incident Report

| API Endpoint             | HTTP Method | Description                            |
| ------------------------ | :---------: | -------------------------------------- |
| [api/responder/report]() |   `POST`    | Submit an incident report as responder |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "alertId": "alert123",
>   "responderId": "resp123",
>   "incidentType": "harassment",
>   "description": "Verbal harassment reported",
>   "actionTaken": "Escorted victim to safety",
>   "evidence": {
>     "images": ["url1"],
>     "audio": ["url1"]
>   },
>   "location": {
>     "latitude": 23.8103,
>     "longitude": 90.4125
>   },
>   "involvedParties": [
>     {
>       "type": "victim",
>       "details": "User reported harassment"
>     }
>   ]
> }
> ```
>
> ### Response - Success
>
> #### Response Code: 201 (`Created`)
>
> ```json
> {
>   "success": true,
>   "message": "Incident report submitted successfully",
>   "reportId": "report789",
>   "timestamp": "2024-03-20T10:35:00Z"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid incident type. Supported types: harassment, theft, assault, other"
> }
> ```
>
> #### Response Code: 409 (`Conflict`)
>
> ```json
> {
>   "success": false,
>   "error": "A report for this alert already exists"
> }
> ```

---

## Admin Module

### Get All Alerts

| API Endpoint         | HTTP Method |             Description             |
| -------------------- | :---------: | :---------------------------------: |
| [api/admin/alerts]() |    `GET`    | Gets all active alerts (admin only) |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> status=active
> page=1
> limit=20
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
>   "alerts": [
>     {
>       "alertId": "sos-123456",
>       "userId": "user-789",
>       "userName": "Jane Doe",
>       "location": {
>         "latitude": 23.7915,
>         "longitude": 90.4023,
>         "address": "Gulshan Avenue, Dhaka"
>       },
>       "timestamp": "2025-05-13T14:30:45Z",
>       "status": "active",
>       "triggerMethod": "manual",
>       "verificationStatus": "verified",
>       "respondersAssigned": [
>         {
>           "id": "responder-123",
>           "name": "Officer Khan",
>           "eta": "5 minutes"
>         }
>       ]
>     }
>   ],
>   "pagination": {
>     "total": 3,
>     "page": 1,
>     "limit": 20,
>     "totalPages": 1
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "error": "Insufficient admin privileges to access alerts"
> }
> ```
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid status filter. Supported values: active, resolved, all"
> }
> ```

---

### Get Alert Statistics

| API Endpoint                   | HTTP Method |            Description             |
| ------------------------------ | :---------: | :--------------------------------: |
| [api/admin/alert-statistics]() |    `GET`    | Gets alert statistics (admin only) |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> timeframe=monthly
> startDate=2025-04-01
> endDate=2025-05-13
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
>   "statistics": {
>     "totalAlerts": 145,
>     "verifiedAlerts": 132,
>     "falseAlerts": 13,
>     "averageResponseTime": "8 minutes",
>     "triggerMethods": {
>       "manual": 89,
>       "voice": 45,
>       "automatic": 11
>     },
>     "timeDistribution": [
>       {
>         "hour": 0,
>         "count": 12
>       },
>       {
>         "hour": 1,
>         "count": 8
>       }
>     ],
>     "locationHotspots": [
>       {
>         "area": "Gulshan",
>         "count": 35,
>         "averageResponseTime": "7 minutes"
>       },
>       {
>         "area": "Banani",
>         "count": 28,
>         "averageResponseTime": "9 minutes"
>       }
>     ]
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid date range. End date must be after start date"
> }
> ```
>
> #### Response Code: 503 (`Service Unavailable`)
>
> ```json
> {
>   "success": false,
>   "error": "Statistics service temporarily unavailable"
> }
> ```

---

### Manage Reports

| API Endpoint          | HTTP Method |                 Description                  |
| --------------------- | :---------: | :------------------------------------------: |
| [api/admin/reports]() |    `GET`    | Gets submitted incident reports (admin only) |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Query Parameters
>
> ```
> status=pending
> type=harassment
> page=1
> limit=20
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
>   "reports": [
>     {
>       "reportId": "report-123456",
>       "userId": "user-789",
>       "userName": "Jane Doe",
>       "incidentType": "harassment",
>       "description": "Verbal harassment while walking on Gulshan Avenue",
>       "location": {
>         "latitude": 23.7915,
>         "longitude": 90.4023,
>         "address": "Gulshan Avenue, Dhaka"
>       },
>       "incidentTime": "2025-05-12T18:30:00Z",
>       "submissionTime": "2025-05-12T19:15:30Z",
>       "status": "pending",
>       "visibility": "public",
>       "hasEvidence": false
>     }
>   ],
>   "pagination": {
>     "total": 12,
>     "page": 1,
>     "limit": 20,
>     "totalPages": 1
>   }
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid incident type. Supported types: harassment, theft, assault, other"
> }
> ```
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "error": "Insufficient admin privileges to access reports"
> }
> ```

---

### Update System Settings

| API Endpoint                  | HTTP Method |             Description              |
| ----------------------------- | :---------: | :----------------------------------: |
| [api/admin/system-settings]() |    `PUT`    | Updates system settings (admin only) |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "aiSensitivity": {
>     "voiceDetection": 0.8,
>     "emotionDetection": 0.7
>   },
>   "heatMapSettings": {
>     "updateFrequency": "hourly",
>     "dataRetentionDays": 90,
>     "defaultRadius": 500
>   },
>   "alertVerificationSettings": {
>     "automaticVerificationEnabled": true,
>     "minimumConfidenceThreshold": 0.75,
>     "requireSecondaryVerification": false
>   },
>   "emergencyServices": {
>     "policeNumber": "999",
>     "emergencyHelplineNumber": "112",
>     "automaticPoliceNotification": true
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
>   "message": "System settings updated successfully"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid sensitivity values. Must be between 0 and 1"
> }
> ```
>
> #### Response Code: 403 (`Forbidden`)
>
> ```json
> {
>   "success": false,
>   "error": "Insufficient admin privileges to update system settings"
> }
> ```

---

## AI Chat Helper (Optional)

| API Endpoint        | HTTP Method |          Description           |
| ------------------- | :---------: | :----------------------------: |
| [api/chat/assist]() |   `POST`    | Provides AI-powered assistance |

> ### Request
>
> #### Headers
>
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```
>
> #### Request Body
>
> ```json
> {
>   "query": "What should I do if I feel unsafe?",
>   "context": {
>     "location": {
>       "latitude": 23.7915,
>       "longitude": 90.4023
>     },
>     "timeOfDay": "night",
>     "userPreferences": {
>       "language": "en",
>       "assistanceLevel": "detailed"
>     }
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
>   "response": {
>     "text": "If you feel unsafe, here are the immediate steps you can take:\n1. Press the SOS button to alert emergency contacts\n2. Share your location with trusted contacts\n3. Move to a well-lit, populated area\n4. Call emergency services if needed",
>     "suggestedActions": [
>       {
>         "action": "trigger_sos",
>         "description": "Alert emergency contacts"
>       },
>       {
>         "action": "share_location",
>         "description": "Share your current location"
>       }
>     ],
>     "safetyTips": [
>       "Stay in well-lit areas",
>       "Keep your phone charged",
>       "Share your journey with trusted contacts"
>     ]
>   },
>   "confidence": 0.95,
>   "responseTime": "0.8s"
> }
> ```
>
> ### Response - Error Cases
>
> #### Response Code: 400 (`Bad Request`)
>
> ```json
> {
>   "success": false,
>   "error": "Invalid query format or missing required context"
> }
> ```
>
> #### Response Code: 503 (`Service Unavailable`)
>
> ```json
> {
>   "success": false,
>   "error": "AI assistance service temporarily unavailable"
> }
> ```

---
